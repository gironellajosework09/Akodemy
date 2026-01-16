// Sync Exercism tests.toml files into normalized tests and generated suites.
import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseTestsToml } from './exercismTestsToml.js'
import { getTestCases } from './canonical/testFetcher.js'
import { downloadExerciseTests } from './exercismTestSync.js'
import {
  generateJestTests,
  generateJUnitTests,
  generatePytestTests,
  getGeneratedTestPath
} from './exercismTestGenerators.js'

// Service logic for fetching and syncing official Exercism tests.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OFFICIAL_TESTS_DIR = path.join(__dirname, '..', 'official-tests')

const GITHUB_API = 'https://api.github.com'
const GITHUB_RAW = 'https://raw.githubusercontent.com'
const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Akodemy-Exercism-Sync'
}

const TRACKS = {
  javascript: 'javascript',
  python: 'python',
  java: 'java'
}

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
}

function getGithubHeaders() {
  const headers = { ...GITHUB_HEADERS }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

function buildRateLimitMessage(headers) {
  const reset = headers['x-ratelimit-reset']
  if (!reset) return 'GitHub rate limit exceeded. Set GITHUB_TOKEN in server/.env and retry.'
  const resetDate = new Date(Number(reset) * 1000).toISOString()
  return `GitHub rate limit exceeded. Try again after ${resetDate} or set GITHUB_TOKEN in server/.env.`
}

async function githubGet(url, allowNotFound = false) {
  const response = await axios.get(url, {
    headers: getGithubHeaders(),
    timeout: 15000,
    validateStatus: (status) => status < 500
  })

  if (response.status === 404 && allowNotFound) return null

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers['x-ratelimit-remaining']
    if (!process.env.GITHUB_TOKEN || remaining === '0') {
      throw new Error(buildRateLimitMessage(response.headers))
    }
    throw new Error(`GitHub API rate limit hit: ${response.status}`)
  }

  if (response.status >= 400) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response
}

async function fetchDirectoryEntries(track, repoPath) {
  const url = `${GITHUB_API}/repos/exercism/${track}/contents/${repoPath}`
  const response = await githubGet(url, true)
  if (!response) return []
  return response.data || []
}

function extractSlugs(entries) {
  if (!Array.isArray(entries)) return []
  return entries
    .map((entry) => (typeof entry === 'string' ? entry : entry?.slug))
    .filter(Boolean)
}

async function fetchExercisesFromConfig(track) {
  const url = `${GITHUB_RAW}/exercism/${track}/main/config.json`
  const response = await axios.get(url, {
    headers: getGithubHeaders(),
    timeout: 15000,
    validateStatus: (status) => status < 500
  })

  if (response.status >= 400) return []

  const config = response.data || {}
  const exercises = config.exercises || {}
  const entries = []

  const practice = extractSlugs(exercises.practice)
  const concept = extractSlugs(exercises.concept)

  for (const slug of practice) {
    entries.push({ slug, exercisePath: `exercises/practice/${slug}` })
  }
  for (const slug of concept) {
    entries.push({ slug, exercisePath: `exercises/concept/${slug}` })
  }

  return entries
}

async function fetchExercisePathsFromApi(track) {
  const rootEntries = await fetchDirectoryEntries(track, 'exercises')
  const entries = []
  const seen = new Set()

  const hasPractice = rootEntries.some(entry => entry.name === 'practice')
  const hasConcept = rootEntries.some(entry => entry.name === 'concept')

  if (hasPractice || hasConcept) {
    const kinds = ['practice', 'concept'].filter(kind => rootEntries.some(entry => entry.name === kind))
    for (const kind of kinds) {
      const kindEntries = await fetchDirectoryEntries(track, `exercises/${kind}`)
      for (const entry of kindEntries) {
        if (entry.type !== 'dir') continue
        if (seen.has(entry.name)) continue
        seen.add(entry.name)
        entries.push({ slug: entry.name, exercisePath: `exercises/${kind}/${entry.name}` })
      }
    }
  } else {
    for (const entry of rootEntries) {
      if (entry.type !== 'dir') continue
      if (seen.has(entry.name)) continue
      seen.add(entry.name)
      entries.push({ slug: entry.name, exercisePath: `exercises/${entry.name}` })
    }
  }

  return entries
}

