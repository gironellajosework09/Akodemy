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
  { slug: 'roman-numerals-py', difficulty: 'beginner' },
  { slug: 'anagram-py', difficulty: 'intermediate' },
  { slug: 'bank-account-py', difficulty: 'advanced' },
  { slug: 'isbn-verifier-py', difficulty: 'advanced' }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'python' },
        { $set: { difficulty: update.difficulty } }
      )

      if (result.matchedCount > 0) {
        console.log(`Updated: ${update.slug} → ${update.difficulty}`)
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
