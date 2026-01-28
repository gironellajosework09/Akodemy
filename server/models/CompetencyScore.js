import mongoose from 'mongoose'

const COMPETENCY_AREAS = [
  'variables',
  'controlStructures',
  'functions',
  'arrays',
  'oop',
  'errorHandling'
]

const COMPETENCY_NAMES = {
  variables: 'Variables & Data Types',
  controlStructures: 'Control Structures',
  functions: 'Functions',
  arrays: 'Arrays & Collections',
  oop: 'Object-Oriented Programming',
  errorHandling: 'Error Handling'
}

const competencyScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java'],
    required: true
  },
  competencyArea: {
    type: String,
    enum: COMPETENCY_AREAS,
    required: true
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  successfulAttempts: {
    type: Number,
    default: 0
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

competencyScoreSchema.index({ userId: 1, language: 1, competencyArea: 1 }, { unique: true })
competencyScoreSchema.index({ userId: 1, language: 1 })

competencyScoreSchema.statics.COMPETENCY_AREAS = COMPETENCY_AREAS
competencyScoreSchema.statics.COMPETENCY_NAMES = COMPETENCY_NAMES

competencyScoreSchema.statics.getOrCreate = async function(userId, language, competencyArea) {
  let score = await this.findOne({ userId, language, competencyArea })
  if (!score) {
    score = await this.create({ userId, language, competencyArea, score: 0 })
  }
  return score
}

competencyScoreSchema.statics.getUserScores = async function(userId, language = null) {
  const query = { userId }
  if (language) query.language = language
  
  return this.find(query).lean()
}

competencyScoreSchema.statics.updateScore = async function(userId, language, competencyArea, scoreDelta, isSuccess) {
  const score = await this.getOrCreate(userId, language, competencyArea)
  
  const newScore = Math.max(0, Math.min(100, score.score + scoreDelta))
  
  score.score = newScore
  score.totalAttempts += 1
  if (isSuccess) score.successfulAttempts += 1
  score.lastUpdatedAt = new Date()
  
  await score.save()
  return score
}

competencyScoreSchema.statics.getFormattedScores = async function(userId, language) {
  const scores = await this.find({ userId, language }).lean()
  
  const formatted = {}
  for (const area of COMPETENCY_AREAS) {
    const found = scores.find(s => s.competencyArea === area)
    formatted[area] = {
      score: found?.score || 0,
      name: COMPETENCY_NAMES[area],
      totalAttempts: found?.totalAttempts || 0,
      successfulAttempts: found?.successfulAttempts || 0
    }
  }
  return formatted
}

export default mongoose.model('CompetencyScore', competencyScoreSchema)
