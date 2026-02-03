import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Challenge from '../models/Challenge.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'

const REMOVALS = [
  'raindrops-py',
  'error-handling-py'
]

const CHALLENGES = [
  {
    title: 'Bank Account',
    slug: 'bank-account-py',
    exerciseSlug: 'bank-account',
    description: 'Implement a simple bank account with open/close and deposit/withdraw operations.\n\nRequirements:\n- Create class `BankAccount`.\n- Methods: `open()`, `close()`, `deposit(amount)`, `withdraw(amount)`, `get_balance()`.\n- Raise `ValueError` for invalid operations (closed account, negative amounts, insufficient funds).',
    language: 'python',
    difficulty: 'advanced',
    starterCode: `class BankAccount:
    def __init__(self):
        self._balance = 0
        self._open = False

    def open(self):
        # Open the account
        pass

    def close(self):
        # Close the account
        pass

    def deposit(self, amount):
        # Add amount to balance
        pass

    def withdraw(self, amount):
        # Subtract amount from balance
        pass

    def get_balance(self):
        # Return current balance
        pass`,
    solution: '',
    competencyIndex: 4,
    competencies: [
      'Object-Oriented Programming',
      'Error Handling',
      'Control Structures'
    ],
    testCases: []
  },
  {
    title: 'Robot Name',
    slug: 'robot-name-py',
    exerciseSlug: 'robot-name',
    description: 'Create a robot with a unique name.\n\nA robot name is two uppercase letters followed by three digits (e.g., "RX837").\nThe name must be generated on first access and should stay the same until reset.\n\nRequirements:\n- Create class `Robot`.\n- Provide a `name` attribute.\n- Implement `reset()` to assign a new unique name.',
    language: 'python',
    difficulty: 'advanced',
    starterCode: `import random
import string

class Robot:
    def __init__(self):
        self.reset()

    def reset(self):
        # Assign a new name like "RX837"
        pass`,
    solution: '',
    competencyIndex: 4,
    competencies: [
      'Object-Oriented Programming',
      'Control Structures',
      'Functions'
    ],
    testCases: []
  },
  {
    title: 'ISBN Verifier',
    slug: 'isbn-verifier-py',
    exerciseSlug: 'isbn-verifier',
    description: 'Verify if a string is a valid ISBN-10.\n\nAn ISBN-10 is valid if the weighted sum of its digits is divisible by 11.\nThe final digit can be "X" which represents 10.\nHyphens may appear and should be ignored.\n\nExamples:\nis_valid("3-598-21508-8") → True\nis_valid("3-598-21508-9") → False\n\nRequirements:\n- Implement function `is_valid(isbn)`.\n- Return True/False; do not print directly.',
    language: 'python',
    difficulty: 'advanced',
    starterCode: `def is_valid(isbn):
    # Return True if ISBN-10 is valid
    pass

# Test your solution
print(is_valid("3-598-21508-8"))`,
    solution: 'True',
    competencyIndex: 5,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions',
      'Error Handling'
    ],
    testCases: [
      { input: '3-598-21508-8', expected: true, description: 'Valid ISBN' },
      { input: '3-598-21508-9', expected: false, description: 'Invalid ISBN' }
    ]
  }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const slug of REMOVALS) {
      const removed = await Challenge.deleteOne({ slug, language: 'python' })
      if (removed.deletedCount > 0) {
        console.log(`Removed: ${slug}`)
      }
    }

    for (const challenge of CHALLENGES) {
      const result = await Challenge.updateOne(
        { slug: challenge.slug, language: 'python' },
        { $set: challenge },
        { upsert: true }
      )

      if (result.upsertedCount > 0) {
        console.log(`Inserted: ${challenge.slug}`)
      } else if (result.matchedCount > 0) {
        console.log(`Updated: ${challenge.slug}`)
      } else {
        console.log(`Skipped: ${challenge.slug}`)
      }
    }
  } catch (error) {
    console.error('Update failed:', error.message)
    process.exitCode = 1
  } finally {
    try {
      await mongoose.disconnect()
    } catch {}
  }
}

run()
