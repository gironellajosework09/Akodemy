import mongoose from 'mongoose'

const testCaseSchema = new mongoose.Schema({
  input: mongoose.Schema.Types.Mixed,
  expected: mongoose.Schema.Types.Mixed,
  description: String
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
  }
}, { timestamps: true })

export default mongoose.model('Challenge', challengeSchema)
