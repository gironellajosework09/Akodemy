import axios from 'axios'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') })

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/exercism/problem-specifications/main/exercises'
const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Akodemy-Grading-Engine'
}

const canonicalTestSchema = new mongoose.Schema({
  uuid: String,
  description: String,
  property: String,
  input: mongoose.Schema.Types.Mixed,
  expected: mongoose.Schema.Types.Mixed
})

const challengeSchema = new mongoose.Schema({
  title: String,
  slug: String,
  language: String,
  exercismSlug: String,
  canonicalTests: [canonicalTestSchema],
  canonicalTestsMeta: {
    fetchedAt: Date,
    status: String,
    errorMessage: String,
    testCount: Number
  }
})

function flattenCases(data) {
  const cases = []
  
  function extractCases(items, parentDescription = '') {
    for (const item of items) {
      if (item.cases) {
        const desc = parentDescription 
          ? `${parentDescription} > ${item.description}`
          : item.description
        extractCases(item.cases, desc)
      } else {
        cases.push({
          uuid: item.uuid,
          description: parentDescription 
            ? `${parentDescription} > ${item.description}`
            : item.description,
          property: item.property,
          input: item.input || {},
          expected: item.expected
        })
      }
    }
  }
  
  extractCases(data.cases || [])
  return cases
}

async function fetchCanonicalData(exerciseSlug) {
  const url = `${GITHUB_BASE_URL}/${exerciseSlug}/canonical-data.json`
  
  try {
    const response = await axios.get(url, { 
      headers: GITHUB_HEADERS, 
      timeout: 15000 
    })
    return { success: true, data: response.data }
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'not_found', message: `Canonical data not found for: ${exerciseSlug}` }
    }
    return { success: false, error: 'failed', message: error.message }
  }
}

async function syncAllCanonicalTests() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(process.env.MONGODB_URI)
  
  const Challenge = mongoose.model('Challenge', challengeSchema)
  
  const challenges = await Challenge.find({})
  console.log(`Found ${challenges.length} challenges to sync`)
  
  const stats = {
    total: challenges.length,
    success: 0,
    notFound: 0,
    failed: 0,
    skipped: 0,
    byLanguage: { javascript: 0, python: 0, java: 0 }
  }
  
  const uniqueSlugs = new Map()
  
  for (const challenge of challenges) {
    const slug = challenge.exercismSlug
    if (!slug) {
      console.log(`  SKIP: ${challenge.title} - no exercismSlug`)
      stats.skipped++
      continue
    }
    
    if (!uniqueSlugs.has(slug)) {
      console.log(`Fetching canonical data for: ${slug}`)
      const result = await fetchCanonicalData(slug)
      
      if (result.success) {
        const testCases = flattenCases(result.data)
        uniqueSlugs.set(slug, { status: 'success', testCases, testCount: testCases.length })
      } else if (result.error === 'not_found') {
        uniqueSlugs.set(slug, { status: 'not_found', error: result.message })
      } else {
        uniqueSlugs.set(slug, { status: 'failed', error: result.message })
      }
      
      await new Promise(r => setTimeout(r, 100))
    }
  }
  
  console.log('\nUpdating challenges in database...')
  
  const failedExercises = []
  const notFoundExercises = []
  
  for (const challenge of challenges) {
    const slug = challenge.exercismSlug
    if (!slug) continue
    
    const cached = uniqueSlugs.get(slug)
    if (!cached) continue
    
    if (cached.status === 'success') {
      await Challenge.updateOne(
        { _id: challenge._id },
        {
          $set: {
            canonicalTests: cached.testCases,
            'canonicalTestsMeta.fetchedAt': new Date(),
            'canonicalTestsMeta.status': 'success',
            'canonicalTestsMeta.errorMessage': null,
            'canonicalTestsMeta.testCount': cached.testCount
          }
        }
      )
      stats.success++
      stats.byLanguage[challenge.language]++
      console.log(`  SUCCESS: ${challenge.title} (${challenge.language}) - ${cached.testCount} tests`)
    } else if (cached.status === 'not_found') {
      await Challenge.updateOne(
        { _id: challenge._id },
        {
          $set: {
            'canonicalTestsMeta.fetchedAt': new Date(),
            'canonicalTestsMeta.status': 'not_found',
            'canonicalTestsMeta.errorMessage': cached.error,
            'canonicalTestsMeta.testCount': 0
          }
        }
      )
      stats.notFound++
      if (!notFoundExercises.find(e => e.slug === slug)) {
        notFoundExercises.push({ slug, title: challenge.title })
      }
      console.log(`  NOT FOUND: ${challenge.title} (${slug})`)
    } else {
      await Challenge.updateOne(
        { _id: challenge._id },
        {
          $set: {
            'canonicalTestsMeta.fetchedAt': new Date(),
            'canonicalTestsMeta.status': 'failed',
            'canonicalTestsMeta.errorMessage': cached.error,
            'canonicalTestsMeta.testCount': 0
          }
        }
      )
      stats.failed++
      if (!failedExercises.find(e => e.slug === slug)) {
        failedExercises.push({ slug, title: challenge.title, error: cached.error })
      }
      console.log(`  FAILED: ${challenge.title} - ${cached.error}`)
    }
  }
  
  console.log('\n=== SYNC COMPLETE ===')
  console.log(`Total: ${stats.total}`)
  console.log(`Success: ${stats.success}`)
  console.log(`Not Found: ${stats.notFound}`)
  console.log(`Failed: ${stats.failed}`)
  console.log(`Skipped: ${stats.skipped}`)
  console.log('')
  console.log('By Language:')
  console.log(`  JavaScript: ${stats.byLanguage.javascript}`)
  console.log(`  Python: ${stats.byLanguage.python}`)
  console.log(`  Java: ${stats.byLanguage.java}`)
  
  if (notFoundExercises.length > 0) {
    console.log('\n=== EXERCISES NOT FOUND IN PROBLEM-SPECIFICATIONS ===')
    notFoundExercises.forEach(e => console.log(`  - ${e.slug} (${e.title})`))
  }
  
  if (failedExercises.length > 0) {
    console.log('\n=== FAILED EXERCISES (NEED REVIEW) ===')
    failedExercises.forEach(e => console.log(`  - ${e.slug}: ${e.error}`))
  }
  
  await mongoose.disconnect()
  
  return { stats, notFoundExercises, failedExercises }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncAllCanonicalTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Sync failed:', err)
      process.exit(1)
    })
}

export { syncAllCanonicalTests, fetchCanonicalData, flattenCases }
