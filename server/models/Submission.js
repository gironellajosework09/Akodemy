import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema({
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
  code: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'accepted', 'wrong_answer', 'error', 'timeout'],
    default: 'pending'
  },
  output: String,
  error: String,
  hint: String,
  runtime: Number,
  memory: Number,
  time: Number,
  runCount: { type: Number, default: 1 },
  completed: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('Submission', submissionSchema)
