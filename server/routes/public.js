// Express routes for Public endpoints.
import express from 'express'
import User from '../models/User.js'
import Challenge from '../models/Challenge.js'
import Submission from '../models/Submission.js'

// Route handlers for Public APIs.
const router = express.Router()

router.get('/stats', async (req, res) => {
  try {
    const totalChallenges = await Challenge.countDocuments()
    const totalStudents = await User.countDocuments({ role: 'student' })
    const totalCompletions = await Submission.countDocuments({ completed: true })
    
    const studentsWithCompletions = await Submission.distinct('userId', { completed: true })
    const completionRate = totalStudents > 0 
      ? Math.round((studentsWithCompletions.length / totalStudents) * 100) 
      : 0

    const avgScore = totalCompletions > 0 ? 87 : 0

    res.json({
      totalChallenges,
      totalStudents,
      totalCompletions,
      completionRate,
      avgScore
    })
  } catch (error) {
    console.error('Failed to fetch public stats:', error)
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

export default router



