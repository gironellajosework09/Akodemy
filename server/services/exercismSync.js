// Sync Exercism exercises into the database.
import axios from 'axios'

// Service logic for Exercism Sync.
const GITHUB_API = 'https://api.github.com'
const GITHUB_RAW = 'https://raw.githubusercontent.com'

const TRACKS = {
  javascript: 'javascript',
  python: 'python',
  java: 'java'
}

const COMPETENCY_KEYWORDS = {
  0: ['hello', 'two-fer', 'resistor', 'gigasecond', 'bob', 'raindrops', 'darts', 'space-age', 'perfect-numbers', 'armstrong', 'grains', 'eliuds-eggs', 'allergies', 'square-root', 'secret-handshake', 'leap', 'difference-of-squares', 'nth-prime', 'sum-of-multiples', 'collatz', 'pythagorean', 'prime-factors', 'largest-series'],
  1: ['leap', 'collatz', 'difference', 'grains', 'largest', 'prime', 'perfect', 'armstrong', 'sum-of', 'square', 'pythagorean', 'binary', 'hexadecimal', 'octal', 'trinary', 'all-your-base', 'roman', 'pig-latin', 'meetup', 'beer-song', 'twelve-days', 'proverb', 'bottle-song'],
  2: ['reverse', 'rna', 'hamming', 'isogram', 'pangram', 'acronym', 'run-length', 'atbash', 'rotational', 'crypto', 'simple-cipher', 'rail-fence', 'transpose', 'say', 'wordy', 'forth', 'protein', 'nucleotide', 'point-mutations', 'matching-brackets', 'dominoes', 'connect'],
  3: ['word-count', 'nucleotide', 'etl', 'anagram', 'series', 'strain', 'accumulate', 'flatten', 'saddle', 'matrix', 'spiral', 'sublist', 'list-ops', 'linked-list', 'custom-set', 'circular-buffer', 'simple-linked', 'doubly', 'binary-search-tree', 'zipper', 'tree-building', 'pov', 'tournament', 'grade-school', 'high-scores', 'kindergarten'],
  4: ['triangle', 'robot', 'clock', 'bank-account', 'circular', 'complex', 'rational', 'queen', 'bowling', 'yacht', 'poker', 'minesweeper', 'go-counting', 'rectangles', 'killer-sudoku', 'zebra-puzzle', 'alphametics', 'scale', 'dnd', 'food-chain', 'house', 'change', 'knapsack', 'state-of-tic-tac-toe'],
  5: ['phone', 'luhn', 'isbn', 'error', 'exception', 'validation', 'markdown', 'sgf', 'variable-length', 'paasio', 'rest-api', 'affine', 'grep', 'satellite', 'react', 'pipelining', 'scrabble', 'sieve', 'pascal', 'binary-search', 'book-store', 'ocr', 'ledger', 'lens-person']
}

function hashStringToIndex(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) % 6
}

async function fetchAllExercisesForTrack(track) {
  try {
    const url = `${GITHUB_API}/repos/exercism/${track}/contents/exercises/practice`
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Akodemy-App'
      }
    })
    
    return response.data
      .filter(item => item.type === 'dir')
      .map(item => item.name)
  } catch (error) {
    console.error(`Failed to fetch exercise list for ${track}:`, error.message)
    return []
  }
}

async function fetchTrackConfig(track) {
  try {
    const url = `${GITHUB_RAW}/exercism/${track}/main/config.json`
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.log(`Could not fetch config for ${track}`)
    return null
  }
}

async function fetchExerciseInstructions(track, slug) {
  try {
    const url = `${GITHUB_RAW}/exercism/${track}/main/exercises/practice/${slug}/.docs/instructions.md`
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    return `Complete the ${formatTitle(slug)} challenge.`
  }
}

async function fetchCanonicalData(slug) {
  try {
    const url = `${GITHUB_RAW}/exercism/problem-specifications/main/exercises/${slug}/canonical-data.json`
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    return null
  }
}

function extractAllTestCases(cases, results = []) {
  if (!cases) return results
  
  for (const testCase of cases) {
    if (testCase.cases) {
      extractAllTestCases(testCase.cases, results)
    } else if (testCase.property && testCase.expected !== undefined) {
      results.push({
        description: testCase.description || testCase.property,
        input: testCase.input,
        expected: testCase.expected,
        property: testCase.property
      })
    }
  }
  return results
}

