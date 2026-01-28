// Production server with API routes and static client.
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import authRoutes from './routes/auth.js'
import challengeRoutes from './routes/challenges.js'
import executeRoutes from './routes/execute.js'
import progressRoutes from './routes/progress.js'
import facultyRoutes from './routes/faculty.js'
import publicRoutes from './routes/public.js'
import scoringRoutes from './routes/scoring.js'
import gradingRoutes from './routes/grading.js'
import badgeRoutes from './routes/badges.js'
import userRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'
import { seedDefaultAdmin } from './services/adminSeed.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'
if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not set; using local MongoDB at mongodb://localhost:27017/akodemy')
} else {
  console.log('MONGODB_URI loaded from environment')
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const dbName = mongoose.connection?.name || 'unknown'
    const dbHost = mongoose.connection?.host || 'unknown'
    console.log(`Connected to MongoDB (db: ${dbName}, host: ${dbHost})`)
    await seedDefaultAdmin()
  })
  .catch(err => console.error('MongoDB connection error:', err))

app.use('/api/auth', authRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/execute', executeRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/faculty', facultyRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/score', scoringRoutes)
app.use('/api/grading', gradingRoutes)
app.use('/api/badges', badgeRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(express.static(join(__dirname, '../client/dist')))

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`)
})


