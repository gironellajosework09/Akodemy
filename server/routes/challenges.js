import express from 'express'
import Challenge from '../models/Challenge.js'
import Submission from '../models/Submission.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { language, difficulty } = req.query
    const query = {}
    
    if (language) query.language = language
    if (difficulty) query.difficulty = difficulty

    const challenges = await Challenge.find(query).sort({ createdAt: 1 })

    const challengesWithProgress = await Promise.all(
      challenges.map(async (challenge) => {
        const submission = await Submission.findOne({
          userId: req.user._id,
          challengeId: challenge._id
        }).sort({ createdAt: -1 })

        return {
          ...challenge.toObject(),
          userProgress: submission ? {
            bestTime: formatTime(submission.time || 0),
            runs: submission.runCount || 0,
            completed: submission.completed
          } : null
        }
      })
    )

    res.json(challengesWithProgress)
  } catch (error) {
    console.error('Fetch challenges error:', error)
    res.status(500).json({ message: 'Failed to fetch challenges' })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' })
    }
    res.json(challenge)
  } catch (error) {
    console.error('Fetch challenge error:', error)
    res.status(500).json({ message: 'Failed to fetch challenge' })
  }
})

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default router
