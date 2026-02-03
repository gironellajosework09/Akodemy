// Mongoose schema for cached error humanizer outputs.
import mongoose from 'mongoose'

const errorHumanizerCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  friendlyFeedbackJson: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { collection: 'error_humanizer_cache' })

errorHumanizerCacheSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 14 }
)

export default mongoose.model('ErrorHumanizerCache', errorHumanizerCacheSchema)
