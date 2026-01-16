// Express routes for Faculty endpoints.
import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import User from '../models/User.js'
import Submission from '../models/Submission.js'
import Challenge from '../models/Challenge.js'

// Route handlers for Faculty APIs.
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

router.get('/competency-distribution', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
    const studentIds = students.map(s => s._id)
    const totalStudents = students.length

    if (totalStudents === 0) {
      return res.json({
        javascript: { notStarted: 100, needsPractice: 0, developing: 0, mastered: 0 },
        python: { notStarted: 100, needsPractice: 0, developing: 0, mastered: 0 },
        java: { notStarted: 100, needsPractice: 0, developing: 0, mastered: 0 }
      })
    }

    const allChallenges = await Challenge.find({})
    const challengeCounts = {}
    allChallenges.forEach(c => {
      if (!challengeCounts[c.language]) challengeCounts[c.language] = 0
      challengeCounts[c.language]++
    })

    const submissions = await Submission.find({ 
      userId: { $in: studentIds }, 
      completed: true 
    }).populate('challengeId', 'language')

    const studentProgress = {}
    studentIds.forEach(id => {
      studentProgress[id.toString()] = { javascript: 0, python: 0, java: 0 }
    })

    submissions.forEach(sub => {
      if (sub.challengeId?.language) {
        const lang = sub.challengeId.language
        const userId = sub.userId.toString()
        if (studentProgress[userId]) {
          studentProgress[userId][lang]++
        }
      }
    })

    const languages = ['javascript', 'python', 'java']
    const result = {}

    for (const lang of languages) {
      const totalChallenges = challengeCounts[lang] || 1
      let notStarted = 0, needsPractice = 0, developing = 0, mastered = 0

      for (const studentId of studentIds) {
        const completed = studentProgress[studentId.toString()][lang] || 0
        const percentage = (completed / totalChallenges) * 100

        if (percentage === 0) notStarted++
        else if (percentage < 40) needsPractice++
        else if (percentage < 80) developing++
        else mastered++
      }

      result[lang] = {
        notStarted: Math.round((notStarted / totalStudents) * 100),
        needsPractice: Math.round((needsPractice / totalStudents) * 100),
        developing: Math.round((developing / totalStudents) * 100),
        mastered: Math.round((mastered / totalStudents) * 100)
      }
    }

    res.json(result)
  } catch (error) {
    console.error('Competency distribution error:', error)
    res.status(500).json({ message: 'Failed to fetch competency distribution' })
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

router.get('/competency-student-distribution', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
    const studentIds = students.map(s => s._id)
    const totalStudents = students.length

    const competencyNames = [
      'Variables & Data Types',
      'Control Structures', 
      'Functions',
      'Arrays & Collections',
      'Object-Oriented Programming',
      'Error Handling'
    ]

    if (totalStudents === 0) {
      const emptyResult = competencyNames.map(name => ({
        name,
        notStarted: 100,
        needsPractice: 0,
        developing: 0,
        mastered: 0
      }))
      return res.json(emptyResult)
    }

    const allChallenges = await Challenge.find({})
    const submissions = await Submission.find({ 
      userId: { $in: studentIds }, 
      completed: true 
    }).select('userId challengeId')

    const completedMap = {}
    submissions.forEach(sub => {
      const key = `${sub.userId}-${sub.challengeId}`
      completedMap[key] = true
    })

    const competencyStats = {}
    for (let i = 0; i < 6; i++) {
      competencyStats[i] = { 
        name: competencyNames[i],
        challengesByStudent: {} 
      }
      studentIds.forEach(id => {
        competencyStats[i].challengesByStudent[id.toString()] = { total: 0, completed: 0 }
      })
    }

    allChallenges.forEach(challenge => {
      const idx = challenge.competencyIndex ?? 0
      studentIds.forEach(studentId => {
        const key = studentId.toString()
        if (competencyStats[idx].challengesByStudent[key]) {
          competencyStats[idx].challengesByStudent[key].total++
          const compKey = `${studentId}-${challenge._id}`
          if (completedMap[compKey]) {
            competencyStats[idx].challengesByStudent[key].completed++
          }
        }
      })
    })

    const result = []
    for (let i = 0; i < 6; i++) {
      let notStarted = 0, needsPractice = 0, developing = 0, mastered = 0

      for (const studentId of studentIds) {
        const stats = competencyStats[i].challengesByStudent[studentId.toString()]
        const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

        if (percentage === 0) notStarted++
        else if (percentage < 40) needsPractice++
        else if (percentage < 80) developing++
        else mastered++
      }

      result.push({
        name: competencyNames[i],
        notStarted: Math.round((notStarted / totalStudents) * 100),
        needsPractice: Math.round((needsPractice / totalStudents) * 100),
        developing: Math.round((developing / totalStudents) * 100),
        mastered: Math.round((mastered / totalStudents) * 100)
      })
    }

    res.json(result)
  } catch (error) {
    console.error('Competency student distribution error:', error)
    res.status(500).json({ message: 'Failed to fetch competency student distribution' })
  }
})

export default router



