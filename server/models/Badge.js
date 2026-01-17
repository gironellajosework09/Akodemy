import mongoose from 'mongoose'

const badgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badgeName: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  status: {
    type: String,
    enum: ['claimable', 'claimed'],
    default: 'claimable'
  },
  equipped: {
    type: Boolean,
    default: false
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  claimedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

badgeSchema.index({ userId: 1, language: 1, difficulty: 1 }, { unique: true })
badgeSchema.index({ userId: 1, equipped: 1 })

export default mongoose.model('Badge', badgeSchema)
