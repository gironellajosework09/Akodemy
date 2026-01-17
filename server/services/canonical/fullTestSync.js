import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

const CACHE_DIR = path.join(__dirname, '..', '..', 'canonical-cache')
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/exercism/problem-specifications/main/exercises'
const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Akodemy-Grading-Engine'
}

const challengeSchema = new mongoose.Schema({
  title: String,
  slug: String,
  language: String,
  exercismSlug: String,
  testCases: [{
    input: mongoose.Schema.Types.Mixed,
    expected: mongoose.Schema.Types.Mixed,
    description: String,
    uuid: String,
    property: String
  }],
  canonicalTests: mongoose.Schema.Types.Mixed,
  canonicalTestsMeta: {
    fetchedAt: Date,
    status: String,
    errorMessage: String,
    testCount: Number
  }
}, { strict: false })

function getModel() {
  try {
    return mongoose.model('Challenge')
  } catch {
    return mongoose.model('Challenge', challengeSchema)
  }
}

function flattenCases(data, results = [], parentDesc = '') {
  if (!data || !data.cases) return results
  
  const reimplementedUuids = new Set()
  
  function collectReimplements(cases) {
    for (const item of cases) {
      if (item.cases) {
        collectReimplements(item.cases)
      } else if (item.reimplements) {
        reimplementedUuids.add(item.reimplements)
      }
    }
  }
  collectReimplements(data.cases)
  
  function extract(cases, parentDescription) {
    for (const item of cases) {
      if (item.cases) {
        const desc = parentDescription 
          ? `${parentDescription} > ${item.description}`
          : (item.description || '')
        extract(item.cases, desc)
      } else if (item.uuid && !reimplementedUuids.has(item.uuid)) {
        results.push({
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
  
  extract(data.cases, parentDesc)
  return results
}

function convertToTestCase(canonicalCase) {
  return {
    uuid: canonicalCase.uuid,
    description: canonicalCase.description || 'Test case',
    property: canonicalCase.property,
    input: canonicalCase.input,
    expected: canonicalCase.expected
  }
}

async function fetchAndCacheCanonical(exerciseSlug) {
  const url = `${GITHUB_BASE_URL}/${exerciseSlug}/canonical-data.json`
  const cacheDir = path.join(CACHE_DIR, exerciseSlug)
  const cachePath = path.join(cacheDir, 'canonical-data.json')
  
  try {
    const response = await axios.get(url, { 
      headers: GITHUB_HEADERS, 
      timeout: 15000 
    })
    
    await fs.mkdir(cacheDir, { recursive: true })
    await fs.writeFile(cachePath, JSON.stringify(response.data, null, 2))
    
    return { success: true, data: response.data }
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'not_found' }
    }
    return { success: false, error: error.message }
  }
}

async function loadFromCache(exerciseSlug) {
  const cachePath = path.join(CACHE_DIR, exerciseSlug, 'canonical-data.json')
  try {
    const content = await fs.readFile(cachePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function syncExercise(Challenge, exerciseSlug, options = {}) {
  const { forceRefresh = false, onProgress } = options
  
  let canonicalData = null
  
  if (!forceRefresh) {
    canonicalData = await loadFromCache(exerciseSlug)
  }
  
  if (!canonicalData) {
    const result = await fetchAndCacheCanonical(exerciseSlug)
    if (!result.success) {
      return { 
        slug: exerciseSlug, 
        success: false, 
        error: result.error,
        testCount: 0
      }
    }
    canonicalData = result.data
  }
  
  const flatCases = flattenCases(canonicalData)
  const testCases = flatCases.map(convertToTestCase)
  
  const updateResult = await Challenge.updateMany(
    { exercismSlug: exerciseSlug },
    {
      $set: {
        testCases: testCases,
        canonicalTests: flatCases,
        'canonicalTestsMeta.fetchedAt': new Date(),
        'canonicalTestsMeta.status': 'success',
        'canonicalTestsMeta.errorMessage': null,
        'canonicalTestsMeta.testCount': testCases.length
      }
    }
  )
  
  if (onProgress) {
    onProgress(`  ✓ ${exerciseSlug}: ${testCases.length} tests (updated ${updateResult.modifiedCount} challenges)`)
  }
  
  return {
    slug: exerciseSlug,
    success: true,
    testCount: testCases.length,
    challengesUpdated: updateResult.modifiedCount
  }
}

export async function fullTestSync(options = {}) {
  const { 
    languages = ['javascript', 'python', 'java'],
    forceRefresh = false,
    onProgress = console.log
  } = options
  
  const wasConnected = mongoose.connection.readyState === 1
  
  if (!wasConnected) {
    onProgress('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
  }
  
  const Challenge = getModel()
  
  const challenges = await Challenge.find(
    languages.length > 0 ? { language: { $in: languages } } : {}
  ).lean()
  
  onProgress(`Found ${challenges.length} challenges across ${languages.join(', ')}`)
  
  const uniqueSlugs = [...new Set(challenges.map(c => c.exercismSlug).filter(Boolean))]
  onProgress(`Processing ${uniqueSlugs.length} unique exercises...\n`)
  
  const stats = {
    total: uniqueSlugs.length,
    success: 0,
    notFound: 0,
    failed: 0,
    totalTests: 0,
    notFoundSlugs: [],
    failedSlugs: []
  }
  
  for (let i = 0; i < uniqueSlugs.length; i++) {
    const slug = uniqueSlugs[i]
    
    if (i > 0 && i % 50 === 0) {
      onProgress(`\n--- Progress: ${i}/${uniqueSlugs.length} ---\n`)
    }
    
    const result = await syncExercise(Challenge, slug, { forceRefresh, onProgress })
    
    if (result.success) {
      stats.success++
      stats.totalTests += result.testCount
    } else if (result.error === 'not_found') {
      stats.notFound++
      stats.notFoundSlugs.push(slug)
      onProgress(`  ✗ ${slug}: not found in Exercism`)
    } else {
      stats.failed++
      stats.failedSlugs.push({ slug, error: result.error })
      onProgress(`  ✗ ${slug}: ${result.error}`)
    }
    
    await new Promise(r => setTimeout(r, 50))
  }
  
  const challengesWithTests = await Challenge.countDocuments({
    language: { $in: languages },
    'testCases.0': { $exists: true }
  })
  
  const challengesWithoutTests = await Challenge.countDocuments({
    language: { $in: languages },
    $or: [
      { testCases: { $exists: false } },
      { testCases: { $size: 0 } }
    ]
  })
  
  onProgress('\n' + '='.repeat(50))
  onProgress('SYNC COMPLETE')
  onProgress('='.repeat(50))
  onProgress(`Exercises processed: ${stats.total}`)
  onProgress(`  Success: ${stats.success}`)
  onProgress(`  Not Found: ${stats.notFound}`)
  onProgress(`  Failed: ${stats.failed}`)
  onProgress(`Total test cases synced: ${stats.totalTests}`)
  onProgress('')
  onProgress(`Challenges with tests: ${challengesWithTests}`)
  onProgress(`Challenges without tests: ${challengesWithoutTests}`)
  
  if (stats.notFoundSlugs.length > 0) {
    onProgress('\nExercises not found in Exercism problem-specifications:')
    stats.notFoundSlugs.forEach(s => onProgress(`  - ${s}`))
  }
  
  if (stats.failedSlugs.length > 0) {
    onProgress('\nFailed exercises:')
    stats.failedSlugs.forEach(s => onProgress(`  - ${s.slug}: ${s.error}`))
  }
  
  if (!wasConnected) {
    await mongoose.disconnect()
  }
  
  return {
    ...stats,
    challengesWithTests,
    challengesWithoutTests
  }
}

export async function getTestCoverage() {
  const wasConnected = mongoose.connection.readyState === 1
  
  if (!wasConnected) {
    await mongoose.connect(process.env.MONGODB_URI)
  }
  
  const Challenge = getModel()
  
  const coverage = await Challenge.aggregate([
    {
      $group: {
        _id: '$language',
        total: { $sum: 1 },
        withTests: {
          $sum: {
            $cond: [{ $gt: [{ $size: { $ifNull: ['$testCases', []] } }, 0] }, 1, 0]
          }
        },
        totalTestCases: {
          $sum: { $size: { $ifNull: ['$testCases', []] } }
        }
      }
    },
    { $sort: { _id: 1 } }
  ])
  
  const totals = coverage.reduce((acc, lang) => {
    acc.total += lang.total
    acc.withTests += lang.withTests
    acc.totalTestCases += lang.totalTestCases
    return acc
  }, { total: 0, withTests: 0, totalTestCases: 0 })
  
  if (!wasConnected) {
    await mongoose.disconnect()
  }
  
  return { byLanguage: coverage, totals }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const forceRefresh = args.includes('--force')
  const languageArg = args.find(a => a.startsWith('--language='))
  const languages = languageArg 
    ? [languageArg.split('=')[1]]
    : ['javascript', 'python', 'java']
  
  console.log(`Starting full test sync...`)
  console.log(`Languages: ${languages.join(', ')}`)
  console.log(`Force refresh: ${forceRefresh}`)
  console.log('')
  
  fullTestSync({ languages, forceRefresh })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Sync failed:', err)
      process.exit(1)
    })
}
