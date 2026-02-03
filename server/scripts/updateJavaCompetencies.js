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
  { slug: 'hello-world-java', competencies: ['Variables & Data Types', 'Functions'] },
  { slug: 'leap-java', competencies: ['Control Structures', 'Functions'] },
  { slug: 'reverse-string-java', competencies: ['Functions', 'Control Structures', 'Arrays & Collections'] },
  { slug: 'resistor-color-java', competencies: ['Variables & Data Types', 'Arrays & Collections', 'Functions'] },
  { slug: 'resistor-java', competencies: ['Variables & Data Types', 'Arrays & Collections', 'Functions'] },
  { slug: 'two-fer-java', competencies: ['Variables & Data Types', 'Functions', 'Control Structures'] },
  { slug: 'roman-numerals-java', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'hamming-java', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'anagram-java', competencies: ['Arrays & Collections', 'Control Structures', 'Functions'] },
  { slug: 'difference-squares-java', competencies: ['Variables & Data Types', 'Control Structures', 'Functions'] },
  { slug: 'isogram-java', competencies: ['Arrays & Collections', 'Control Structures', 'Functions'] },
  { slug: 'pangram-java', competencies: ['Arrays & Collections', 'Control Structures', 'Functions'] },
  { slug: 'rna-java', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'bank-account-java', competencies: ['Object-Oriented Programming', 'Error Handling', 'Control Structures'] },
  { slug: 'isbn-verifier-java', competencies: ['Control Structures', 'Arrays & Collections', 'Functions', 'Error Handling'] },
  { slug: 'binary-search-java', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'prime-factors-java', competencies: ['Variables & Data Types', 'Control Structures', 'Functions', 'Arrays & Collections'] },
  { slug: 'rle-java', competencies: ['Control Structures', 'Arrays & Collections', 'Functions'] },
  { slug: 'robot-name-java', competencies: ['Object-Oriented Programming', 'Control Structures', 'Functions'] }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'java' },
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
