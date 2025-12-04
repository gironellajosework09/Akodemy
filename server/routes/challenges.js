import express from 'express'
import axios from 'axios'
import Challenge from '../models/Challenge.js'
import Submission from '../models/Submission.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

const DIFFICULTY_ORDER = { beginner: 1, intermediate: 2, advanced: 3 }

const EXERCISM_EXERCISES = {
  beginner: ['hello-world', 'two-fer', 'leap', 'reverse-string', 'resistor-color'],
  intermediate: ['hamming', 'rna-transcription', 'isogram', 'pangram', 'bob'],
  advanced: ['anagram', 'word-count', 'nucleotide-count', 'phone-number', 'series']
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { language, difficulty } = req.query
    const query = {}
    
    if (language) query.language = language
    if (difficulty) query.difficulty = difficulty

    const challenges = await Challenge.find(query)

    const challengesWithProgress = await Promise.all(
      challenges.map(async (challenge) => {
        const submission = await Submission.findOne({
          userId: req.user._id,
          challengeId: challenge._id
        }).sort({ createdAt: -1 })

        return {
          ...challenge.toObject(),
          userProgress: submission ? {
            bestTime: formatTime(submission.time || 0),
            runs: submission.runCount || 0,
            completed: submission.completed
          } : null,
          difficultyOrder: DIFFICULTY_ORDER[challenge.difficulty] || 4
        }
      })
    )

    challengesWithProgress.sort((a, b) => {
      if (a.difficultyOrder !== b.difficultyOrder) {
        return a.difficultyOrder - b.difficultyOrder
      }
      return a.title.localeCompare(b.title)
    })

    res.json(challengesWithProgress)
  } catch (error) {
    console.error('Fetch challenges error:', error)
    res.status(500).json({ message: 'Failed to fetch challenges' })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' })
    }
    res.json(challenge)
  } catch (error) {
    console.error('Fetch challenge error:', error)
    res.status(500).json({ message: 'Failed to fetch challenge' })
  }
})

router.post('/sync-exercism', authenticateToken, async (req, res) => {
  try {
    const languages = ['javascript', 'python', 'java']
    const syncedChallenges = []

    for (const language of languages) {
      for (const [difficulty, exercises] of Object.entries(EXERCISM_EXERCISES)) {
        for (const exerciseSlug of exercises) {
          try {
            const exerciseData = await fetchExercismExercise(language, exerciseSlug)
            if (exerciseData) {
              const existing = await Challenge.findOne({ 
                slug: `${exerciseSlug}-${language}`,
                language 
              })

              if (!existing) {
                const challenge = new Challenge({
                  title: exerciseData.title,
                  slug: `${exerciseSlug}-${language}`,
                  description: exerciseData.description,
                  language,
                  difficulty,
                  starterCode: exerciseData.starterCode,
                  solution: exerciseData.solution || '',
                  testCases: exerciseData.testCases || [],
                  source: 'exercism',
                  competencyIndex: getCompetencyIndex(difficulty, exercises.indexOf(exerciseSlug))
                })
                await challenge.save()
                syncedChallenges.push(challenge.title)
              }
            }
          } catch (err) {
            console.log(`Skipping ${exerciseSlug} for ${language}: ${err.message}`)
          }
        }
      }
    }

    res.json({ 
      message: `Synced ${syncedChallenges.length} new challenges from Exercism`,
      challenges: syncedChallenges
    })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ message: 'Failed to sync challenges' })
  }
})

async function fetchExercismExercise(language, slug) {
  const trackMap = { javascript: 'javascript', python: 'python', java: 'java' }
  const track = trackMap[language]
  
  try {
    const instructionsUrl = `https://raw.githubusercontent.com/exercism/${track}/main/exercises/practice/${slug}/.docs/instructions.md`
    const instructionsRes = await axios.get(instructionsUrl)
    const description = instructionsRes.data

    let testCases = []
    try {
      const canonicalUrl = `https://raw.githubusercontent.com/exercism/problem-specifications/main/exercises/${slug}/canonical-data.json`
      const canonicalRes = await axios.get(canonicalUrl)
      testCases = extractTestCases(canonicalRes.data.cases || [])
    } catch (e) {
      console.log(`No canonical data for ${slug}`)
    }

    const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const starterCode = getStarterCode(language, slug)
    const solution = getExpectedOutput(slug)

    return { title, description, starterCode, solution, testCases }
  } catch (error) {
    throw new Error(`Failed to fetch ${slug}: ${error.message}`)
  }
}

