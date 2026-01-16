// Sync Exercism tests to the local cache.
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// Service logic for Exercism Test Sync.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GITHUB_RAW = 'https://raw.githubusercontent.com'
const EXERCISM_BASE_DIR = path.join(__dirname, '..', 'exercism')

const TRACKS = {
  javascript: 'javascript',
  python: 'python',
  java: 'java'
}

const TEST_FILE_PATTERNS = {
  javascript: { suffix: '.spec.js', solutionSuffix: '.js' },
  python: { suffix: '_test.py', solutionSuffix: '.py' },
  java: { suffix: 'Test.java', solutionSuffix: '.java' }
}

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
}

async function fetchTestFile(language, slug) {
  const track = TRACKS[language]
  const pattern = TEST_FILE_PATTERNS[language]
  
  if (!track || !pattern) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const slugName = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const snakeName = slug.replace(/-/g, '_')
  
  let testFileName, testUrls

  // Exercism test paths differ by language; build the correct URL per track.
  switch (language) {
    case 'javascript':
      testFileName = `${slug}.spec.js`
      testUrls = [
        `${GITHUB_RAW}/exercism/${track}/main/exercises/practice/${slug}/${testFileName}`,
        `${GITHUB_RAW}/exercism/${track}/main/exercises/concept/${slug}/${testFileName}`
      ]
      break
    case 'python':
      testFileName = `${snakeName}_test.py`
      testUrls = [
        `${GITHUB_RAW}/exercism/${track}/main/exercises/practice/${slug}/${testFileName}`,
        `${GITHUB_RAW}/exercism/${track}/main/exercises/concept/${slug}/${testFileName}`
      ]
      break
    case 'java':
      const className = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
      testFileName = `${className}Test.java`
      testUrls = [
        `${GITHUB_RAW}/exercism/${track}/main/exercises/practice/${slug}/src/test/java/${testFileName}`,
        `${GITHUB_RAW}/exercism/${track}/main/exercises/concept/${slug}/src/test/java/${testFileName}`
      ]
      break
    default:
      throw new Error(`Unknown language: ${language}`)
  }

  for (const testUrl of testUrls) {
    try {
      const response = await axios.get(testUrl, { timeout: 10000, validateStatus: (status) => status < 500 })
      if (response.status === 404) continue
      if (response.status >= 400) {
        console.log(`Could not fetch test file for ${slug} (${language}): ${response.status}`)
        continue
      }
      return {
        fileName: testFileName,
        content: response.data,
        url: testUrl
      }
    } catch (error) {
      console.log(`Could not fetch test file for ${slug} (${language}): ${error.message}`)
    }
  }

  return null
}

async function fetchExampleSolution(language, slug) {
  const track = TRACKS[language]
  const snakeName = slug.replace(/-/g, '_')
  
  let solutionUrl
  
  // Example solutions live in language-specific folders.
  switch (language) {
    case 'javascript':
      solutionUrl = `${GITHUB_RAW}/exercism/${track}/main/exercises/practice/${slug}/.meta/proof.ci.js`
      break
    case 'python':
      solutionUrl = `${GITHUB_RAW}/exercism/${track}/main/exercises/practice/${slug}/.meta/example.py`
      break
    case 'java':
      const className = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
      solutionUrl = `${GITHUB_RAW}/exercism/${track}/main/exercises/practice/${slug}/.meta/src/reference/java/${className}.java`
      break
    default:
      return null
  }

  try {
    const response = await axios.get(solutionUrl, { timeout: 10000 })
    return response.data
  } catch (error) {
    try {
      if (language === 'javascript') {
        // Some JS exercises use an alternate exemplar path.
        const altUrl = `${GITHUB_RAW}/exercism/${track}/main/exercises/practice/${slug}/.meta/exemplar.js`
        const response = await axios.get(altUrl, { timeout: 10000 })
        return response.data
      }
    } catch (e) {}
    return null
  }
}

async function saveTestFile(language, slug, testFile) {
  if (!testFile) return null
  
  const exerciseDir = path.join(EXERCISM_BASE_DIR, language, slug)
  await ensureDir(exerciseDir)
  
  const testFilePath = path.join(exerciseDir, testFile.fileName)
  await fs.writeFile(testFilePath, testFile.content, 'utf8')
  
  return testFilePath
}

