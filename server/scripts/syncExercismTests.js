// CLI script to sync Exercism tests.toml into challenges.
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Challenge from '../models/Challenge.js'
import { syncExercismTests } from '../services/exercismTestsSync.js'

// Service logic for running the sync from the command line.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'

function parseArgs() {
  const args = process.argv.slice(2)
  const result = { languages: null, force: false, listNotFound: false }

  for (const arg of args) {
    if (arg.startsWith('--languages=')) {
      const value = arg.split('=')[1] || ''
      result.languages = value.split(',').map(item => item.trim()).filter(Boolean)
    } else if (arg === '--force') {
      result.force = true
    } else if (arg === '--list-not-found') {
      result.listNotFound = true
    }
  }

  return result
}

async function run() {
  const options = parseArgs()

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    if (options.listNotFound) {
      const docs = await Challenge.find({ 'officialTestsMeta.status': 'not_found' })
        .select('slug language exerciseSlug officialTestsMeta.status')
        .lean()
      console.log(`Not found count: ${docs.length}`)
      docs.forEach((doc) => {
        console.log(`${doc.slug} | ${doc.language} | ${doc.exerciseSlug || ''}`)
      })
    } else {
      const results = await syncExercismTests(Challenge, {
        languages: options.languages || undefined,
        force: options.force,
        onProgress: (message) => console.log(message)
      })

      console.log('Sync results:', results)
    }
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Sync failed:', error.message)
    try {
      await mongoose.disconnect()
    } catch {}
    process.exit(1)
  }
}

run()
