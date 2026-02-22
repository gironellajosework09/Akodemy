// Express routes for Faculty endpoints.
import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import User from '../models/User.js'
import Submission from '../models/Submission.js'
import Challenge, { COMPETENCY_NAMES } from '../models/Challenge.js'
import LatestAnswer from '../models/LatestAnswer.js'
import ChallengeAnswer from '../models/ChallengeAnswer.js'
import Badge from '../models/Badge.js'
import ChallengeAttempt from '../models/ChallengeAttempt.js'
import { getBadgeProgress } from '../services/badgeService.js'

// Route handlers for Faculty APIs.
const router = express.Router()

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
      .select('name email yearSection')
      .sort({ name: 1 })

    const studentIds = students.map(s => s._id)
    
    const [correctAnswers, challengeCounts, allChallenges, equippedBadges, badgeCounts, attemptedUsers, attemptedAnswerUsers] = await Promise.all([
      LatestAnswer.find({
        userId: { $in: studentIds },
        isCorrect: true
      }).select('userId challengeId'),
      Challenge.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } }
      ]),
      Challenge.find({}).select('_id language'),
      Badge.find({ equipped: true }).select('userId badgeName language difficulty'),
      Badge.aggregate([
        { $match: { status: 'claimed' } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ]),
      ChallengeAttempt.distinct('userId', { userId: { $in: studentIds } }),
      ChallengeAnswer.distinct('userId', { userId: { $in: studentIds } })
    ])

    const totalByLang = {}
    challengeCounts.forEach(c => {
      totalByLang[c._id] = c.count
    })

    const challengeLangMap = {}
    allChallenges.forEach(challenge => {
      challengeLangMap[challenge._id.toString()] = challenge.language
    })

    const correctCountMap = {}
    correctAnswers.forEach(answer => {
      const userKey = answer.userId.toString()
      const lang = challengeLangMap[answer.challengeId.toString()]
      if (!lang) return
      if (!correctCountMap[userKey]) correctCountMap[userKey] = {}
      correctCountMap[userKey][lang] = (correctCountMap[userKey][lang] || 0) + 1
    })

    const progressMap = {}
    Object.entries(correctCountMap).forEach(([userKey, langCounts]) => {
      progressMap[userKey] = {}
      Object.entries(langCounts).forEach(([lang, count]) => {
        const total = totalByLang[lang] || 1
        progressMap[userKey][lang] = Math.round((count / total) * 100)
      })
    })

    const equippedMap = {}
    equippedBadges.forEach(b => {
      equippedMap[b.userId.toString()] = {
        badgeName: b.badgeName,
        language: b.language,
        difficulty: b.difficulty
      }
    })

    const badgeCountMap = {}
    badgeCounts.forEach(b => {
      badgeCountMap[b._id.toString()] = b.count
    })
    const attemptedUserSet = new Set([
      ...attemptedUsers.map(id => id.toString()),
      ...attemptedAnswerUsers.map(id => id.toString())
    ])

    const studentsWithProgress = students.map(s => {
      const id = s._id.toString()
      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        yearSection: s.yearSection || '',
        progress: progressMap[id] || {},
        hasAttempted: attemptedUserSet.has(id),
        equippedTitle: equippedMap[id] || null,
        badgeCount: badgeCountMap[id] || 0
      }
    })

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

router.get('/students/:studentId/profile', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const { studentId } = req.params

    const [student, badges, badgeProgress] = await Promise.all([
      User.findById(studentId).select('-password'),
      Badge.find({ userId: studentId }).sort({ unlockedAt: -1 }),
      getBadgeProgress(studentId)
    ])

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' })
    }

    const equippedBadge = badges.find(b => b.equipped)

    res.json({
      student: {
        _id: student._id,
        student_id: student.student_id || null,
        name: student.name,
        email: student.email,
        phone: student.phone,
        sex: student.sex,
        birthdate: student.birthdate
      },
      equippedTitle: equippedBadge ? {
        badgeKey: `${equippedBadge.language}-${equippedBadge.difficulty}`,
        displayName: equippedBadge.badgeName,
        language: equippedBadge.language,
        difficulty: equippedBadge.difficulty
      } : null,
      badges: badges.map(b => ({
        _id: b._id,
        badgeName: b.badgeName,
        language: b.language,
        difficulty: b.difficulty,
        status: b.status,
        equipped: b.equipped,
        unlockedAt: b.unlockedAt,
        claimedAt: b.claimedAt
      })),
      badgeProgress
    })
  } catch (error) {
    console.error('Fetch student profile error:', error)
    res.status(500).json({ message: 'Failed to fetch student profile' })
  }
})

