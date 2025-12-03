import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty'],
    default: 'student'
  },
  phone: String,
  address: String,
  birthdate: String,
  sex: String,
  info: String,
  competencies: {
    javascript: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0]
    },
    python: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0]
    },
    java: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0]
    }
  },
  progress: {
    javascript: { type: Number, default: 0 },
    python: { type: Number, default: 0 },
    java: { type: Number, default: 0 }
  }
}, { timestamps: true })

export default mongoose.model('User', userSchema)
