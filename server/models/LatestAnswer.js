import mongoose from 'mongoose'

const latestAnswerSchema = new mongoose.Schema({
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
}, { timestamps: true })

latestAnswerSchema.index({ userId: 1, challengeId: 1 }, { unique: true })
latestAnswerSchema.index({ userId: 1, language: 1 })

latestAnswerSchema.statics.upsertFromSubmission = async function(submission) {
  const { userId, challengeId, answer, language, isCorrect, score, attemptNumber, runs, startedAt, submittedAt, bestTime } = submission
  
  return this.findOneAndUpdate(
    { userId, challengeId },
    {
      userId,
      challengeId,
      answer,
      language,
      isCorrect,
      score,
      attemptNumber,
      runs,
      startedAt,
      submittedAt,
      bestTime
    },
    { upsert: true, new: true, runValidators: true }
  )
}

latestAnswerSchema.statics.getUserLatestAnswers = async function(userId, language = null) {
  const query = { userId }
  if (language) query.language = language
  
  return this.find(query)
    .populate('challengeId', 'title slug difficulty')
    .sort({ submittedAt: -1 })
    .lean()
}

export default mongoose.model('LatestAnswer', latestAnswerSchema)
