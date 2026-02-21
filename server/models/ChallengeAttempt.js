// Mongoose schema for challenge attempt session records.
import mongoose from 'mongoose'

// Schema details and validation for challenge attempts.
const challengeAttemptSchema = new mongoose.Schema({
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
  sessionId: {
    type: String,
    required: true,
    trim: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

challengeAttemptSchema.index({ userId: 1, challengeId: 1, sessionId: 1 }, { unique: true })
challengeAttemptSchema.index({ userId: 1, challengeId: 1, attemptNumber: 1 }, { unique: true })
challengeAttemptSchema.index({ userId: 1, challengeId: 1, startedAt: -1 })

export default mongoose.model('ChallengeAttempt', challengeAttemptSchema)
