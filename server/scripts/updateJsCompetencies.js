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
  { slug: 'hello-world-js', competencies: ['Variables & Data Types', 'Functions'] },
  { slug: 'leap-js', competencies: ['Control Structures', 'Functions'] },
  { slug: 'reverse-string-js', competencies: ['Functions', 'Control Structures', 'Arrays & Collections'] },
  { slug: 'resistor-color-js', competencies: ['Variables & Data Types', 'Arrays & Collections', 'Functions'] },
  { slug: 'two-fer-js', competencies: ['Variables & Data Types', 'Functions', 'Control Structures'] },
  { slug: 'roman-numerals-js', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'hamming-js', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'anagram-js', competencies: ['Arrays & Collections', 'Control Structures', 'Functions'] },
  { slug: 'isogram-js', competencies: ['Arrays & Collections', 'Control Structures', 'Functions'] },
  { slug: 'pangram-js', competencies: ['Arrays & Collections', 'Control Structures', 'Functions'] },
  { slug: 'rna-transcription-js', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'space-age-js', competencies: ['Variables & Data Types', 'Control Structures', 'Functions'] },
  { slug: 'bank-account-js', competencies: ['Object-Oriented Programming', 'Error Handling', 'Control Structures'] },
  { slug: 'isbn-verifier-js', competencies: ['Control Structures', 'Arrays & Collections', 'Functions', 'Error Handling'] },
  { slug: 'binary-search-js', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'flatten-array-js', competencies: ['Arrays & Collections', 'Control Structures', 'Functions'] },
  { slug: 'rle-js', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'robot-name-js', competencies: ['Object-Oriented Programming', 'Control Structures', 'Functions'] }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'javascript' },
        { $set: { competencies: update.competencies } }
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
