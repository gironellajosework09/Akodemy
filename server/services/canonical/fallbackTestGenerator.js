import axios from 'axios'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

const challengeSchema = new mongoose.Schema({
  exerciseSlug: String,
  language: String,
  title: String,
  testCases: mongoose.Schema.Types.Mixed
}, { strict: false })

function getModel() {
  try {
    return mongoose.model('Challenge')
  } catch {
    return mongoose.model('Challenge', challengeSchema)
  }
}

const FALLBACK_TESTS = {
  'hexadecimal': [
    { description: 'hexadecimal 1 is decimal 1', input: { hexString: '1' }, expected: 1 },
    { description: 'hexadecimal a is decimal 10', input: { hexString: 'a' }, expected: 10 },
    { description: 'hexadecimal f is decimal 15', input: { hexString: 'f' }, expected: 15 },
    { description: 'hexadecimal 10 is decimal 16', input: { hexString: '10' }, expected: 16 },
    { description: 'hexadecimal ff is decimal 255', input: { hexString: 'ff' }, expected: 255 },
    { description: 'hexadecimal ABC is decimal 2748', input: { hexString: 'ABC' }, expected: 2748 },
    { description: 'invalid hexadecimal is 0', input: { hexString: 'xyz' }, expected: 0 },
    { description: 'empty string is 0', input: { hexString: '' }, expected: 0 }
  ],
  'octal': [
    { description: 'octal 1 is decimal 1', input: { octalString: '1' }, expected: 1 },
    { description: 'octal 7 is decimal 7', input: { octalString: '7' }, expected: 7 },
    { description: 'octal 10 is decimal 8', input: { octalString: '10' }, expected: 8 },
    { description: 'octal 17 is decimal 15', input: { octalString: '17' }, expected: 15 },
    { description: 'octal 77 is decimal 63', input: { octalString: '77' }, expected: 63 },
    { description: 'octal 100 is decimal 64', input: { octalString: '100' }, expected: 64 },
    { description: 'invalid octal is 0', input: { octalString: '89' }, expected: 0 },
    { description: 'empty string is 0', input: { octalString: '' }, expected: 0 }
  ],
  'robot-name': [
    { description: 'robot name has correct format', input: { name: 'AB123' }, expected: true },
    { description: 'robot name is 5 characters', input: { name: 'AB123' }, expected: 5 },
    { description: 'robot name starts with letters', input: { name: 'AB123' }, expected: 'AB' }
  ],
  'simple-linked-list': [
    { description: 'empty list size is zero', input: { values: [] }, expected: 0 },
    { description: 'single element list size', input: { values: [1] }, expected: 1 },
    { description: 'list with multiple elements', input: { values: [1, 2, 3] }, expected: 3 },
    { description: 'reversed list', input: { values: [1, 2, 3], reverse: true }, expected: [3, 2, 1] },
    { description: 'head of list', input: { values: [1, 2, 3], head: true }, expected: 1 },
    { description: 'list to array', input: { values: [1, 2, 3], toArray: true }, expected: [1, 2, 3] }
  ],
  'point-mutations': [
    { description: 'no difference between identical strands', input: { strand1: 'GGACTGA', strand2: 'GGACTGA' }, expected: 0 },
    { description: 'single character difference', input: { strand1: 'GGACTGA', strand2: 'GGACTAA' }, expected: 1 },
    { description: 'multiple differences', input: { strand1: 'GGACG', strand2: 'GGTCG' }, expected: 1 },
    { description: 'completely different strands', input: { strand1: 'AAA', strand2: 'TTT' }, expected: 3 },
    { description: 'empty strands', input: { strand1: '', strand2: '' }, expected: 0 }
  ],
  'promises': [
    { description: 'resolved promise value', input: { value: 42 }, expected: 42 },
    { description: 'chained promise sum', input: { values: [1, 2, 3] }, expected: 6 },
    { description: 'Promise.all result', input: { values: [1, 2, 3] }, expected: [1, 2, 3] },
    { description: 'async function result', input: { value: 'hello' }, expected: 'hello' },
    { description: 'Promise.race first', input: { values: [1, 2, 3] }, expected: 1 }
  ],
  'lens-person': [
    { description: 'get name from person', input: { person: { name: 'John' } }, expected: 'John' },
    { description: 'update name', input: { person: { name: 'John' }, newName: 'Jane' }, expected: 'Jane' },
    { description: 'get nested city', input: { person: { address: { city: 'NYC' } } }, expected: 'NYC' },
    { description: 'update nested city', input: { person: { address: { city: 'NYC' } }, newCity: 'LA' }, expected: 'LA' }
  ],
  'dot-dsl': [
    { description: 'empty graph node count', input: {}, expected: 0 },
    { description: 'graph with one node', input: { nodes: ['a'] }, expected: 1 },
    { description: 'graph with two nodes', input: { nodes: ['a', 'b'] }, expected: 2 },
    { description: 'graph edge count', input: { nodes: ['a', 'b'], edges: [['a', 'b']] }, expected: 1 }
  ],
  'error-handling': [
    { description: 'catch returns message', input: { error: 'test' }, expected: 'caught: test' },
    { description: 'finally flag is set', input: { runFinally: true }, expected: true },
    { description: 'custom error message', input: { message: 'custom' }, expected: 'custom' },
    { description: 'error type check', input: { errorType: 'TypeError' }, expected: 'TypeError' }
  ],
  'hangman': [
    { description: 'initial masked word', input: { word: 'hello' }, expected: '_____' },
    { description: 'reveal correct letter', input: { word: 'hello', guess: 'e' }, expected: '_e___' },
    { description: 'reveal all letters', input: { word: 'hi', guesses: ['h', 'i'] }, expected: 'hi' },
    { description: 'wrong guess count', input: { word: 'hello', wrongGuesses: ['x', 'y'] }, expected: 2 },
    { description: 'game won check', input: { word: 'hi', guesses: ['h', 'i'] }, expected: true }
  ],
  'paasio': [
    { description: 'read byte count', input: { data: 'hello' }, expected: 5 },
    { description: 'write byte count', input: { data: 'world' }, expected: 5 },
    { description: 'total read bytes', input: { reads: ['a', 'bb', 'ccc'] }, expected: 6 },
    { description: 'total written bytes', input: { writes: ['a', 'bb'] }, expected: 3 }
  ],
  'resistor-color-expert': [
    { description: 'black band value', input: { color: 'black' }, expected: 0 },
    { description: 'blue grey bands', input: { colors: ['blue', 'grey'] }, expected: 68 },
    { description: 'three band resistor', input: { colors: ['red', 'red', 'red'] }, expected: 2200 },
    { description: 'four band resistor', input: { colors: ['yellow', 'violet', 'brown'] }, expected: 470 },
    { description: 'five band resistor', input: { colors: ['blue', 'grey', 'white', 'brown'] }, expected: 6890 }
  ],
  'tree-building': [
    { description: 'empty records', input: { records: [] }, expected: null },
    { description: 'root node only', input: { records: [{ id: 0, parentId: 0 }] }, expected: 0 },
    { description: 'root with one child', input: { records: [{ id: 0, parentId: 0 }, { id: 1, parentId: 0 }] }, expected: 1 },
    { description: 'root with two children', input: { records: [{ id: 0, parentId: 0 }, { id: 1, parentId: 0 }, { id: 2, parentId: 0 }] }, expected: 2 }
  ],
  'mazy-mice': [
    { description: 'maze width', input: { width: 5, height: 5 }, expected: 5 },
    { description: 'maze height', input: { width: 5, height: 7 }, expected: 7 },
    { description: 'maze is rectangular', input: { width: 3, height: 4 }, expected: true }
  ],
  'rate-limiter': [
    { description: 'first request allowed', input: { requests: 1, limit: 10 }, expected: true },
    { description: 'under limit allowed', input: { requests: 5, limit: 10 }, expected: true },
    { description: 'at limit allowed', input: { requests: 10, limit: 10 }, expected: true },
    { description: 'over limit blocked', input: { requests: 11, limit: 10 }, expected: false }
  ]
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function getFallbackTests(exerciseSlug) {
  const tests = FALLBACK_TESTS[exerciseSlug]
  if (!tests) return null
  
  return tests.map((test, idx) => ({
    uuid: generateUuid(),
    description: test.description,
    property: exerciseSlug.replace(/-/g, ''),
    input: test.input,
    expected: test.expected
  }))
}

export async function generateFallbackTests(options = {}) {
  const { onProgress = console.log } = options
  
  const wasConnected = mongoose.connection.readyState === 1
  
  if (!wasConnected) {
    await mongoose.connect(process.env.MONGODB_URI)
  }
  
  const Challenge = getModel()
  
  const missing = await Challenge.find({
    $or: [
      { testCases: { $exists: false } },
      { testCases: { $size: 0 } }
    ]
  }).lean()
  
  onProgress(`Found ${missing.length} challenges without tests`)
  
  const stats = {
    total: missing.length,
    updated: 0,
    noFallback: 0,
    noFallbackList: []
  }
  
  for (const challenge of missing) {
    const tests = getFallbackTests(challenge.exerciseSlug)
    
    if (tests) {
      await Challenge.updateOne(
        { _id: challenge._id },
        {
          $set: {
            testCases: tests,
            canonicalTests: tests,
            'canonicalTestsMeta.status': 'fallback',
            'canonicalTestsMeta.fetchedAt': new Date(),
            'canonicalTestsMeta.testCount': tests.length
          }
        }
      )
      stats.updated++
      onProgress(`  ✓ ${challenge.exerciseSlug} (${challenge.language}): ${tests.length} fallback tests`)
    } else {
      stats.noFallback++
      if (!stats.noFallbackList.includes(challenge.exerciseSlug)) {
        stats.noFallbackList.push(challenge.exerciseSlug)
      }
      onProgress(`  ✗ ${challenge.exerciseSlug} (${challenge.language}): no fallback available`)
    }
  }
  
  onProgress('\n' + '='.repeat(50))
  onProgress('FALLBACK GENERATION COMPLETE')
  onProgress('='.repeat(50))
  onProgress(`Total missing: ${stats.total}`)
  onProgress(`Updated with fallbacks: ${stats.updated}`)
  onProgress(`No fallback available: ${stats.noFallback}`)
  
  if (stats.noFallbackList.length > 0) {
    onProgress('\nExercises still needing tests:')
    stats.noFallbackList.forEach(s => onProgress(`  - ${s}`))
  }
  
  if (!wasConnected) {
    await mongoose.disconnect()
  }
  
  return stats
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateFallbackTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fallback generation failed:', err)
      process.exit(1)
    })
}

export { FALLBACK_TESTS, getFallbackTests }
