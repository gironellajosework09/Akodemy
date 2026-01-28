// Mongoose schema for User records.
import mongoose from 'mongoose'

// Schema details and validation for User.
const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    default: null
  },
  givenName: {
    type: String,
    default: null
  },
  middleName: {
    type: String,
    default: null
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
  yearLevelAndSection: {
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
    enum: ['admin', 'student', 'faculty'],
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
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true })

userSchema.index({ portalUserId: 1 }, { unique: true, sparse: true })
userSchema.index({ portalUsername: 1 }, { sparse: true })

export default mongoose.model('User', userSchema)