async function fetchExercisePaths(track) {
  const configEntries = await fetchExercisesFromConfig(track)
  if (configEntries.length > 0) return configEntries
  return await fetchExercisePathsFromApi(track)
}

async function fetchTestsToml(track, exercisePath, slug) {
  const candidates = [
    `${exercisePath}/.meta/tests.toml`,
    `exercises/${slug}/.meta/tests.toml`
  ]
  const seen = new Set()

  for (const candidate of candidates) {
    if (seen.has(candidate)) continue
    seen.add(candidate)

    const url = `${GITHUB_RAW}/exercism/${track}/main/${candidate}`
    const response = await axios.get(url, {
      headers: getGithubHeaders(),
      timeout: 15000,
      validateStatus: (status) => status < 500
    })

    if (response.status === 404) continue
    if (response.status >= 400) {
      throw new Error(`GitHub raw error: ${response.status}`)
    }

    const content = response.data
    const hash = crypto.createHash('sha256').update(content).digest('hex')
    return { content, hash, url, path: candidate }
  }

  return null
}

async function findChallengeForExercise(Challenge, slug, language) {
  return await Challenge.findOne({ slug }) ||
    await Challenge.findOne({ slug: `${slug}-${language}` }) ||
    await Challenge.findOne({ exerciseSlug: slug, language })
}

function buildTestsPayload(tests) {
  return tests.map(test => ({
    name: test.name,
    property: test.property || null,
    input: test.input ?? {},
    expected: test.expected
  }))
}

async function buildOfficialTests(slug, tomlTests) {
  let canonicalByUuid = new Map()
  let canonicalError = null

  try {
    const canonical = await getTestCases(slug)
    canonicalByUuid = new Map(
      (canonical.cases || []).map((testCase) => [testCase.uuid, testCase])
    )
  } catch (error) {
    canonicalError = error.message
  }

  const tests = []
  const missing = []

  for (const test of tomlTests) {
    const uuid = test.uuid || test.reimplements || null
    const canonicalCase = uuid ? canonicalByUuid.get(uuid) : null
    const hasInput = Object.prototype.hasOwnProperty.call(test, 'input')
    const hasExpected = Object.prototype.hasOwnProperty.call(test, 'expected')

    if (!hasInput || !hasExpected) {
      if (!canonicalCase) {
        missing.push(uuid || test.name || 'unknown')
        continue
      }
    }

    tests.push({
      name: test.name || canonicalCase?.description || 'Unnamed test',
      property: test.property || canonicalCase?.property || null,
      input: hasInput ? test.input : canonicalCase?.input ?? {},
      expected: hasExpected ? test.expected : canonicalCase?.expected
    })
  }

  return { tests, missing, canonicalError }
}

function generateTestFile(language, slug, tests) {
  if (language === 'python') return generatePytestTests(slug, tests)
  if (language === 'java') return generateJUnitTests(slug, tests)
  return generateJestTests(slug, tests)
}

