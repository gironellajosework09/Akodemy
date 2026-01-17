import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Challenge from '../models/Challenge.js'

dotenv.config()

const TEST_CHALLENGES = [
  {
    language: 'javascript',
    difficulty: 'beginner',
    slug: 'hello-world-javascript',
    exerciseSlug: 'hello-world',
    title: 'Hello World',
    description: 'Write a function that returns "Hello, World!".'
  },
  {
    language: 'javascript',
    difficulty: 'intermediate',
    slug: 'leap-javascript',
    exerciseSlug: 'leap',
    title: 'Leap Year',
    description: 'Given a year, determine whether it is a leap year.'
  },
  {
    language: 'javascript',
    difficulty: 'advanced',
    slug: 'binary-search-javascript',
    exerciseSlug: 'binary-search',
    title: 'Binary Search',
    description: 'Implement a binary search algorithm.'
  },
  {
    language: 'python',
    difficulty: 'beginner',
    slug: 'hello-world-python',
    exerciseSlug: 'hello-world',
    title: 'Hello World',
    description: 'Write a function that returns "Hello, World!".'
  },
  {
    language: 'python',
    difficulty: 'intermediate',
    slug: 'leap-python',
    exerciseSlug: 'leap',
    title: 'Leap Year',
    description: 'Given a year, determine whether it is a leap year.'
  },
  {
    language: 'python',
    difficulty: 'advanced',
    slug: 'binary-search-python',
    exerciseSlug: 'binary-search',
    title: 'Binary Search',
    description: 'Implement a binary search algorithm.'
  },
  {
    language: 'java',
    difficulty: 'beginner',
    slug: 'hello-world-java',
    exerciseSlug: 'hello-world',
    title: 'Hello World',
    description: 'Write a function that returns "Hello, World!".'
  },
  {
    language: 'java',
    difficulty: 'intermediate',
    slug: 'leap-java',
    exerciseSlug: 'leap',
    title: 'Leap Year',
    description: 'Given a year, determine whether it is a leap year.'
  },
  {
    language: 'java',
    difficulty: 'advanced',
    slug: 'binary-search-java',
    exerciseSlug: 'binary-search',
    title: 'Binary Search',
    description: 'Implement a binary search algorithm.'
  }
]

const STARTER_CODE = {
  javascript: {
    'hello-world': `export const hello = () => {
  // Return "Hello, World!"
};`,
    'leap': `export const isLeap = (year) => {
  // Return true if leap year, false otherwise
};`,
    'binary-search': `export const find = (array, value) => {
  // Return the index of value in array, or -1 if not found
};`
  },
  python: {
    'hello-world': `def hello():
    # Return "Hello, World!"
    pass`,
    'leap': `def leap_year(year):
    # Return True if leap year, False otherwise
    pass`,
    'binary-search': `def find(search_list, value):
    # Return the index of value in search_list, or raise ValueError if not found
    pass`
  },
  java: {
    'hello-world': `public class Greeter {
    public String getGreeting() {
        // Return "Hello, World!"
        return "";
    }
}`,
    'leap': `public class Leap {
    public boolean isLeapYear(int year) {
        // Return true if leap year, false otherwise
        return false;
    }
}`,
    'binary-search': `import java.util.List;

public class BinarySearch {
    public int find(List<Integer> array, int target) {
        // Return the index of target in array, or -1 if not found
        return -1;
    }
}`
  }
}

async function setupTestChallenges() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'
  
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    console.log('Removing all existing challenges...')
    await Challenge.deleteMany({})
    console.log('All challenges removed')

    console.log('Creating 9 test challenges (1 per difficulty per language)...')
    
    for (const challenge of TEST_CHALLENGES) {
      const starterCode = STARTER_CODE[challenge.language]?.[challenge.exerciseSlug] || ''
      
      const newChallenge = await Challenge.create({
        title: challenge.title,
        slug: challenge.slug,
        description: challenge.description,
        language: challenge.language,
        difficulty: challenge.difficulty,
        starterCode,
        exerciseSlug: challenge.exerciseSlug,
        competencyIndex: 0,
        testCases: [],
        canonicalTests: [],
        officialTests: []
      })
      
      console.log(`Created: ${challenge.title} (${challenge.language} - ${challenge.difficulty})`)
    }

    console.log('\n=== Test Challenges Setup Complete ===')
    console.log('Total challenges created: 9')
    console.log('- JavaScript: 3 (beginner, intermediate, advanced)')
    console.log('- Python: 3 (beginner, intermediate, advanced)')
    console.log('- Java: 3 (beginner, intermediate, advanced)')
    console.log('\nNote: Run fullTestSync.js to populate test cases for these challenges')

  } catch (error) {
    console.error('Error setting up test challenges:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

setupTestChallenges()
