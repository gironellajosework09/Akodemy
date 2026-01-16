// Express routes for Scoring endpoints.
import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { calculateScore } from '../services/scoring.js'
import { syncAllTestFiles, downloadExerciseTests, normalizeToExercismSlug } from '../services/exercismTestSync.js'
import Challenge from '../models/Challenge.js'

// Route handlers for Scoring APIs.
const router = express.Router()

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { code, language, challengeId } = req.body

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' })
    }

    let challengeSlug = null
    let testCases = []
    
    if (challengeId) {
      try {
        const challenge = await Challenge.findById(challengeId)
        if (challenge) {
          challengeSlug = challenge.slug
          testCases = challenge.testCases || []
        }
      } catch (err) {
        console.error('Failed to fetch challenge:', err)
      }
    }

    const result = await calculateScore(code, language, challengeSlug, testCases)

    res.json(result)
  } catch (error) {
    console.error('Scoring error:', error)
    res.status(500).json({ message: 'Scoring failed', error: error.message })
  }
})

router.post('/sync-tests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can sync test files' })
    }

    const { languages } = req.body
    
    const results = await syncAllTestFiles(Challenge, {
      languages: languages || ['javascript', 'python', 'java'],
      onProgress: (msg) => console.log(msg)
    })

    res.json({
      message: 'Test files sync completed',
      synced: results.synced,
      failed: results.failed,
      errors: results.errors.slice(0, 10)
    })
  } catch (error) {
    console.error('Test sync error:', error)
    res.status(500).json({ message: 'Test sync failed', error: error.message })
  }
})

router.post('/sync-challenge-test', authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.body

    if (!challengeId) {
      return res.status(400).json({ message: 'Challenge ID is required' })
    }

    const challenge = await Challenge.findById(challengeId)
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' })
    }

    const exerciseSlug = challenge.exerciseSlug || normalizeToExercismSlug(challenge.slug)

    const result = await downloadExerciseTests(challenge.language, exerciseSlug)

    if (result) {
      await Challenge.updateOne(
        { _id: challenge._id },
        { 
          $set: { 
            testFilePath: result.testFilePath,
            exerciseDir: result.exerciseDir,
            exerciseSlug
          } 
        }
      )

      res.json({
        message: 'Test file synced successfully',
        testFilePath: result.testFilePath
      })
    } else {
      res.status(404).json({ message: 'Could not fetch test file from Exercism' })
    }
  } catch (error) {
    console.error('Challenge test sync error:', error)
    res.status(500).json({ message: 'Test sync failed', error: error.message })
  }
})

export default router



