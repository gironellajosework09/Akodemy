import mongoose from 'mongoose'

const scoreMismatchLogSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChallengeAnswer',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  exerciseSlug: String,
  language: String,
  storedScore: {
    type: Number,
    required: true
  },
  computedScore: {
    type: Number,
    required: true
  },
  scoreDiff: {
    type: Number,
    required: true
  },
  storedIsCorrect: Boolean,
  computedIsCorrect: Boolean,
  correctnessMismatch: Boolean,
  gradingDetails: {
    type: mongoose.Schema.Types.Mixed
  },
  corrected: {
    type: Boolean,
    default: false
  },
  correctedAt: Date,
  detectedAt: {
    type: Date,
    default: Date.now
  }
})

scoreMismatchLogSchema.index({ detectedAt: -1 })
scoreMismatchLogSchema.index({ exerciseSlug: 1, detectedAt: -1 })
scoreMismatchLogSchema.index({ language: 1, detectedAt: -1 })
scoreMismatchLogSchema.index({ corrected: 1 })

export default mongoose.model('ScoreMismatchLog', scoreMismatchLogSchema)
