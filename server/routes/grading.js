// Express routes for Grading endpoints.
import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { gradeSubmission } from '../services/canonical/gradingEngine.js'
import { getTestCases, getCacheStats as getCanonicalCacheStats } from '../services/canonical/testFetcher.js'
import { TestAlignmentAnalyzer, runTestAlignment } from '../services/canonical/testAlignment.js'
import { CanonicalTestConverter, convertAndSync, syncAllForLanguage } from '../services/canonical/testConverter.js'
import { ScoreVerificationService, verifyAndReport, ensureVerificationIndexes } from '../services/canonical/scoreVerification.js'
import ScoreMismatchLog from '../models/ScoreMismatchLog.js'
import { EXECUTION_CONTRACT } from '../services/canonical/executionContract.js'
import Challenge from '../models/Challenge.js'

// Route handlers for Grading APIs.
const router = express.Router()

router.use(authenticateToken)
router.use(requireRole('student', 'faculty'))

router.post('/grade', async (req, res) => {
  try {
    const { code, language, challengeId, exerciseSlug } = req.body

    if (!code || !language) {
      return res.status(400).json({ 
        message: 'Code and language are required',
        exercise: null,
        language: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        passRate: 0,
        competency: 'Not Started',
        errors: [{ test: 'validation', error: 'Missing required fields' }]
      })
    }

    let slug = exerciseSlug
    
    if (!slug && challengeId) {
      try {
        const challenge = await Challenge.findById(challengeId)
        if (challenge) {
          slug = challenge.exerciseSlug || challenge.slug
        }
      } catch (err) {
        console.error('Failed to fetch challenge:', err)
      }
    }

    if (!slug) {
      return res.status(400).json({
        message: 'Exercise slug or challenge ID is required',
        exercise: null,
        language,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        passRate: 0,
        competency: 'Not Started',
        errors: [{ test: 'validation', error: 'Missing exercise identifier' }]
      })
    }

    const result = await gradeSubmission(code, language, slug)

    res.json(result)
  } catch (error) {
    console.error('Grading error:', error)
    res.status(500).json({ 
      message: 'Grading failed', 
      error: error.message,
      exercise: null,
      language: req.body.language || null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      passRate: 0,
      competency: 'Not Started',
      errors: [{ test: 'system', error: error.message }]
    })
  }
})

router.post('/fetch-tests', async (req, res) => {
  try {
    const { exerciseSlug } = req.body

    if (!exerciseSlug) {
      return res.status(400).json({ message: 'Exercise slug is required' })
    }

    const testData = await getTestCases(exerciseSlug)

    res.json({
      success: true,
      exercise: testData.exercise,
      property: testData.property,
      totalCases: testData.cases.length,
      cases: testData.cases.map(c => ({
        uuid: c.uuid,
        description: c.description
      }))
    })
  } catch (error) {
    console.error('Test fetch error:', error)
    res.status(500).json({ message: 'Failed to fetch tests', error: error.message })
  }
})

router.get('/cache-stats', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const stats = await getCanonicalCacheStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get cache stats', error: error.message })
  }
})

router.post('/sync-canonical-tests', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const { syncAllCanonicalTests } = await import('../services/canonical/syncCanonicalTests.js')
    
    res.json({ message: 'Sync started. Check server logs for progress.' })
    
    syncAllCanonicalTests().then(result => {
      console.log('Canonical tests sync completed:', result.stats)
    }).catch(err => {
      console.error('Canonical tests sync failed:', err)
    })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ message: 'Failed to start sync', error: error.message })
  }
})

router.get('/sync-status', async (req, res) => {
  try {
    const stats = await Challenge.aggregate([
      {
        $group: {
          _id: '$canonicalTestsMeta.status',
          count: { $sum: 1 }
        }
      }
    ])
    
    const byLanguage = await Challenge.aggregate([
      { $match: { 'canonicalTestsMeta.status': 'success' } },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          totalTests: { $sum: '$canonicalTestsMeta.testCount' }
        }
      }
    ])
    
    res.json({
      statusCounts: stats,
      byLanguage
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get sync status', error: error.message })
  }
})

router.get('/execution-contract', (req, res) => {
  res.json(EXECUTION_CONTRACT)
})

router.post('/analyze-alignment', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const { language, exerciseSlug } = req.body

    if (!language) {
      return res.status(400).json({ message: 'Language is required' })
    }

    const result = await runTestAlignment(language, exerciseSlug)
    res.json(result)
  } catch (error) {
    console.error('Alignment analysis error:', error)
    res.status(500).json({ message: 'Analysis failed', error: error.message })
  }
})

router.post('/convert-tests', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const { exerciseSlug, language } = req.body

    if (!exerciseSlug || !language) {
      return res.status(400).json({ message: 'Exercise slug and language are required' })
    }

    const result = await convertAndSync(exerciseSlug, language)
    res.json(result)
  } catch (error) {
    console.error('Test conversion error:', error)
    res.status(500).json({ message: 'Conversion failed', error: error.message })
  }
})

router.post('/sync-all-tests', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const { language } = req.body

    if (!language) {
      return res.status(400).json({ message: 'Language is required' })
    }

    res.json({ message: 'Sync started. Check server logs for progress.' })

    syncAllForLanguage(language).then(result => {
      console.log(`Test sync completed for ${language}:`, result)
    }).catch(err => {
      console.error(`Test sync failed for ${language}:`, err)
    })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ message: 'Failed to start sync', error: error.message })
  }
})

router.post('/verify-scores', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const { limit, language, exerciseSlug, debugMode, autoCorrect } = req.body

    const report = await verifyAndReport({
      limit: limit || 50,
      language,
      exerciseSlug,
      debugMode: debugMode || false,
      autoCorrect: autoCorrect || false
    })

    res.json(report)
  } catch (error) {
    console.error('Score verification error:', error)
    res.status(500).json({ message: 'Verification failed', error: error.message })
  }
})

router.post('/verify-submission/:submissionId', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const { submissionId } = req.params
    const { debugMode, autoCorrect } = req.body

    const service = new ScoreVerificationService({
      debugMode: debugMode || false,
      autoCorrect: autoCorrect || false
    })

    const result = await service.verifySubmission(submissionId)
    res.json(result)
  } catch (error) {
    console.error('Submission verification error:', error)
    res.status(500).json({ message: 'Verification failed', error: error.message })
  }
})

router.post('/ensure-indexes', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    await ensureVerificationIndexes()
    res.json({ message: 'Indexes created successfully' })
  } catch (error) {
    console.error('Index creation error:', error)
    res.status(500).json({ message: 'Index creation failed', error: error.message })
  }
})

router.get('/mismatch-logs', async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const { limit = 50, language, exerciseSlug, corrected } = req.query
    
    const query = {}
    if (language) query.language = language
    if (exerciseSlug) query.exerciseSlug = exerciseSlug
    if (corrected !== undefined) query.corrected = corrected === 'true'

    const logs = await ScoreMismatchLog.find(query)
      .sort({ detectedAt: -1 })
      .limit(parseInt(limit))
      .lean()

    const stats = await ScoreMismatchLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          corrected: { $sum: { $cond: ['$corrected', 1, 0] } },
          avgScoreDiff: { $avg: { $abs: '$scoreDiff' } }
        }
      }
    ])

    res.json({
      logs,
      stats: stats[0] || { total: 0, corrected: 0, avgScoreDiff: 0 }
    })
  } catch (error) {
    console.error('Mismatch logs error:', error)
    res.status(500).json({ message: 'Failed to fetch logs', error: error.message })
  }
})

export default router



