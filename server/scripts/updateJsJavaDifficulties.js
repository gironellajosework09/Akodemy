import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Challenge from '../models/Challenge.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'

const UPDATES = [
  { slug: 'roman-numerals-js', language: 'javascript', difficulty: 'beginner' },
  { slug: 'anagram-js', language: 'javascript', difficulty: 'intermediate' },
  { slug: 'roman-numerals-java', language: 'java', difficulty: 'beginner' },
  { slug: 'anagram-java', language: 'java', difficulty: 'intermediate' }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: update.language },
        { $set: { difficulty: update.difficulty } }
      )

      if (result.matchedCount > 0) {
        console.log(`Updated: ${update.slug}`)
      } else {
        console.log(`Skipped (not found): ${update.slug}`)
      }
    }
  } catch (error) {
    console.error('Update failed:', error.message)
    process.exitCode = 1
  } finally {
    try {
      await mongoose.disconnect()
    } catch {}
  }
}

run()
