import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import Submission from '../models/Submission.js'
import Challenge from '../models/Challenge.js'
import User from '../models/User.js'

const router = express.Router()

router.get('/my-progress', authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({
      userId: req.user._id,
      completed: true
    }).populate('challengeId')

    const progress = {
      javascript: [0, 0, 0, 0, 0, 0],
      python: [0, 0, 0, 0, 0, 0],
      java: [0, 0, 0, 0, 0, 0]
    }

    const completedByCompetency = {
      javascript: {},
      python: {},
      java: {}
    }

    for (const submission of submissions) {
      if (submission.challengeId) {
        const { language, competencyIndex } = submission.challengeId
        if (language && competencyIndex !== undefined) {
          if (!completedByCompetency[language][competencyIndex]) {
            completedByCompetency[language][competencyIndex] = 0
          }
          completedByCompetency[language][competencyIndex]++
        }
      }
    }

    for (const language of ['javascript', 'python', 'java']) {
      for (let i = 0; i < 6; i++) {
        const completed = completedByCompetency[language][i] || 0
        progress[language][i] = Math.min(100, completed * 20)
      }
    }

    res.json(progress)
  } catch (error) {
    console.error('Fetch progress error:', error)
    res.status(500).json({ message: 'Failed to fetch progress' })
  }
})

router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { challengeId, time, runCount, completed } = req.body

    let submission = await Submission.findOne({
      userId: req.user._id,
      challengeId
    })

    if (submission) {
      submission.time = time
      submission.runCount = runCount
      submission.completed = completed
      await submission.save()
    } else {
      submission = await Submission.create({
        userId: req.user._id,
        challengeId,
        code: '',
        time,
        runCount,
        completed,
        status: completed ? 'accepted' : 'pending'
      })
    }

    if (completed) {
      const challenge = await Challenge.findById(challengeId)
      if (challenge) {
        const user = await User.findById(req.user._id)
        if (user) {
          const { language, competencyIndex } = challenge
          if (user.competencies[language] && competencyIndex !== undefined) {
            const currentValue = user.competencies[language][competencyIndex] || 0
            user.competencies[language][competencyIndex] = Math.min(100, currentValue + 20)
            await user.save()
          }
        }
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Save progress error:', error)
    res.status(500).json({ message: 'Failed to save progress' })
  }
})

export default router
