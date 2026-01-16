// Example database queries for reference.
import mongoose from 'mongoose'
import Otp from '../models/Otp.js'
import ChallengeAnswer from '../models/ChallengeAnswer.js'
import LatestAnswer from '../models/LatestAnswer.js'
import User from '../models/User.js'
import Challenge from '../models/Challenge.js'

async function otpExamples(userId) {
  console.log('\n=== OTP Examples ===\n')

  function generateOtpCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const otpCode = generateOtpCode()
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000)

  const newOtp = await Otp.create({
    userId,
    otp: otpCode,
    expiresAt,
    used: false,
    requestedAt: new Date()
  })
  console.log('Created OTP:', { code: newOtp.otp, expiresAt: newOtp.expiresAt })

  const otpRecord = await Otp.findOne({
    userId,
    otp: otpCode,
    used: false,
    expiresAt: { $gt: new Date() }
  })

  if (otpRecord) {
    console.log('OTP is valid!')
    
    otpRecord.used = true
    await otpRecord.save()
    console.log('OTP marked as used')
  } else {
    console.log('OTP is invalid or expired')
  }

  await Otp.deleteMany({ userId, used: true })
  console.log('Cleaned up used OTPs')

  return newOtp
}

async function challengeAnswerExamples(userId, challengeId, language) {
  console.log('\n=== Challenge Answer Examples ===\n')

  const attemptNumber = await ChallengeAnswer.getNextAttemptNumber(userId, challengeId)
  console.log('Next attempt number:', attemptNumber)

  const startedAt = new Date(Date.now() - 5 * 60 * 1000)
  const submittedAt = new Date()
  const runs = 7

  const submission = await ChallengeAnswer.create({
    userId,
    challengeId,
    answer: 'function solution() { return "Hello, World!"; }',
    language,
    isCorrect: true,
    score: 85,
    attemptNumber,
    runs,
    startedAt,
    submittedAt
  })
  console.log('Created submission:', {
    attemptNumber: submission.attemptNumber,
    score: submission.score,
    bestTime: submission.bestTime,
    runs: submission.runs
  })

  await LatestAnswer.upsertFromSubmission({
    userId,
    challengeId,
    answer: submission.answer,
    language,
    isCorrect: submission.isCorrect,
    score: submission.score,
    attemptNumber: submission.attemptNumber,
    runs: submission.runs,
    startedAt: submission.startedAt,
    submittedAt: submission.submittedAt,
    bestTime: submission.bestTime
  })
  console.log('Updated LatestAnswer')

  const history = await ChallengeAnswer.getUserChallengeHistory(userId, challengeId, { limit: 5 })
  console.log('Challenge history:', history.length, 'attempts')

  const stats = await ChallengeAnswer.getUserStats(userId)
  console.log('User stats:', stats)

  return submission
}

async function latestAnswerExamples(userId) {
  console.log('\n=== Latest Answer Examples ===\n')

  const latestAnswers = await LatestAnswer.getUserLatestAnswers(userId)
  console.log('User has', latestAnswers.length, 'latest answers')

  const jsAnswers = await LatestAnswer.getUserLatestAnswers(userId, 'javascript')
  console.log('JavaScript answers:', jsAnswers.length)

  if (latestAnswers.length > 0) {
    const latest = latestAnswers[0]
    console.log('Most recent submission:', {
      challengeId: latest.challengeId,
      score: latest.score,
      attemptNumber: latest.attemptNumber
    })
  }

  return latestAnswers
}

async function attemptAgainExample(userId, challengeId) {
  console.log('\n=== Attempt Again Example ===\n')

  const latest = await LatestAnswer.findOne({ userId, challengeId })
  
  if (latest) {
    console.log('Previous attempt found:')
    console.log('- Attempt #:', latest.attemptNumber)
    console.log('- Score:', latest.score)
    console.log('- Code preview:', latest.answer.substring(0, 50) + '...')
    
    const challenge = await Challenge.findById(challengeId)
    if (challenge) {
      console.log('\nStarting fresh attempt with starter code...')
      console.log('New attempt will be #:', latest.attemptNumber + 1)
    }
  } else {
    console.log('No previous attempt found - this is attempt #1')
  }
}

async function analyticsExamples() {
  console.log('\n=== Analytics Examples ===\n')

  const languageStats = await ChallengeAnswer.aggregate([
    {
      $group: {
        _id: '$language',
        totalSubmissions: { $sum: 1 },
        totalRuns: { $sum: '$runs' },
        avgScore: { $avg: '$score' },
        successfulAttempts: {
          $sum: { $cond: ['$isCorrect', 1, 0] }
        }
      }
    },
    { $sort: { totalSubmissions: -1 } }
  ])
  console.log('Submissions by language:', languageStats)

  const challengeStats = await ChallengeAnswer.aggregate([
    {
      $group: {
        _id: '$challengeId',
        totalAttempts: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgScore: { $avg: '$score' },
        avgTime: { $avg: '$bestTime' },
        successRate: {
          $avg: { $cond: ['$isCorrect', 1, 0] }
        }
      }
    },
    {
      $project: {
        totalAttempts: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgScore: { $round: ['$avgScore', 1] },
        avgTime: { $round: ['$avgTime', 0] },
        successRate: { $round: [{ $multiply: ['$successRate', 100] }, 1] }
      }
    },
    { $sort: { totalAttempts: -1 } },
    { $limit: 10 }
  ])
  console.log('Top 10 challenged exercises:', challengeStats)

  const userLeaderboard = await ChallengeAnswer.aggregate([
    { $match: { isCorrect: true } },
    {
      $group: {
        _id: { userId: '$userId', challengeId: '$challengeId' },
        bestTime: { $min: '$bestTime' },
        bestScore: { $max: '$score' }
      }
    },
    {
      $group: {
        _id: '$_id.userId',
        challengesCompleted: { $sum: 1 },
        totalBestTime: { $sum: '$bestTime' },
        avgScore: { $avg: '$bestScore' }
      }
    },
    { $sort: { challengesCompleted: -1, totalBestTime: 1 } },
    { $limit: 10 }
  ])
  console.log('Top 10 users:', userLeaderboard)

  return { languageStats, challengeStats, userLeaderboard }
}

async function runAllExamples() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const user = await User.findOne({ role: 'student' })
    const challenge = await Challenge.findOne({ language: 'javascript' })

    if (!user || !challenge) {
      console.log('Please ensure you have at least one student user and one challenge in the database')
      return
    }

    console.log(`Using user: ${user.name} (${user._id})`)
    console.log(`Using challenge: ${challenge.title} (${challenge._id})`)

    await otpExamples(user._id)
    await challengeAnswerExamples(user._id, challenge._id, challenge.language)
    await latestAnswerExamples(user._id)
    await attemptAgainExample(user._id, challenge._id)
    await analyticsExamples()

    console.log('\n=== All examples completed successfully! ===\n')
  } catch (error) {
    console.error('Error running examples:', error)
  } finally {
    await mongoose.disconnect()
  }
}

export {
  otpExamples,
  challengeAnswerExamples,
  latestAnswerExamples,
  attemptAgainExample,
  analyticsExamples,
  runAllExamples
}


