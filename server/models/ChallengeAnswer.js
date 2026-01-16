// Mongoose schema for Challenge Answer records.
import mongoose from 'mongoose'

// Schema details and validation for Challenge Answer.
const challengeAnswerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java'],
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  runs: {
    type: Number,
    default: 0,
    min: 0
  },
  startedAt: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  bestTime: {
    type: Number,
    default: 0
  }
})

challengeAnswerSchema.index({ userId: 1, challengeId: 1, submittedAt: -1 })
challengeAnswerSchema.index({ userId: 1, challengeId: 1, attemptNumber: 1 })
challengeAnswerSchema.index({ challengeId: 1, isCorrect: 1 })
challengeAnswerSchema.index({ userId: 1, language: 1 })

challengeAnswerSchema.pre('save', function(next) {
  if (this.startedAt && this.submittedAt) {
    this.bestTime = Math.round((this.submittedAt - this.startedAt) / 1000)
  }
  next()
})

challengeAnswerSchema.statics.getNextAttemptNumber = async function(userId, challengeId) {
  const lastAttempt = await this.findOne({ userId, challengeId })
    .sort({ attemptNumber: -1 })
    .select('attemptNumber')
    .lean()
  
  return lastAttempt ? lastAttempt.attemptNumber + 1 : 1
}

challengeAnswerSchema.statics.getUserChallengeHistory = async function(userId, challengeId, options = {}) {
  const { limit = 10, skip = 0 } = options
  
  return this.find({ userId, challengeId })
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

challengeAnswerSchema.statics.getUserStats = async function(userId, language = null) {
  const match = { userId: new mongoose.Types.ObjectId(userId) }
  if (language) match.language = language
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$challengeId',
        totalAttempts: { $sum: 1 },
        totalRuns: { $sum: '$runs' },
        bestScore: { $max: '$score' },
        fastestTime: { $min: '$bestTime' },
        isCompleted: { $max: { $cond: ['$isCorrect', 1, 0] } }
      }
    },
    {
      $group: {
        _id: null,
        challengesAttempted: { $sum: 1 },
        challengesCompleted: { $sum: '$isCompleted' },
        totalAttempts: { $sum: '$totalAttempts' },
        totalRuns: { $sum: '$totalRuns' },
        avgBestScore: { $avg: '$bestScore' }
      }
    }
  ])
  
  return stats[0] || {
    challengesAttempted: 0,
    challengesCompleted: 0,
    totalAttempts: 0,
    totalRuns: 0,
    avgBestScore: 0
  }
}

export default mongoose.model('ChallengeAnswer', challengeAnswerSchema)