async function downloadExerciseTests(language, slug) {
  const testFile = await fetchTestFile(language, slug)
  if (!testFile) return null
  
  const savedPath = await saveTestFile(language, slug, testFile)
  
  const exampleSolution = await fetchExampleSolution(language, slug)
  if (exampleSolution) {
    const exerciseDir = path.join(EXERCISM_BASE_DIR, language, slug)
    const solutionFileName = language === 'python' 
      ? `${slug.replace(/-/g, '_')}.py`
      : language === 'java'
        ? `${slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}.java`
        : `${slug}.js`
    await fs.writeFile(path.join(exerciseDir, `.example${path.extname(solutionFileName)}`), exampleSolution, 'utf8')
  }
  
  return {
    testFilePath: savedPath,
    testFileName: testFile.fileName,
    exerciseDir: path.join(EXERCISM_BASE_DIR, language, slug)
  }
}

function normalizeToExercismSlug(slug) {
  // Strip language suffixes so slugs match Exercism's canonical naming.
  return slug
    .replace(/-(?:javascript|python|java)$/i, '')
    .replace(/-(?:js|py)$/i, '')
}

async function syncTestFilesForChallenge(challenge) {
  const slug = challenge.exerciseSlug || normalizeToExercismSlug(challenge.slug)
  
  try {
    const result = await downloadExerciseTests(challenge.language, slug)
    return result
  } catch (error) {
    console.error(`Failed to sync test files for ${challenge.slug}:`, error.message)
    return null
  }
}

async function syncAllTestFiles(Challenge, options = {}) {
  const { onProgress, languages = ['javascript', 'python', 'java'] } = options
  
  const results = {
    synced: 0,
    failed: 0,
    errors: []
  }
  
  await ensureDir(EXERCISM_BASE_DIR)
  
  const challenges = await Challenge.find({ 
    language: { $in: languages }
  })
  
  if (onProgress) onProgress(`Found ${challenges.length} challenges to sync test files for`)
  
  for (let i = 0; i < challenges.length; i++) {
    const challenge = challenges[i]
    
    if (onProgress && i % 20 === 0) {
      onProgress(`Syncing test files: ${i + 1}/${challenges.length} - ${challenge.slug}`)
    }
    
    try {
      const testInfo = await syncTestFilesForChallenge(challenge)
      
      if (testInfo) {
        await Challenge.updateOne(
          { _id: challenge._id },
          { 
            $set: { 
              testFilePath: testInfo.testFilePath,
              exerciseDir: testInfo.exerciseDir
            } 
          }
        )
        results.synced++
      } else {
        results.failed++
        results.errors.push({ slug: challenge.slug, error: 'Could not fetch test file' })
      }
      
      // Small delay to avoid hammering GitHub with back-to-back requests.
      await new Promise(resolve => setTimeout(resolve, 50))
      
    } catch (error) {
      results.failed++
      results.errors.push({ slug: challenge.slug, error: error.message })
    }
  }
  
  return results
}

async function getTestFilePath(language, slug) {
  const exerciseSlug = normalizeToExercismSlug(slug)
  const exerciseDir = path.join(EXERCISM_BASE_DIR, language, exerciseSlug)
  
  try {
    const files = await fs.readdir(exerciseDir)
    const pattern = TEST_FILE_PATTERNS[language]
    const testFile = files.find(f => f.endsWith(pattern.suffix))
    
    if (testFile) {
      return path.join(exerciseDir, testFile)
    }
  } catch (error) {}
  
  return null
}

async function readTestFile(language, slug) {
  const testFilePath = await getTestFilePath(language, slug)
  if (!testFilePath) return null
  
  try {
    const content = await fs.readFile(testFilePath, 'utf8')
    return { path: testFilePath, content }
  } catch (error) {
    return null
  }
}

export {
  downloadExerciseTests,
  syncTestFilesForChallenge,
  syncAllTestFiles,
  getTestFilePath,
  readTestFile,
  normalizeToExercismSlug,
  EXERCISM_BASE_DIR,
  TEST_FILE_PATTERNS
}