router.get('/student/:id/competencies', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const userId = req.params.id

    const allChallenges = await Challenge.find({}).select('_id language competencyIndex competencies')
    
    const latestAnswers = await LatestAnswer.find({ userId }).select('challengeId isCorrect')
    const correctMap = {}
    for (const la of latestAnswers) {
      correctMap[la.challengeId.toString()] = la.isCorrect
    }

    const languages = ['javascript', 'python', 'java']
    const result = {}
    const summary = {}
    const competencyStats = {}

    for (const lang of languages) {
      competencyStats[lang] = {}
      COMPETENCY_NAMES.forEach(name => {
        competencyStats[lang][name] = { total: 0, correct: 0 }
      })
    }

    for (const challenge of allChallenges) {
      const lang = challenge.language
      if (!competencyStats[lang]) continue
      const compNames = resolveCompetencies(challenge)
      if (compNames.length === 0) continue
      const isCorrect = correctMap[challenge._id.toString()] === true

      compNames.forEach(name => {
        const stat = competencyStats[lang][name]
        if (!stat) return
        stat.total += 1
        if (isCorrect) stat.correct += 1
      })
    }

    for (const lang of languages) {
      result[lang] = COMPETENCY_NAMES.map((name, index) => {
        const stat = competencyStats[lang][name] || { total: 0, correct: 0 }
        return {
          index,
          name,
          correct: stat.correct,
          total: stat.total,
          hasActivity: stat.correct > 0
        }
      })

      const challengesInLang = allChallenges.filter(c => c.language === lang)
      const langTotal = challengesInLang.length
      const langCorrect = challengesInLang.filter(c => correctMap[c._id.toString()] === true).length
      summary[lang] = { correct: langCorrect, total: langTotal }
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

    if (totalStudents === 0) {
      const emptyResult = COMPETENCY_NAMES.map(name => ({
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
    COMPETENCY_NAMES.forEach(name => {
      competencyStats[name] = { name, challengesByStudent: {} }
      studentIds.forEach(id => {
        competencyStats[name].challengesByStudent[id.toString()] = { total: 0, completed: 0 }
      })
    })

    allChallenges.forEach(challenge => {
      const compNames = resolveCompetencies(challenge)
      compNames.forEach(name => {
        const bucket = competencyStats[name]
        if (!bucket) return
        studentIds.forEach(studentId => {
          const key = studentId.toString()
          if (bucket.challengesByStudent[key]) {
            bucket.challengesByStudent[key].total++
            const compKey = `${studentId}-${challenge._id}`
            if (completedMap[compKey]) {
              bucket.challengesByStudent[key].completed++
            }
          }
        })
      })
    })

    const result = []
    for (const name of COMPETENCY_NAMES) {
      let notStarted = 0, needsPractice = 0, developing = 0, mastered = 0

      for (const studentId of studentIds) {
        const stats = competencyStats[name].challengesByStudent[studentId.toString()]
        const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

        if (percentage === 0) notStarted++
        else if (percentage < 40) needsPractice++
        else if (percentage < 80) developing++
        else mastered++
      }

      result.push({
        name,
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

router.get('/analytics/overview', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const { days = 30 } = req.query
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(days))
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [
      totalStudents,
      activeStudents,
      totalSubmissions,
      recentSubmissions,
      passedSubmissions,
      totalBadgesClaimed,
      languageSubmissions
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Submission.distinct('userId', { createdAt: { $gte: weekAgo } }).then(ids => ids.length),
      Submission.countDocuments({ createdAt: { $gte: daysAgo } }),
      Submission.countDocuments({ createdAt: { $gte: weekAgo } }),
      Submission.countDocuments({ status: 'accepted', createdAt: { $gte: daysAgo } }),
      Badge.countDocuments({ status: 'claimed' }),
      Submission.aggregate([
        { $match: { createdAt: { $gte: daysAgo } } },
        {
          $lookup: {
            from: 'challenges',
            localField: 'challengeId',
            foreignField: '_id',
            as: 'challenge'
          }
        },
        { $unwind: '$challenge' },
        { $group: { _id: '$challenge.language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ])

    const passRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0
    const topLanguage = languageSubmissions[0]?._id || 'N/A'

    res.json({
      totalStudents,
      activeStudents,
      totalSubmissions,
      recentSubmissions,
      passRate,
      totalBadgesClaimed,
      topLanguage
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    res.status(500).json({ message: 'Failed to fetch analytics overview' })
  }
})

router.get('/analytics/trends', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const { days = 30 } = req.query
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(days))

    const submissionTrend = await Submission.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ])

    const trendMap = {}
    submissionTrend.forEach(item => {
      const date = item._id.date
      if (!trendMap[date]) {
        trendMap[date] = { date, passed: 0, failed: 0, total: 0 }
      }
      if (item._id.status === 'accepted') {
        trendMap[date].passed = item.count
      } else {
        trendMap[date].failed += item.count
      }
      trendMap[date].total += item.count
    })

    const dailyTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date))

    const badgeTrend = await Badge.aggregate([
      { $match: { status: 'claimed', claimedAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$claimedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({
      dailySubmissions: dailyTrend,
      badgesClaimed: badgeTrend.map(b => ({ date: b._id, count: b.count }))
    })
  } catch (error) {
    console.error('Analytics trends error:', error)
    res.status(500).json({ message: 'Failed to fetch analytics trends' })
  }
})

router.get('/analytics/challenges', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const { days = 30, language } = req.query
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(days))

    const matchStage = { createdAt: { $gte: daysAgo } }

    const mostAttempted = await Submission.aggregate([
      { $match: matchStage },
      { $group: { _id: '$challengeId', attempts: { $sum: 1 } } },
      {
        $lookup: {
          from: 'challenges',
          localField: '_id',
          foreignField: '_id',
          as: 'challenge'
        }
      },
      { $unwind: '$challenge' },
      ...(language ? [{ $match: { 'challenge.language': language } }] : []),
      { $sort: { attempts: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          title: '$challenge.title',
          language: '$challenge.language',
          difficulty: '$challenge.difficulty',
          attempts: 1
        }
      }
    ])

    const passRateByChallenge = await Submission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$challengeId',
          total: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
        }
      },
      { $match: { total: { $gte: 5 } } },
      {
        $lookup: {
          from: 'challenges',
          localField: '_id',
          foreignField: '_id',
          as: 'challenge'
        }
      },
      { $unwind: '$challenge' },
      ...(language ? [{ $match: { 'challenge.language': language } }] : []),
      {
        $project: {
          passRate: { $multiply: [{ $divide: ['$passed', '$total'] }, 100] },
          total: 1,
          title: '$challenge.title',
          language: '$challenge.language',
          difficulty: '$challenge.difficulty'
        }
      },
      { $sort: { passRate: 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          title: 1,
          language: 1,
          difficulty: 1,
          passRate: { $round: ['$passRate', 1] },
          attempts: '$total'
        }
      }
    ])

    res.json({
      mostAttempted,
      hardestChallenges: passRateByChallenge
    })
  } catch (error) {
    console.error('Analytics challenges error:', error)
    res.status(500).json({ message: 'Failed to fetch challenge analytics' })
  }
})

router.get('/analytics/students', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const { days = 30 } = req.query
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(days))

    const topPerformers = await Submission.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$userId',
          total: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } }
        }
      },
      { $match: { total: { $gte: 3 } } },
      {
        $project: {
          passRate: { $multiply: [{ $divide: ['$passed', '$total'] }, 100] },
          completed: '$passed',
          total: 1
        }
      },
      { $sort: { passRate: -1, completed: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          passRate: { $round: ['$passRate', 1] },
          completed: 1
        }
      }
    ])

    const needsAttention = await Submission.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$userId',
          total: { $sum: 1 },
          failed: { $sum: { $cond: [{ $ne: ['$status', 'accepted'] }, 1, 0] } }
        }
      },
      { $match: { total: { $gte: 3 } } },
      {
        $project: {
          failRate: { $multiply: [{ $divide: ['$failed', '$total'] }, 100] },
          failed: 1,
          total: 1
        }
      },
      { $match: { failRate: { $gte: 70 } } },
      { $sort: { failRate: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          failRate: { $round: ['$failRate', 1] },
          attempts: '$total'
        }
      }
    ])

    const recentActivity = await Submission.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('userId', 'name')
      .populate('challengeId', 'title language')
      .lean()

    const recentBadges = await Badge.find({ status: 'claimed' })
      .sort({ claimedAt: -1 })
      .limit(10)
      .populate('userId', 'name')
      .lean()

    res.json({
      topPerformers,
      needsAttention,
      recentActivity: recentActivity.map(s => ({
        studentName: s.userId?.name || 'Unknown',
        challengeTitle: s.challengeId?.title || 'Unknown',
        language: s.challengeId?.language || 'unknown',
        status: s.status,
        date: s.createdAt
      })),
      recentBadges: recentBadges.map(b => ({
        studentName: b.userId?.name || 'Unknown',
        badgeName: b.badgeName,
        language: b.language,
        difficulty: b.difficulty,
        date: b.claimedAt
      }))
    })
  } catch (error) {
    console.error('Analytics students error:', error)
    res.status(500).json({ message: 'Failed to fetch student analytics' })
  }
})

router.get('/analytics/badges', authenticateToken, requireRole('faculty'), async (req, res) => {
  try {
    const badgeDistribution = await Badge.aggregate([
      { $match: { status: 'claimed' } },
      {
        $group: {
          _id: { language: '$language', difficulty: '$difficulty' },
          count: { $sum: 1 }
        }
      }
    ])

    const languages = ['javascript', 'python', 'java']
    const difficulties = ['beginner', 'intermediate', 'advanced']
    
    const distribution = {}
    languages.forEach(lang => {
      distribution[lang] = {}
      difficulties.forEach(diff => {
        distribution[lang][diff] = 0
      })
    })

    badgeDistribution.forEach(b => {
      if (distribution[b._id.language]) {
        distribution[b._id.language][b._id.difficulty] = b.count
      }
    })

    res.json({ distribution })
  } catch (error) {
    console.error('Analytics badges error:', error)
    res.status(500).json({ message: 'Failed to fetch badge analytics' })
  }
})

export default router



