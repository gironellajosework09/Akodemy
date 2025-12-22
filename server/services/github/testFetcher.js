import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GITHUB_API_BASE = 'https://api.github.com'
const CACHE_DIR = path.join(__dirname, '..', '..', 'test-cache')

const REPO_CONFIG = {
  python: {
    owner: 'exercism',
    repo: 'python',
    testPattern: '_test.py',
    exercisePath: (slug) => `exercises/practice/${slug}`,
    testFileName: (slug) => `${slug.replace(/-/g, '_')}_test.py`
  },
  javascript: {
    owner: 'exercism',
    repo: 'javascript',
    testPattern: '.spec.js',
    exercisePath: (slug) => `exercises/practice/${slug}`,
    testFileName: (slug) => `${slug}.spec.js`
  },
  java: {
    owner: 'exercism',
    repo: 'java',
    testPattern: 'Test.java',
    exercisePath: (slug) => `exercises/practice/${slug}/src/test/java`,
    testFileName: (slug) => {
      const className = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
      return `${className}Test.java`
    }
  }
}

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
}

function getCachePath(language, slug) {
  return path.join(CACHE_DIR, language, slug)
}

async function isCached(language, slug) {
  const cachePath = getCachePath(language, slug)
  try {
    const files = await fs.readdir(cachePath)
    const config = REPO_CONFIG[language]
    return files.some(f => f.includes(config.testPattern))
  } catch {
    return false
  }
}

async function fetchFromGitHub(language, slug) {
  const config = REPO_CONFIG[language]
  if (!config) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const exercisePath = config.exercisePath(slug)
  const apiUrl = `${GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${exercisePath}`
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Akodemy-Grading-Engine'
  }
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
  }

  try {
    const response = await axios.get(apiUrl, { headers, timeout: 15000 })
    const files = response.data
    
    if (!Array.isArray(files)) {
      throw new Error('Unexpected response format from GitHub API')
    }
    
    const testFile = files.find(f => f.name.includes(config.testPattern))
    
    if (!testFile) {
      throw new Error(`No test file found for ${slug} in ${language}`)
    }
    
    const fileResponse = await axios.get(testFile.url, { headers, timeout: 15000 })
    const fileData = fileResponse.data
    
    if (fileData.encoding !== 'base64') {
      throw new Error('Unexpected file encoding from GitHub API')
    }
    
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
    
    return {
      fileName: testFile.name,
      content,
      sha: fileData.sha,
      size: fileData.size
    }
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Exercise '${slug}' not found in ${language} repository`)
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please set GITHUB_TOKEN environment variable.')
    }
    throw error
  }
}

async function cacheTestFile(language, slug, testFile) {
  const cachePath = getCachePath(language, slug)
  await ensureDir(cachePath)
  
  const filePath = path.join(cachePath, testFile.fileName)
  await fs.writeFile(filePath, testFile.content, 'utf-8')
  
  const metaPath = path.join(cachePath, '.meta.json')
  await fs.writeFile(metaPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    sha: testFile.sha,
    fileName: testFile.fileName
  }), 'utf-8')
  
  return filePath
}

async function readCachedTest(language, slug) {
  const cachePath = getCachePath(language, slug)
  const config = REPO_CONFIG[language]
  
  try {
    const files = await fs.readdir(cachePath)
    const testFileName = files.find(f => f.includes(config.testPattern))
    
    if (!testFileName) return null
    
    const content = await fs.readFile(path.join(cachePath, testFileName), 'utf-8')
    return {
      fileName: testFileName,
      content,
      path: path.join(cachePath, testFileName)
    }
  } catch {
    return null
  }
}

export async function fetchTests(language, exerciseSlug) {
  const normalizedSlug = exerciseSlug
    .replace(/-(?:javascript|python|java)$/i, '')
    .replace(/-(?:js|py)$/i, '')
  
  if (await isCached(language, normalizedSlug)) {
    console.log(`Using cached test for ${normalizedSlug} (${language})`)
    const cached = await readCachedTest(language, normalizedSlug)
    if (cached) return cached
  }
  
  console.log(`Fetching test from GitHub for ${normalizedSlug} (${language})`)
  
  try {
    const testFile = await fetchFromGitHub(language, normalizedSlug)
    const filePath = await cacheTestFile(language, normalizedSlug, testFile)
    
    return {
      fileName: testFile.fileName,
      content: testFile.content,
      path: filePath
    }
  } catch (error) {
    console.error(`Failed to fetch tests for ${normalizedSlug}:`, error.message)
    return null
  }
}

export async function clearCache(language, slug) {
  const cachePath = getCachePath(language, slug)
  try {
    await fs.rm(cachePath, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

export async function getCacheStats() {
  const stats = { python: 0, javascript: 0, java: 0 }
  
  for (const lang of Object.keys(stats)) {
    try {
      const langPath = path.join(CACHE_DIR, lang)
      const dirs = await fs.readdir(langPath)
      stats[lang] = dirs.length
    } catch {
      stats[lang] = 0
    }
  }
  
  return stats
}

export { REPO_CONFIG, CACHE_DIR }
