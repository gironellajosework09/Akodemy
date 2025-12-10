import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import User from '../models/User.js'
import Submission from '../models/Submission.js'
import Challenge from '../models/Challenge.js'

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
      .select('name email')
      .sort({ name: 1 })

    const studentIds = students.map(s => s._id)
    
    const progressData = await Submission.aggregate([
      { $match: { userId: { $in: studentIds }, completed: true } },
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
          _id: { userId: '$userId', language: '$challenge.language' },
          count: { $sum: 1 }
        }
      }
    ])

    const challengeCounts = await Challenge.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ])

    const totalByLang = {}
    challengeCounts.forEach(c => {
      totalByLang[c._id] = c.count
    })

    const progressMap = {}
    progressData.forEach(p => {
      const key = p._id.userId.toString()
      if (!progressMap[key]) progressMap[key] = {}
      const total = totalByLang[p._id.language] || 1
      progressMap[key][p._id.language] = Math.round((p.count / total) * 100)
    })

    const studentsWithProgress = students.map(s => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      progress: progressMap[s._id.toString()] || {}
    }))

    res.json(studentsWithProgress)
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

router.get('/student/:id/competencies', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const userId = req.params.id

    const completedSubmissions = await Submission.find({ 
      userId, 
      completed: true 
    }).select('challengeId')

    const completedChallengeIds = completedSubmissions.map(s => s.challengeId)

    const allChallenges = await Challenge.find({})
      .select('language competencyIndex competencyName')

    const competencyNames = [
      'Variables & Data Types',
      'Control Structures', 
      'Functions',
      'Arrays & Collections',
      'Object-Oriented Programming',
      'Error Handling'
    ]

    const languages = ['javascript', 'python', 'java']
    const result = {}
    const summary = {}

    for (const lang of languages) {
      const langChallenges = allChallenges.filter(c => c.language === lang)
      const competencyStats = {}

      for (let i = 0; i < 6; i++) {
        competencyStats[i] = { total: 0, completed: 0 }
      }

      langChallenges.forEach(challenge => {
        const idx = challenge.competencyIndex ?? 0
        competencyStats[idx].total++
        if (completedChallengeIds.some(id => id.toString() === challenge._id.toString())) {
          competencyStats[idx].completed++
        }
      })

      result[lang] = Object.keys(competencyStats).map(idx => {
        const stat = competencyStats[idx]
        const percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
        return {
          index: parseInt(idx),
          name: competencyNames[idx] || `Competency ${idx}`,
          total: stat.total,
          completed: stat.completed,
          percentage,
          hasActivity: stat.completed > 0
        }
      })

      const langTotal = langChallenges.length
      const langCompleted = langChallenges.filter(c => 
        completedChallengeIds.some(id => id.toString() === c._id.toString())
      ).length
      
      summary[lang] = {
        total: langTotal,
        completed: langCompleted
      }
    }

    res.json({ ...result, summary })
  } catch (error) {
    console.error('Fetch student competencies error:', error)
    res.status(500).json({ message: 'Failed to fetch competencies' })
  }
})

export default router
