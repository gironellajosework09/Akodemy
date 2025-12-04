const axios = require('axios')

const GITHUB_API = 'https://api.github.com'
const EXERCISM_ORG = 'exercism'

const TRACK_MAPPING = {
  javascript: 'javascript',
  python: 'python',
  java: 'java'
}

const DIFFICULTY_ORDER = {
  beginner: ['hello-world', 'two-fer', 'resistor-color', 'leap', 'reverse-string'],
  intermediate: ['isogram', 'hamming', 'rna-transcription', 'pangram', 'bob'],
  advanced: ['anagram', 'nucleotide-count', 'word-count', 'phone-number', 'series']
}

async function fetchExerciseList(track) {
  try {
    const url = `${GITHUB_API}/repos/${EXERCISM_ORG}/${track}/contents/exercises/practice`
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Akodemy-App'
      }
    })
    return response.data.filter(item => item.type === 'dir').map(item => item.name)
  } catch (error) {
    console.error(`Failed to fetch exercise list for ${track}:`, error.message)
    return []
  }
}

async function fetchExerciseDetails(track, exerciseName) {
  try {
    const configUrl = `https://raw.githubusercontent.com/${EXERCISM_ORG}/${track}/main/exercises/practice/${exerciseName}/.meta/config.json`
    const configResponse = await axios.get(configUrl)
    const config = configResponse.data

    let instructions = ''
    try {
      const instructionsUrl = `https://raw.githubusercontent.com/${EXERCISM_ORG}/${track}/main/exercises/practice/${exerciseName}/.docs/instructions.md`
      const instructionsResponse = await axios.get(instructionsUrl)
      instructions = instructionsResponse.data
    } catch (e) {
      instructions = config.blurb || `Complete the ${exerciseName} challenge`
    }

    let testCases = []
    try {
      const testDataUrl = `https://raw.githubusercontent.com/${EXERCISM_ORG}/problem-specifications/main/exercises/${exerciseName}/canonical-data.json`
      const testDataResponse = await axios.get(testDataUrl)
      const canonicalData = testDataResponse.data
      
      if (canonicalData.cases) {
        testCases = extractTestCases(canonicalData.cases)
      }
    } catch (e) {
      console.log(`No canonical data for ${exerciseName}`)
    }

    return {
      title: formatTitle(exerciseName),
      slug: exerciseName,
      description: instructions,
      blurb: config.blurb || '',
      difficulty: config.difficulty || 1,
      testCases
    }
  } catch (error) {
    console.error(`Failed to fetch details for ${exerciseName}:`, error.message)
    return null
  }
}

function extractTestCases(cases, results = []) {
  for (const testCase of cases) {
    if (testCase.cases) {
      extractTestCases(testCase.cases, results)
    } else if (testCase.input !== undefined && testCase.expected !== undefined) {
      results.push({
        description: testCase.description || '',
        input: testCase.input,
        expected: testCase.expected
      })
    }
  }
  return results.slice(0, 5)
}

