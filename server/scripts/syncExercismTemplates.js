// CLI script to update challenge starter code and instructions from Exercism.
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Challenge from '../models/Challenge.js'
import { syncExercismTemplates } from '../services/exercismTemplatesSync.js'

// Service logic for syncing starter templates and instructions.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'

function parseArgs() {
  const args = process.argv.slice(2)
  const result = { languages: null }

  for (const arg of args) {
    if (arg.startsWith('--languages=')) {
      const value = arg.split('=')[1] || ''
      result.languages = value.split(',').map(item => item.trim()).filter(Boolean)
    }
  }

  return result
}

async function run() {
  const options = parseArgs()

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const results = await syncExercismTemplates(Challenge, {
      languages: options.languages || undefined,
      onProgress: (message) => console.log(message)
    })

    console.log('Sync results:', results)
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Template sync failed:', error.message)
    try {
      await mongoose.disconnect()
    } catch {}
    process.exit(1)
  }
}

run()
