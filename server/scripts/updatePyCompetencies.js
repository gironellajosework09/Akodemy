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
  {
    slug: 'hello-world-py',
    competencies: ['Variables & Data Types', 'Functions']
  },
  {
    slug: 'leap-py',
    competencies: ['Control Structures', 'Functions']
  },
  {
    slug: 'reverse-string-py',
    competencies: ['Functions', 'Control Structures', 'Arrays & Collections']
  },
  {
    slug: 'sum-multiples-py',
    competencies: ['Control Structures', 'Functions', 'Arrays & Collections']
  },
  {
    slug: 'two-fer-py',
    competencies: ['Variables & Data Types', 'Functions', 'Control Structures']
  },
  {
    slug: 'hamming-py',
    competencies: ['Control Structures', 'Functions', 'Arrays & Collections']
  },
  {
    slug: 'isogram-py',
    competencies: ['Control Structures', 'Arrays & Collections', 'Functions']
  },
  {
    slug: 'pangram-py',
    competencies: ['Control Structures', 'Arrays & Collections', 'Functions']
  },
  {
    slug: 'rna-py',
    competencies: ['Control Structures', 'Functions', 'Arrays & Collections']
  },
  {
    slug: 'triangle-py',
    competencies: ['Control Structures', 'Functions', 'Error Handling']
  },
  {
    slug: 'isbn-verifier-py',
    competencies: ['Control Structures', 'Arrays & Collections', 'Functions', 'Error Handling']
  },
  {
    slug: 'bank-account-py',
    competencies: ['Object-Oriented Programming', 'Error Handling', 'Control Structures']
  },
  {
    slug: 'anagram-py',
    competencies: ['Arrays & Collections', 'Control Structures', 'Functions']
  },
  {
    slug: 'binary-search-py',
    competencies: ['Control Structures', 'Functions', 'Arrays & Collections']
  },
  {
    slug: 'flatten-py',
    competencies: ['Arrays & Collections', 'Control Structures', 'Functions']
  },
  {
    slug: 'roman-numerals-py',
    competencies: ['Control Structures', 'Arrays & Collections', 'Functions']
  },
  {
    slug: 'rle-py',
    competencies: ['Control Structures', 'Arrays & Collections', 'Functions']
  },
  {
    slug: 'robot-name-py',
    competencies: ['Object-Oriented Programming', 'Control Structures', 'Functions']
  }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'python' },
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