function formatTitle(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getDifficultyFromLevel(level) {
  if (level <= 3) return 'beginner'
  if (level <= 6) return 'intermediate'
  return 'advanced'
}

async function fetchChallengesForTrack(track) {
  const challenges = []
  const trackName = TRACK_MAPPING[track] || track

  for (const [difficulty, exercises] of Object.entries(DIFFICULTY_ORDER)) {
    for (const exerciseName of exercises) {
      const details = await fetchExerciseDetails(trackName, exerciseName)
      if (details) {
        challenges.push({
          ...details,
          language: track,
          difficulty,
          difficultyOrder: difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3
        })
      }
    }
  }

  return challenges
}

function getStarterCode(language, exerciseSlug) {
  const templates = {
    javascript: {
      'hello-world': `export function hello() {\n  // Return a greeting\n}`,
      'two-fer': `export function twoFer(name) {\n  // Return "One for [name], one for me."\n}`,
      'resistor-color': `export const colorCode = (color) => {\n  // Return the color code\n};\n\nexport const COLORS = [];`,
      'leap': `export function isLeap(year) {\n  // Return true if leap year\n}`,
      'reverse-string': `export function reverseString(str) {\n  // Return the reversed string\n}`,
      'isogram': `export function isIsogram(word) {\n  // Return true if isogram\n}`,
      'hamming': `export function compute(strand1, strand2) {\n  // Return the hamming distance\n}`,
      'rna-transcription': `export function toRna(dna) {\n  // Transcribe DNA to RNA\n}`,
      'pangram': `export function isPangram(sentence) {\n  // Return true if pangram\n}`,
      'bob': `export function hey(message) {\n  // Return Bob's response\n}`,
      'anagram': `export function findAnagrams(word, candidates) {\n  // Return matching anagrams\n}`,
      'nucleotide-count': `export function countNucleotides(strand) {\n  // Count each nucleotide\n}`,
      'word-count': `export function countWords(phrase) {\n  // Count word occurrences\n}`,
      'phone-number': `export function clean(number) {\n  // Clean and validate phone number\n}`,
      'series': `export function slices(series, sliceLength) {\n  // Return all slices of given length\n}`
    },
    python: {
      'hello-world': `def hello():\n    # Return a greeting\n    pass`,
      'two-fer': `def two_fer(name="you"):\n    # Return "One for [name], one for me."\n    pass`,
      'resistor-color': `def color_code(color):\n    # Return the color code\n    pass\n\ndef colors():\n    # Return list of colors\n    pass`,
      'leap': `def leap_year(year):\n    # Return True if leap year\n    pass`,
      'reverse-string': `def reverse(text):\n    # Return the reversed string\n    pass`,
      'isogram': `def is_isogram(string):\n    # Return True if isogram\n    pass`,
      'hamming': `def distance(strand_a, strand_b):\n    # Return the hamming distance\n    pass`,
      'rna-transcription': `def to_rna(dna_strand):\n    # Transcribe DNA to RNA\n    pass`,
      'pangram': `def is_pangram(sentence):\n    # Return True if pangram\n    pass`,
      'bob': `def response(hey_bob):\n    # Return Bob's response\n    pass`,
      'anagram': `def find_anagrams(word, candidates):\n    # Return matching anagrams\n    pass`,
      'nucleotide-count': `def count(strand):\n    # Count each nucleotide\n    pass`,
      'word-count': `def count_words(sentence):\n    # Count word occurrences\n    pass`,
      'phone-number': `class PhoneNumber:\n    def __init__(self, number):\n        # Parse and validate number\n        pass`,
      'series': `def slices(series, length):\n    # Return all slices of given length\n    pass`
    },
    java: {
      'hello-world': `public class Greeter {\n    public String getGreeting() {\n        // Return a greeting\n        return null;\n    }\n}`,
      'two-fer': `public class TwoFer {\n    public String twoFer(String name) {\n        // Return "One for [name], one for me."\n        return null;\n    }\n}`,
      'resistor-color': `public class ResistorColor {\n    public int colorCode(String color) {\n        // Return the color code\n        return 0;\n    }\n}`,
      'leap': `public class Leap {\n    public boolean isLeapYear(int year) {\n        // Return true if leap year\n        return false;\n    }\n}`,
      'reverse-string': `public class ReverseString {\n    public String reverse(String text) {\n        // Return the reversed string\n        return null;\n    }\n}`,
      'isogram': `public class IsogramChecker {\n    public boolean isIsogram(String phrase) {\n        // Return true if isogram\n        return false;\n    }\n}`,
      'hamming': `public class Hamming {\n    public int getHammingDistance(String strand1, String strand2) {\n        // Return the hamming distance\n        return 0;\n    }\n}`,
      'rna-transcription': `public class RnaTranscription {\n    public String transcribe(String dnaStrand) {\n        // Transcribe DNA to RNA\n        return null;\n    }\n}`,
      'pangram': `public class PangramChecker {\n    public boolean isPangram(String sentence) {\n        // Return true if pangram\n        return false;\n    }\n}`,
      'bob': `public class Bob {\n    public String hey(String input) {\n        // Return Bob's response\n        return null;\n    }\n}`,
      'anagram': `import java.util.List;\n\npublic class Anagram {\n    public List<String> match(List<String> candidates) {\n        // Return matching anagrams\n        return null;\n    }\n}`,
      'nucleotide-count': `import java.util.Map;\n\npublic class NucleotideCounter {\n    public Map<Character, Integer> nucleotideCounts(String strand) {\n        // Count each nucleotide\n        return null;\n    }\n}`,
      'word-count': `import java.util.Map;\n\npublic class WordCount {\n    public Map<String, Integer> phrase(String input) {\n        // Count word occurrences\n        return null;\n    }\n}`,
      'phone-number': `public class PhoneNumber {\n    public String getNumber() {\n        // Return cleaned phone number\n        return null;\n    }\n}`,
      'series': `import java.util.List;\n\npublic class Series {\n    public List<String> slices(int num) {\n        // Return all slices of given length\n        return null;\n    }\n}`
    }
  }

  return templates[language]?.[exerciseSlug] || getDefaultCode(language)
}

function getDefaultCode(language) {
  switch (language) {
    case 'javascript':
      return '// Write your solution here\n'
    case 'python':
      return '# Write your solution here\n'
    case 'java':
      return '// Write your solution here\npublic class Solution {\n    \n}'
    default:
      return ''
  }
}

module.exports = {
  fetchChallengesForTrack,
  fetchExerciseDetails,
  getStarterCode,
  DIFFICULTY_ORDER
}
