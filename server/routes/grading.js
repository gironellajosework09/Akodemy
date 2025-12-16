import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { gradeSubmission, fetchTests } from '../services/gradingEngine.js'
import { getCacheStats, clearCache } from '../services/github/testFetcher.js'
import Challenge from '../models/Challenge.js'

const router = express.Router()

router.post('/grade', authenticateToken, async (req, res) => {
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

router.post('/fetch-tests', authenticateToken, async (req, res) => {
  try {
    const { language, exerciseSlug } = req.body

    if (!language || !exerciseSlug) {
      return res.status(400).json({ message: 'Language and exercise slug are required' })
    }

    const testData = await fetchTests(language, exerciseSlug)

    if (testData) {
      res.json({
        success: true,
        fileName: testData.fileName,
        path: testData.path,
        contentLength: testData.content?.length || 0
      })
    } else {
      res.status(404).json({
        success: false,
        message: `Could not fetch tests for ${exerciseSlug} in ${language}`
      })
    }
  } catch (error) {
    console.error('Test fetch error:', error)
    res.status(500).json({ message: 'Failed to fetch tests', error: error.message })
  }
})

router.get('/cache-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const stats = await getCacheStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ message: 'Failed to get cache stats', error: error.message })
  }
})

router.delete('/cache/:language/:slug', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Faculty access required' })
    }

    const { language, slug } = req.params
    const cleared = await clearCache(language, slug)
    
    res.json({ success: cleared })
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear cache', error: error.message })
  }
})

export default router
