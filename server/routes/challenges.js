import express from 'express'
import Challenge from '../models/Challenge.js'
import Submission from '../models/Submission.js'
import { authenticateToken } from '../middleware/auth.js'
import { syncAllChallenges } from '../services/exercismSync.js'

const router = express.Router()

const DIFFICULTY_ORDER = { beginner: 1, intermediate: 2, advanced: 3 }

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { language, difficulty } = req.query
    const query = {}
    
    if (language) query.language = language
    if (difficulty) query.difficulty = difficulty

    const challenges = await Challenge.find(query)

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
          } : null,
          difficultyOrder: DIFFICULTY_ORDER[challenge.difficulty] || 4
        }
      })
    )

    challengesWithProgress.sort((a, b) => {
      if (a.difficultyOrder !== b.difficultyOrder) {
        return a.difficultyOrder - b.difficultyOrder
      }
      return a.title.localeCompare(b.title)
    })

    res.json(challengesWithProgress)
  } catch (error) {
    console.error('Fetch challenges error:', error)
    res.status(500).json({ message: 'Failed to fetch challenges' })
  }
})

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Challenge.aggregate([
      {
        $group: {
          _id: { language: '$language', difficulty: '$difficulty' },
          count: { $sum: 1 }
        }
      }
    ])
    
    const total = await Challenge.countDocuments()
    
    res.json({ total, byCategory: stats })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ message: 'Failed to get stats' })
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

router.post('/sync-exercism', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can sync challenges' })
    }

    console.log('Starting Exercism sync...')
    
    const results = await syncAllChallenges(Challenge, {
      onProgress: (message) => console.log(message),
      languages: ['javascript', 'python', 'java']
    })

    console.log(`Sync complete: ${results.synced} new, ${results.updated} updated, ${results.failed} failed`)

    res.json({
      message: `Successfully synced challenges from Exercism`,
      synced: results.synced,
      updated: results.updated,
      failed: results.failed,
      total: results.synced + results.updated,
      errors: results.errors.slice(0, 10)
    })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ message: 'Failed to sync challenges: ' + error.message })
  }
})

router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can clear challenges' })
    }

    const result = await Challenge.deleteMany({})
    res.json({ message: `Deleted ${result.deletedCount} challenges` })
  } catch (error) {
    console.error('Clear error:', error)
    res.status(500).json({ message: 'Failed to clear challenges' })
  }
})

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default router