function extractTestCases(cases, results = []) {
  for (const tc of cases) {
    if (tc.cases) {
      extractTestCases(tc.cases, results)
    } else if (tc.input !== undefined && tc.expected !== undefined) {
      results.push({
        description: tc.description || '',
        input: JSON.stringify(tc.input),
        expected: JSON.stringify(tc.expected)
      })
    }
  }
  return results.slice(0, 5)
}

function getCompetencyIndex(difficulty, index) {
  const base = { beginner: 0, intermediate: 2, advanced: 4 }
  return (base[difficulty] || 0) + Math.min(index, 1)
}

function getStarterCode(language, slug) {
  const templates = {
    javascript: {
      'hello-world': `function hello() {\n  // Return "Hello, World!"\n}\n\nconsole.log(hello());`,
      'two-fer': `function twoFer(name) {\n  // Return "One for [name], one for me."\n}\n\nconsole.log(twoFer("Alice"));`,
      'leap': `function isLeap(year) {\n  // Return true if leap year\n}\n\nconsole.log(isLeap(2024));`,
      'reverse-string': `function reverseString(str) {\n  // Return reversed string\n}\n\nconsole.log(reverseString("hello"));`,
      'resistor-color': `function colorCode(color) {\n  // Return color code number\n}\n\nconsole.log(colorCode("brown"));`
    },
    python: {
      'hello-world': `def hello():\n    # Return "Hello, World!"\n    pass\n\nprint(hello())`,
      'two-fer': `def two_fer(name="you"):\n    # Return "One for [name], one for me."\n    pass\n\nprint(two_fer("Alice"))`,
      'leap': `def leap_year(year):\n    # Return True if leap year\n    pass\n\nprint(leap_year(2024))`,
      'reverse-string': `def reverse(text):\n    # Return reversed string\n    pass\n\nprint(reverse("hello"))`,
      'resistor-color': `def color_code(color):\n    # Return color code number\n    pass\n\nprint(color_code("brown"))`
    },
    java: {
      'hello-world': `public class Main {\n    public static String hello() {\n        // Return "Hello, World!"\n        return null;\n    }\n    public static void main(String[] args) {\n        System.out.println(hello());\n    }\n}`,
      'two-fer': `public class Main {\n    public static String twoFer(String name) {\n        // Return "One for [name], one for me."\n        return null;\n    }\n    public static void main(String[] args) {\n        System.out.println(twoFer("Alice"));\n    }\n}`,
      'leap': `public class Main {\n    public static boolean isLeap(int year) {\n        // Return true if leap year\n        return false;\n    }\n    public static void main(String[] args) {\n        System.out.println(isLeap(2024));\n    }\n}`,
      'reverse-string': `public class Main {\n    public static String reverse(String text) {\n        // Return reversed string\n        return null;\n    }\n    public static void main(String[] args) {\n        System.out.println(reverse("hello"));\n    }\n}`,
      'resistor-color': `public class Main {\n    public static int colorCode(String color) {\n        // Return color code number\n        return 0;\n    }\n    public static void main(String[] args) {\n        System.out.println(colorCode("brown"));\n    }\n}`
    }
  }
  return templates[language]?.[slug] || `// Write your ${language} code here`
}

function getExpectedOutput(slug) {
  const outputs = {
    'hello-world': 'Hello, World!',
    'two-fer': 'One for Alice, one for me.',
    'leap': 'true',
    'reverse-string': 'olleh',
    'resistor-color': '1'
  }
  return outputs[slug] || ''
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default router
