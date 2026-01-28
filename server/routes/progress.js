// Express routes for Progress endpoints.
import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import Submission from '../models/Submission.js'
import Challenge, { COMPETENCY_NAMES } from '../models/Challenge.js'
import ChallengeAnswer from '../models/ChallengeAnswer.js'
import LatestAnswer from '../models/LatestAnswer.js'
import User from '../models/User.js'

// Route handlers for Progress APIs.
const router = express.Router()

router.use(authenticateToken)
router.use(requireRole('student', 'faculty'))

router.get('/my-progress', async (req, res) => {
  try {
    const allChallenges = await Challenge.find({}).select('_id language competencyIndex')
    
    const latestAnswers = await LatestAnswer.find({ userId: req.user._id }).select('challengeId isCorrect')
    const correctMap = {}
    for (const la of latestAnswers) {
      correctMap[la.challengeId.toString()] = la.isCorrect
    }

    const progress = {}
    const summary = {}
    
    for (const language of ['javascript', 'python', 'java']) {
      progress[language] = []
      
      for (let i = 0; i < 6; i++) {
        const challengesInComp = allChallenges.filter(c => c.language === language && c.competencyIndex === i)
        const total = challengesInComp.length
        const correct = challengesInComp.filter(c => correctMap[c._id.toString()] === true).length
        
        progress[language].push({
          index: i,
          name: COMPETENCY_NAMES[i],
          correct,
          total,
          hasActivity: correct > 0
        })
      }
      
      const langTotal = progress[language].reduce((sum, c) => sum + c.total, 0)
      const langCorrect = progress[language].reduce((sum, c) => sum + c.correct, 0)
      summary[language] = { correct: langCorrect, total: langTotal }
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

router.post('/save', async (req, res) => {
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

router.get('/challenge/:challengeId', async (req, res) => {
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

router.get('/challenge/:challengeId/latest', async (req, res) => {
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

router.get('/challenge/:challengeId/history', async (req, res) => {
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

router.post('/challenge/:challengeId/submit', async (req, res) => {
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

router.get('/challenge/:challengeId/summary', async (req, res) => {
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



