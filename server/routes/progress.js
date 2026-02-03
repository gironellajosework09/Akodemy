// Express routes for Progress endpoints.
import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import Submission from '../models/Submission.js'
import Challenge, { COMPETENCY_NAMES } from '../models/Challenge.js'
import ChallengeAnswer from '../models/ChallengeAnswer.js'
import LatestAnswer from '../models/LatestAnswer.js'
import User from '../models/User.js'
import { checkAndUnlockBadge } from '../services/badgeService.js'

// Route handlers for Progress APIs.
const router = express.Router()

router.use(authenticateToken)
router.use(requireRole('student', 'faculty'))

const resolveCompetencies = (challenge) => {
  if (Array.isArray(challenge?.competencies) && challenge.competencies.length > 0) {
    return [...new Set(challenge.competencies)].filter(name => COMPETENCY_NAMES.includes(name))
  }
  const idx = typeof challenge?.competencyIndex === 'number' ? challenge.competencyIndex : null
  if (idx !== null && COMPETENCY_NAMES[idx]) {
    return [COMPETENCY_NAMES[idx]]
  }
  return []
}

router.get('/my-progress', async (req, res) => {
  try {
    const allChallenges = await Challenge.find({}).select('_id language competencyIndex competencies')
    
    const latestAnswers = await LatestAnswer.find({ userId: req.user._id }).select('challengeId isCorrect')
    const correctMap = {}
    for (const la of latestAnswers) {
      correctMap[la.challengeId.toString()] = la.isCorrect
    }

    const progress = {}
    const summary = {}
    const languages = ['javascript', 'python', 'java']
    const competencyStats = {}

    for (const language of languages) {
      competencyStats[language] = {}
      COMPETENCY_NAMES.forEach(name => {
        competencyStats[language][name] = { total: 0, correct: 0 }
      })
    }

    for (const challenge of allChallenges) {
      const language = challenge.language
      if (!competencyStats[language]) continue
      const compNames = resolveCompetencies(challenge)
      if (compNames.length === 0) continue
      const isCorrect = correctMap[challenge._id.toString()] === true

      compNames.forEach(name => {
        const stat = competencyStats[language][name]
        if (!stat) return
        stat.total += 1
        if (isCorrect) stat.correct += 1
      })
    }

    for (const language of languages) {
      progress[language] = COMPETENCY_NAMES.map((name, index) => {
        const stat = competencyStats[language][name] || { total: 0, correct: 0 }
        return {
          index,
          name,
          correct: stat.correct,
          total: stat.total,
          hasActivity: stat.correct > 0
        }
      })

      const challengesInLang = allChallenges.filter(c => c.language === language)
      const langTotal = challengesInLang.length
      const langCorrect = challengesInLang.filter(c => correctMap[c._id.toString()] === true).length
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

    let badgeUnlocked = null
    if (isCorrect) {
      const challenge = await Challenge.findById(challengeId).select('language difficulty')
      if (challenge) {
        const badgeResult = await checkAndUnlockBadge(
          req.user._id,
          challenge.language,
          challenge.difficulty
        )
        if (badgeResult.unlocked) {
          badgeUnlocked = {
            badgeName: badgeResult.badgeName,
            language: badgeResult.language,
            difficulty: badgeResult.difficulty,
            status: 'claimable'
          }
        }
      }
    }

    res.json({
      success: true,
      submission: {
        attemptNumber: submission.attemptNumber,
        score: submission.score,
        bestTime: submission.bestTime,
        isCorrect: submission.isCorrect
      },
      badgeUnlocked
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