function formatTitle(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getDifficultyFromLevel(difficulty) {
  if (difficulty <= 3) return 'beginner'
  if (difficulty <= 6) return 'intermediate'
  return 'advanced'
}

function getCompetencyIndex(slug) {
  for (const [index, keywords] of Object.entries(COMPETENCY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (slug.includes(keyword) || slug === keyword) {
        return parseInt(index)
      }
    }
  }
  return hashStringToIndex(slug)
}

function generateStarterCode(language, slug, testCases) {
  const functionName = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const className = formatTitle(slug).replace(/\s/g, '')
  
  const property = testCases?.[0]?.property || functionName
  
  switch (language) {
    case 'javascript':
      return `// ${formatTitle(slug)}
// Write your solution here

export function ${property}(input) {
  // Implement your solution
  throw new Error('Not implemented');
}

// For testing:
// console.log(${property}(/* your test input */));
`
    case 'python':
      return `# ${formatTitle(slug)}
# Write your solution here

def ${property.replace(/([A-Z])/g, '_$1').toLowerCase()}(input):
    """Implement your solution"""
    raise NotImplementedError("Not implemented")

# For testing:
# print(${property.replace(/([A-Z])/g, '_$1').toLowerCase()}(/* your test input */))
`
    case 'java':
      return `// ${formatTitle(slug)}
// Write your solution here

public class ${className} {
    public Object ${property}(Object input) {
        // Implement your solution
        throw new UnsupportedOperationException("Not implemented");
    }
    
    public static void main(String[] args) {
        ${className} solution = new ${className}();
        // Test your solution
    }
}
`
    default:
      return `// Write your solution here`
  }
}

async function syncExerciseForLanguage(language, slug, exerciseConfig) {
  const track = TRACKS[language]
  
  const instructions = await fetchExerciseInstructions(track, slug)
  const canonicalData = await fetchCanonicalData(slug)
  const testCases = canonicalData ? extractAllTestCases(canonicalData.cases) : []
  
  const difficulty = exerciseConfig?.difficulty 
    ? getDifficultyFromLevel(exerciseConfig.difficulty)
    : 'intermediate'
  
  const starterCode = generateStarterCode(language, slug, testCases)
  
  return {
    title: formatTitle(slug),
    slug: `${slug}-${language}`,
    exerciseSlug: slug,
    description: instructions,
    language,
    difficulty,
    starterCode,
    testCases,
    competencyIndex: getCompetencyIndex(slug),
    source: 'exercism',
    canonicalData: canonicalData ? true : false
  }
}

async function syncAllChallenges(Challenge, options = {}) {
  const { onProgress, languages = ['javascript', 'python', 'java'] } = options
  const results = {
    synced: 0,
    updated: 0,
    failed: 0,
    errors: [],
    exercises: []
  }
  
  for (const language of languages) {
    const track = TRACKS[language]
    if (!track) continue
    
    if (onProgress) onProgress(`Fetching exercise list for ${language}...`)
    
    const trackConfig = await fetchTrackConfig(track)
    const exerciseConfigs = {}
    
    if (trackConfig?.exercises?.practice) {
      for (const ex of trackConfig.exercises.practice) {
        exerciseConfigs[ex.slug] = ex
      }
    }
    
    const exercises = await fetchAllExercisesForTrack(track)
    
    if (onProgress) onProgress(`Found ${exercises.length} exercises for ${language}`)
    
    for (let i = 0; i < exercises.length; i++) {
      const slug = exercises[i]
      
      try {
        if (onProgress && i % 10 === 0) {
          onProgress(`Syncing ${language}: ${i + 1}/${exercises.length} - ${slug}`)
        }
        
        const exerciseData = await syncExerciseForLanguage(
          language, 
          slug, 
          exerciseConfigs[slug]
        )
        
        const existing = await Challenge.findOne({ slug: exerciseData.slug })
        
        if (existing) {
          await Challenge.updateOne(
            { slug: exerciseData.slug },
            { $set: exerciseData }
          )
          results.updated++
        } else {
          await Challenge.create(exerciseData)
          results.synced++
        }
        
        results.exercises.push({
          title: exerciseData.title,
          language,
          difficulty: exerciseData.difficulty,
          testCasesCount: exerciseData.testCases.length
        })
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        results.failed++
        results.errors.push({ slug, language, error: error.message })
        console.error(`Failed to sync ${slug} for ${language}:`, error.message)
      }
    }
  }
  
  return results
}

export {
  syncAllChallenges,
  fetchAllExercisesForTrack,
  fetchCanonicalData,
  extractAllTestCases,
  TRACKS
}



