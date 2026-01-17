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
  awardedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

badgeSchema.index({ userId: 1, language: 1, difficulty: 1 }, { unique: true })

export default mongoose.model('Badge', badgeSchema)
