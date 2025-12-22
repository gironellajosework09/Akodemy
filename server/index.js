import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import challengeRoutes from './routes/challenges.js'
import executeRoutes from './routes/execute.js'
import progressRoutes from './routes/progress.js'
import facultyRoutes from './routes/faculty.js'
import publicRoutes from './routes/public.js'
import scoringRoutes from './routes/scoring.js'
import gradingRoutes from './routes/grading.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

app.use('/api/auth', authRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/execute', executeRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/faculty', facultyRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/score', scoringRoutes)
app.use('/api/grading', gradingRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
