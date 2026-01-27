// Mongoose schema for User records.
import mongoose from 'mongoose'

// Schema details and validation for User.
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
  student_id: {
    type: String,
    default: null
  },
  portalUserId: {
    type: String,
    default: null
  },
  portalUsername: {
    type: String,
    default: null
  },
  portalRole: {
    type: String,
    default: null
  },
  password: {
    type: String,
    required: true
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date,
    default: null
  },
  passwordSource: {
    type: String,
    enum: ['akodemy', 'ccis', 'sso-temp'],
    default: 'akodemy'
  },
  previousPassword: {
    type: String,
    default: null
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
  yearSection: String,
  info: String,
  resetOtp: {
    code: String,
    expiresAt: Date
  },
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
  },
  lastSyncedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

userSchema.index({ portalUserId: 1 }, { unique: true, sparse: true })
userSchema.index({ portalUsername: 1 }, { sparse: true })

export default mongoose.model('User', userSchema)



