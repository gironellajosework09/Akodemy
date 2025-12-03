import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import User from '../models/User.js'
import Submission from '../models/Submission.js'

const router = express.Router()

router.get('/analytics', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' })
    
    const studentsWithCompletions = await Submission.distinct('userId', { completed: true })
    const completionists = studentsWithCompletions.length

    const languageEngagement = await Submission.aggregate([
      { $match: { completed: true } },
      {
        $lookup: {
          from: 'challenges',
          localField: 'challengeId',
          foreignField: '_id',
          as: 'challenge'
        }
      },
      { $unwind: '$challenge' },
      {
        $group: {
          _id: '$challenge.language',
          students: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          name: '$_id',
          students: { $size: '$students' }
        }
      }
    ])

    res.json({
      stats: {
        totalStudents,
        completionists,
        languagesActive: 3
      },
      languageEngagement: languageEngagement.length > 0 ? languageEngagement : [
        { name: 'Python', students: 0 },
        { name: 'JavaScript', students: 0 },
        { name: 'Java', students: 0 }
      ]
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

router.get('/students', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email progress competencies')
      .sort({ name: 1 })

    res.json(students)
  } catch (error) {
    console.error('Fetch students error:', error)
    res.status(500).json({ message: 'Failed to fetch students' })
  }
})

router.get('/student/:id', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-password')

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' })
    }

    res.json(student)
  } catch (error) {
    console.error('Fetch student error:', error)
    res.status(500).json({ message: 'Failed to fetch student' })
  }
})

export default router
