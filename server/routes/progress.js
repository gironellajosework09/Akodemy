import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import Submission from '../models/Submission.js'
import Challenge from '../models/Challenge.js'

const router = express.Router()

const COMPETENCY_NAMES = [
  'Variables & Data Types',
  'Control Structures',
  'Functions',
  'Arrays & Collections',
  'Object-Oriented Programming',
  'Error Handling'
]

router.get('/my-progress', authenticateToken, async (req, res) => {
  try {
    const completedSubmissions = await Submission.find({
      userId: req.user._id,
      completed: true
    }).populate('challengeId')

    const totalChallenges = await Challenge.aggregate([
      {
        $group: {
          _id: { language: '$language', competencyIndex: '$competencyIndex' },
          count: { $sum: 1 }
        }
      }
    ])

    const challengeCounts = {}
    for (const item of totalChallenges) {
      const { language, competencyIndex } = item._id
      if (!challengeCounts[language]) {
        challengeCounts[language] = {}
      }
      challengeCounts[language][competencyIndex] = item.count
    }

    const completedByCompetency = {
      javascript: {},
      python: {},
      java: {}
    }

    const completedChallengeIds = new Set()

    for (const submission of completedSubmissions) {
      if (submission.challengeId) {
        const challenge = submission.challengeId
        const key = `${challenge._id}`
        
        if (completedChallengeIds.has(key)) continue
        completedChallengeIds.add(key)

        const { language, competencyIndex } = challenge
        if (language && competencyIndex !== undefined) {
          if (!completedByCompetency[language][competencyIndex]) {
            completedByCompetency[language][competencyIndex] = 0
          }
          completedByCompetency[language][competencyIndex]++
        }
      }
    }

    const progress = {}
    
    for (const language of ['javascript', 'python', 'java']) {
      progress[language] = []
      
      for (let i = 0; i < 6; i++) {
        const completed = completedByCompetency[language][i] || 0
        const total = challengeCounts[language]?.[i] || 0
        
        let percentage = 0
        if (total > 0) {
          percentage = Math.round((completed / total) * 100)
        }
        
        progress[language].push({
          index: i,
          name: COMPETENCY_NAMES[i],
          completed,
          total,
          percentage,
          hasActivity: completed > 0
        })
      }
    }

    const summary = {
      javascript: { completed: 0, total: 0 },
      python: { completed: 0, total: 0 },
      java: { completed: 0, total: 0 }
    }

    for (const language of ['javascript', 'python', 'java']) {
      for (const comp of progress[language]) {
        summary[language].completed += comp.completed
        summary[language].total += comp.total
      }
    }

    res.json({ 
      competencies: progress,
      summary,
      competencyNames: COMPETENCY_NAMES
    })
  } catch (error) {
    console.error('Fetch progress error:', error)
    res.status(500).json({ message: 'Failed to fetch progress' })
  }
})

router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { challengeId, time, runCount, completed, code } = req.body

    let submission = await Submission.findOne({
      userId: req.user._id,
      challengeId
    })

    if (submission) {
      submission.time = time
      submission.runCount = runCount
      submission.completed = completed
      if (code) submission.code = code
      submission.status = completed ? 'accepted' : 'pending'
      await submission.save()
    } else {
      submission = await Submission.create({
        userId: req.user._id,
        challengeId,
        code: code || '',
        time,
        runCount,
        completed,
        status: completed ? 'accepted' : 'pending'
      })
    }

    res.json({ success: true, submission })
  } catch (error) {
    console.error('Save progress error:', error)
    res.status(500).json({ message: 'Failed to save progress' })
  }
})

router.get('/challenge/:challengeId', authenticateToken, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      userId: req.user._id,
      challengeId: req.params.challengeId
    })

    res.json(submission || null)
  } catch (error) {
    console.error('Fetch challenge progress error:', error)
    res.status(500).json({ message: 'Failed to fetch progress' })
  }
})

export default router
