// Express routes for Progress endpoints.
import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import Submission from '../models/Submission.js'
import Challenge from '../models/Challenge.js'
import ChallengeAnswer from '../models/ChallengeAnswer.js'
import LatestAnswer from '../models/LatestAnswer.js'

// Route handlers for Progress APIs.
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

router.get('/challenge/:challengeId/latest', authenticateToken, async (req, res) => {
  try {
    const latest = await LatestAnswer.findOne({
      userId: req.user._id,
      challengeId: req.params.challengeId
    })

    if (!latest) {
      return res.json(null)
    }

    res.json({
      answer: latest.answer,
      language: latest.language,
      isCorrect: latest.isCorrect,
      score: latest.score,
      attemptNumber: latest.attemptNumber,
      runs: latest.runs,
      startedAt: latest.startedAt,
      submittedAt: latest.submittedAt,
      bestTime: latest.bestTime
    })
  } catch (error) {
    console.error('Fetch latest answer error:', error)
    res.status(500).json({ message: 'Failed to fetch latest submission' })
  }
})

router.get('/challenge/:challengeId/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query

    const history = await ChallengeAnswer.find({
      userId: req.user._id,
      challengeId: req.params.challengeId
    })
      .sort({ submittedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean()

    const total = await ChallengeAnswer.countDocuments({
      userId: req.user._id,
      challengeId: req.params.challengeId
    })

    res.json({ history, total })
  } catch (error) {
    console.error('Fetch history error:', error)
    res.status(500).json({ message: 'Failed to fetch history' })
  }
})

router.post('/challenge/:challengeId/submit', authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.params
    const { answer, language, isCorrect, score, runs, startedAt } = req.body

    const attemptNumber = await ChallengeAnswer.getNextAttemptNumber(req.user._id, challengeId)
    const submittedAt = new Date()
    const bestTime = Math.round((submittedAt - new Date(startedAt)) / 1000)

    const submission = await ChallengeAnswer.create({
      userId: req.user._id,
      challengeId,
      answer,
      language,
      isCorrect,
      score,
      attemptNumber,
      runs,
      startedAt: new Date(startedAt),
      submittedAt,
      bestTime
    })

    await LatestAnswer.upsertFromSubmission({
      userId: req.user._id,
      challengeId,
      answer,
      language,
      isCorrect,
      score,
      attemptNumber,
      runs,
      startedAt: new Date(startedAt),
      submittedAt,
      bestTime
    })

    res.json({
      success: true,
      submission: {
        attemptNumber: submission.attemptNumber,
        score: submission.score,
        bestTime: submission.bestTime,
        isCorrect: submission.isCorrect
      }
    })
  } catch (error) {
    console.error('Submit answer error:', error)
    res.status(500).json({ message: 'Failed to submit answer' })
  }
})

router.get('/challenge/:challengeId/summary', authenticateToken, async (req, res) => {
  try {
    const latest = await LatestAnswer.findOne({
      userId: req.user._id,
      challengeId: req.params.challengeId
    })

    if (!latest) {
      return res.json({
        hasAttempted: false,
        bestTime: null,
        runs: 0,
        latestCode: null,
        attemptCount: 0
      })
    }

    const bestTimeSubmission = await ChallengeAnswer.findOne({
      userId: req.user._id,
      challengeId: req.params.challengeId,
      isCorrect: true
    }).sort({ bestTime: 1 }).lean()

    const attemptCount = await ChallengeAnswer.countDocuments({
      userId: req.user._id,
      challengeId: req.params.challengeId
    })

    res.json({
      hasAttempted: true,
      bestTime: bestTimeSubmission?.bestTime || latest.bestTime,
      runs: latest.runs,
      latestCode: latest.answer,
      attemptCount,
      lastScore: latest.score,
      lastCorrect: latest.isCorrect
    })
  } catch (error) {
    console.error('Fetch summary error:', error)
    res.status(500).json({ message: 'Failed to fetch summary' })
  }
})

export default router



