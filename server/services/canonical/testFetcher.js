// Fetch canonical test cases.
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// Service logic for Test Fetcher.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CACHE_DIR = path.join(__dirname, '..', '..', 'canonical-cache')
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Akodemy-Grading-Engine'
}

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
}

function getCachePath(slug) {
  return path.join(CACHE_DIR, slug)
}

async function isCacheValid(slug) {
  try {
    const metaPath = path.join(getCachePath(slug), '.meta.json')
    const metaContent = await fs.readFile(metaPath, 'utf-8')
    const meta = JSON.parse(metaContent)
    const fetchedAt = new Date(meta.fetchedAt).getTime()
    return (Date.now() - fetchedAt) < CACHE_TTL_MS
  } catch {
    return false
  }
}

async function fetchCanonicalData(slug) {
  const normalizedSlug = slug
    .replace(/-(?:javascript|python|java)$/i, '')
    .replace(/-(?:js|py)$/i, '')
  
  if (await isCacheValid(normalizedSlug)) {
    console.log(`Using cached canonical data for ${normalizedSlug}`)
    return readCachedData(normalizedSlug)
  }
  
  console.log(`Fetching canonical data from GitHub for ${normalizedSlug}`)
  
  const url = `https://raw.githubusercontent.com/exercism/problem-specifications/main/exercises/${normalizedSlug}/canonical-data.json`
  
  try {
    const response = await axios.get(url, { 
      headers: GITHUB_HEADERS, 
      timeout: 15000 
    })
    
    const data = response.data
    
    await cacheData(normalizedSlug, data)
    
    return data
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Canonical data not found for exercise: ${normalizedSlug}`)
    }
    throw new Error(`Failed to fetch canonical data: ${error.message}`)
  }
}

async function cacheData(slug, data) {
  const cachePath = getCachePath(slug)
  await ensureDir(cachePath)
  
  await fs.writeFile(
    path.join(cachePath, 'canonical-data.json'),
    JSON.stringify(data, null, 2),
    'utf-8'
  )
  
  await fs.writeFile(
    path.join(cachePath, '.meta.json'),
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      exercise: slug
    }),
    'utf-8'
  )
}

async function readCachedData(slug) {
  const dataPath = path.join(getCachePath(slug), 'canonical-data.json')
  const content = await fs.readFile(dataPath, 'utf-8')
  return JSON.parse(content)
}

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

export async function getTestCases(slug) {
  const data = await fetchCanonicalData(slug)
  
  if (!data || !data.cases) {
    throw new Error(`No test cases found for exercise: ${slug}`)
  }
  
  const cases = flattenCases(data)
  
  return {
    exercise: data.exercise,
    property: cases[0]?.property || data.exercise,
    cases
  }
}

export async function getCacheStats() {
  const stats = { total: 0, exercises: [] }
  
  try {
    const dirs = await fs.readdir(CACHE_DIR)
    stats.total = dirs.length
    stats.exercises = dirs.filter(d => !d.startsWith('.'))
  } catch {
    stats.total = 0
  }
  
  return stats
}

export { CACHE_DIR }