export async function syncExercismTests(Challenge, options = {}) {
  const {
    languages = ['python', 'java', 'javascript'],
    force = false,
    onProgress
  } = options

  const results = {
    total: 0,
    synced: 0,
    updated: 0,
    skipped: 0,
    notFound: 0,
    fallback: 0,
    failed: 0,
    errors: []
  }

  for (const language of languages) {
    const track = TRACKS[language] || language
    const exercises = await fetchExercisePaths(track)
    results.total += exercises.length

    if (onProgress) onProgress(`Found ${exercises.length} exercises for ${language}`)

    for (let i = 0; i < exercises.length; i++) {
      const { slug, exercisePath } = exercises[i]

      if (onProgress && i % 25 === 0) {
        onProgress(`Syncing ${language}: ${i + 1}/${exercises.length} - ${slug}`)
      }

      try {
        const toml = await fetchTestsToml(track, exercisePath, slug)
        const challenge = await findChallengeForExercise(Challenge, slug, language)

        if (!toml) {
          let fallbackInfo = null

          try {
            fallbackInfo = await downloadExerciseTests(language, slug)
          } catch (error) {
            fallbackInfo = null
          }

          if (challenge) {
            if (fallbackInfo?.testFilePath) {
              await Challenge.updateOne(
                { _id: challenge._id },
                {
                  $set: {
                    officialTests: [],
                    officialTestFilePath: fallbackInfo.testFilePath,
                    testFilePath: fallbackInfo.testFilePath,
                    exerciseDir: fallbackInfo.exerciseDir,
                    officialTestsMeta: {
                      fetchedAt: new Date(),
                      status: 'fallback',
                      errorMessage: 'tests.toml not found; using track test file',
                      testCount: 0,
                      tomlSha: null,
                      sourcePath: exercisePath,
                      testsTomlUrl: null
                    }
                  }
                }
              )
              results.fallback++
              continue
            }

            await Challenge.updateOne(
              { _id: challenge._id },
              {
                $set: {
                  officialTestsMeta: {
                    fetchedAt: new Date(),
                    status: 'not_found',
                    errorMessage: 'tests.toml not found',
                    testCount: 0,
                    tomlSha: null,
                    sourcePath: exercisePath,
                    testsTomlUrl: null
                  }
                }
              }
            )
          }
          results.notFound++
          continue
        }

        if (!challenge) {
          results.skipped++
          continue
        }

        if (!force && challenge.officialTestsMeta?.tomlSha === toml.hash) {
          results.skipped++
          continue
        }

        const parsed = parseTestsToml(toml.content)
        const { tests: officialTests, missing, canonicalError } = await buildOfficialTests(slug, parsed.tests || [])
        const tests = buildTestsPayload(officialTests || [])
        const missingMessage = missing.length > 0
          ? `Missing canonical tests: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`
          : null
        const canonicalMessage = canonicalError ? `Canonical data unavailable: ${canonicalError}` : null

        if (tests.length === 0) {
          await Challenge.updateOne(
            { _id: challenge._id },
            {
              $set: {
                officialTestsMeta: {
                  fetchedAt: new Date(),
                  status: 'failed',
                  errorMessage: canonicalMessage || missingMessage || 'No tests found in tests.toml',
                  testCount: 0,
                  tomlSha: toml.hash,
                  sourcePath: exercisePath,
                  testsTomlUrl: toml.url
                }
              }
            }
          )
          results.failed++
          continue
        }

        const generated = generateTestFile(language, slug, tests)
        const testFilePath = getGeneratedTestPath(OFFICIAL_TESTS_DIR, language, slug)
        await ensureDir(path.dirname(testFilePath))
        await fs.writeFile(testFilePath, generated, 'utf8')

        await Challenge.updateOne(
          { _id: challenge._id },
          {
            $set: {
              officialTests: tests,
              officialTestFilePath: testFilePath,
              officialTestsMeta: {
                fetchedAt: new Date(),
                status: missing.length > 0 ? 'failed' : 'success',
                errorMessage: missingMessage,
                testCount: tests.length,
                tomlSha: toml.hash,
                sourcePath: exercisePath,
                testsTomlUrl: toml.url
              }
            }
          }
        )

        if (missing.length > 0) {
          results.failed++
          results.errors.push({ slug, language, error: missingMessage })
        } else if (challenge.officialTestsMeta?.tomlSha) {
          results.updated++
        } else {
          results.synced++
        }
      } catch (error) {
        results.failed++
        results.errors.push({ slug, language, error: error.message })
      }

      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  return results
}

export { OFFICIAL_TESTS_DIR }
