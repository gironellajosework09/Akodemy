import mongoose from 'mongoose'

const competencyHistorySchema = new mongoose.Schema({
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
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChallengeAnswer',
    required: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java'],
    required: true
  },
  competencyArea: {
    type: String,
    required: true
  },
  previousScore: {
    type: Number,
    required: true
  },
  newScore: {
    type: Number,
    required: true
  },
  scoreDelta: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: ['correct_submission', 'incorrect_submission', 'retake_correct', 'retake_incorrect', 'first_attempt', 'admin_adjustment'],
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true
  },
  testScore: {
    type: Number,
    default: 0
  },
  passedTests: {
    type: Number,
    default: 0
  },
  totalTests: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

competencyHistorySchema.index({ userId: 1, createdAt: -1 })
competencyHistorySchema.index({ userId: 1, language: 1, createdAt: -1 })
competencyHistorySchema.index({ userId: 1, competencyArea: 1, createdAt: -1 })
competencyHistorySchema.index({ challengeId: 1, userId: 1 })

competencyHistorySchema.statics.logChange = async function(data) {
  return this.create(data)
}

competencyHistorySchema.statics.getUserHistory = async function(userId, options = {}) {
  const { language, competencyArea, limit = 50, skip = 0 } = options
  
  const query = { userId }
  if (language) query.language = language
  if (competencyArea) query.competencyArea = competencyArea
  
  return this.find(query)
    .populate('challengeId', 'title slug difficulty')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

competencyHistorySchema.statics.getChallengeHistory = async function(userId, challengeId) {
  return this.find({ userId, challengeId })
    .sort({ createdAt: -1 })
    .lean()
}

export default mongoose.model('CompetencyHistory', competencyHistorySchema)
