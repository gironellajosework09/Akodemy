import mongoose from 'mongoose'

const testCaseSchema = new mongoose.Schema({
  input: mongoose.Schema.Types.Mixed,
  expected: mongoose.Schema.Types.Mixed,
  description: String
})

const canonicalTestSchema = new mongoose.Schema({
  uuid: String,
  description: String,
  property: String,
  input: mongoose.Schema.Types.Mixed,
  expected: mongoose.Schema.Types.Mixed
})

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
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
  starterCode: {
    type: String,
    required: true
  },
  solution: {
    type: String,
    default: ''
  },
  testCases: [testCaseSchema],
  competencyIndex: {
    type: Number,
    default: 0
  },
  testFilePath: {
    type: String,
    default: null
  },
  exerciseDir: {
    type: String,
    default: null
  },
  exerciseSlug: {
    type: String,
    default: null
  },
  canonicalTests: {
    type: [canonicalTestSchema],
    default: []
  },
  canonicalTestsMeta: {
    fetchedAt: { type: Date, default: null },
    status: { 
      type: String, 
      enum: ['pending', 'success', 'failed', 'not_found'],
      default: 'pending'
    },
    errorMessage: { type: String, default: null },
    testCount: { type: Number, default: 0 }
  }
}, { timestamps: true })

export default mongoose.model('Challenge', challengeSchema)
