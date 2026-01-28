// Sync Exercism instructions and starter templates into challenges.
import axios from 'axios'
import { normalizeToExercismSlug } from './exercismTestSync.js'

// Service logic for updating templates from Exercism sources.
const GITHUB_RAW = 'https://raw.githubusercontent.com'

const TRACKS = {
  javascript: 'javascript',
  python: 'python',
  java: 'java'
}

function getGithubHeaders() {
  const headers = {
    'User-Agent': 'Akodemy-Template-Sync'
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function toSnakeCase(str) {
  return str
    .replace(/-([a-z])/g, (_, c) => `_${c}`)
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_+/, '')
}

function toPascalCase(str) {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
}

function formatTitle(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function toJsParam(name, index) {
  const cleaned = String(name).replace(/[^a-zA-Z0-9_$]/g, '_')
  const camel = cleaned.replace(/_+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
  if (!camel || /^\d/.test(camel)) return `arg${index + 1}`
  return camel
}

function toPythonParam(name, index) {
  const cleaned = String(name).replace(/[^a-zA-Z0-9_]/g, '_')
  const snake = toSnakeCase(cleaned).replace(/__+/g, '_').replace(/^_+/, '')
  if (!snake || /^\d/.test(snake)) return `arg_${index + 1}`
  return snake
}

function toJavaParam(name, index) {
  const cleaned = String(name).replace(/[^a-zA-Z0-9_]/g, '_')
  const camel = toCamelCase(cleaned).replace(/[^a-zA-Z0-9_$]/g, '')
  if (!camel || /^\d/.test(camel)) return `arg${index + 1}`
  return camel
}

function getSampleInput(challenge) {
  const tests = (challenge.officialTests?.length ? challenge.officialTests : challenge.canonicalTests) || []
  for (const test of tests) {
    if (!Object.prototype.hasOwnProperty.call(test, 'input')) continue
    return test.input
  }
  return null
}

function getInputKeys(challenge) {
  const sampleInput = getSampleInput(challenge)
  if (sampleInput === null || sampleInput === undefined) return []
  if (Array.isArray(sampleInput)) {
    return sampleInput.map((_, index) => `arg${index + 1}`)
  }
  if (typeof sampleInput !== 'object') return ['input']
  const keys = Object.keys(sampleInput)
  return keys.length ? keys : []
}

async function fetchTrackConfig(track) {
  const url = `${GITHUB_RAW}/exercism/${track}/main/config.json`
  const response = await axios.get(url, {
    headers: getGithubHeaders(),
    timeout: 15000,
    validateStatus: (status) => status < 500
  })

  if (response.status >= 400) return null
  return response.data
}

function buildExerciseTypeMap(config) {
  const map = new Map()
  const exercises = config?.exercises || {}
  const practice = exercises.practice || []
  const concept = exercises.concept || []

  for (const item of practice) {
    const slug = typeof item === 'string' ? item : item?.slug
    if (slug) map.set(slug, 'practice')
  }
  for (const item of concept) {
    const slug = typeof item === 'string' ? item : item?.slug
    if (slug) map.set(slug, 'concept')
  }

  return map
}

async function fetchInstructions(track, slug, exerciseType) {
  const kinds = exerciseType ? [exerciseType] : ['practice', 'concept']

  for (const kind of kinds) {
    const url = `${GITHUB_RAW}/exercism/${track}/main/exercises/${kind}/${slug}/.docs/instructions.md`
    const response = await axios.get(url, {
      headers: getGithubHeaders(),
      timeout: 15000,
      validateStatus: (status) => status < 500
    })

    if (response.status === 404) continue
    if (response.status >= 400) break
    return response.data
  }

  return `Complete the ${formatTitle(slug)} challenge.`
}

function chooseProperty(challenge, slug) {
  const candidates = []
  const addProperty = (value) => {
    if (value && typeof value === 'string') candidates.push(value)
  }

  for (const test of challenge.officialTests || []) addProperty(test.property)
  for (const test of challenge.canonicalTests || []) addProperty(test.property)

  if (candidates.length === 0) return toCamelCase(slug)

  // Pick the most common property name from tests to match official expectations.
  const counts = new Map()
  for (const name of candidates) {
    counts.set(name, (counts.get(name) || 0) + 1)
  }

  let best = candidates[0]
  let bestCount = counts.get(best) || 0
  for (const [name, count] of counts.entries()) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }

  return best
}

function generateStarterCode(language, slug, property, inputKeys) {
  const functionName = toCamelCase(property || slug)
  const className = toPascalCase(slug)
  const snakeName = toSnakeCase(property || slug)
  const title = formatTitle(slug)
  const jsParams = inputKeys.map(toJsParam).join(', ')
  const pyParams = inputKeys.map(toPythonParam).join(', ')
  const javaParams = inputKeys.map((name, index) => `Object ${toJavaParam(name, index)}`).join(', ')

  switch (language) {
    case 'javascript':
      return `// ${title}
// Write your solution here

export function ${functionName}(${jsParams}) {
  // Implement your solution
  throw new Error('Not implemented')
}

// For testing:
// console.log(${functionName}(/* your test input */))
`
    case 'python':
      return `# ${title}
# Write your solution here

def ${snakeName}(${pyParams}):
    \"\"\"Implement your solution\"\"\"
    raise NotImplementedError(\"Not implemented\")

# For testing:
# print(${snakeName}(/* your test input */))
`
    case 'java':
      return `// ${title}
// Write your solution here

class ${className} {
    public Object ${functionName}(${javaParams}) {
        // Implement your solution
        throw new UnsupportedOperationException(\"Not implemented\");
    }
}

public class Main {
    public static void main(String[] args) {
        ${className} solution = new ${className}();
        // Add your own test calls here
    }
}
`
    default:
      return `// Write your solution here`
  }
}

export async function syncExercismTemplates(Challenge, options = {}) {
  const { languages = ['javascript', 'python', 'java'], onProgress } = options

  const trackMaps = {}
  for (const language of languages) {
    const track = TRACKS[language]
    if (!track) continue
    const config = await fetchTrackConfig(track)
    trackMaps[track] = buildExerciseTypeMap(config)
  }

  const challenges = await Challenge.find({ language: { $in: languages } })
  if (onProgress) onProgress(`Found ${challenges.length} challenges`)

  let updated = 0
  for (const challenge of challenges) {
    const baseSlug = challenge.exerciseSlug || normalizeToExercismSlug(challenge.slug)
    const track = TRACKS[challenge.language]
    const exerciseType = trackMaps[track]?.get(baseSlug)

    const description = await fetchInstructions(track, baseSlug, exerciseType)
    const property = chooseProperty(challenge, baseSlug)
    const inputKeys = getInputKeys(challenge)
    const starterCode = generateStarterCode(challenge.language, baseSlug, property, inputKeys)

    await Challenge.updateOne(
      { _id: challenge._id },
      { $set: { description, starterCode } }
    )

    updated++
    if (onProgress && updated % 50 === 0) {
      onProgress(`Updated ${updated}/${challenges.length}`)
    }
  }

  return { updated, total: challenges.length }
}
