import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { calculateScore } from '../services/scoring.js'
import Challenge from '../models/Challenge.js'

const router = express.Router()

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { code, language, challengeId } = req.body

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' })
    }

    let expectedOutput = null
    
    if (challengeId) {
      try {
        const challenge = await Challenge.findById(challengeId)
        if (challenge?.solution) {
          expectedOutput = challenge.solution
        }
      } catch (err) {
        console.error('Failed to fetch challenge:', err)
      }
    }

    const result = await calculateScore(code, language, expectedOutput)

    res.json(result)
  } catch (error) {
    console.error('Scoring error:', error)
    res.status(500).json({ message: 'Scoring failed', error: error.message })
  }
})

export default router
