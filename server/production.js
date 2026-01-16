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

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const MONGODB_URI = process.env.MONGODB_URI

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

app.use('/api/auth', authRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/execute', executeRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/faculty', facultyRoutes)

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


