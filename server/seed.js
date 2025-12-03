import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Challenge from './models/Challenge.js'

dotenv.config()

const challenges = [
  {
    title: 'Hello World',
    slug: 'hello-world-js',
    description: 'Create a program that prints "Hello, World!" to the console.',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: '// Write your code here\n',
    competencyIndex: 0,
    testCases: [{ input: null, expected: 'Hello, World!', description: 'Should print Hello, World!' }]
  },
  {
    title: 'Add Two Numbers',
    slug: 'add-two-numbers-js',
    description: 'Create a function that adds two numbers and returns the result.',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: 'function add(a, b) {\n  // Write your code here\n}\n\nconsole.log(add(5, 3));',
    competencyIndex: 0,
    testCases: [{ input: { a: 5, b: 3 }, expected: 8, description: 'Should return 8' }]
  },
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz-js',
    description: 'Print numbers 1-15. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for both print "FizzBuzz".',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: '// Print FizzBuzz from 1 to 15\nfor (let i = 1; i <= 15; i++) {\n  // Write your code here\n}',
    competencyIndex: 1,
    testCases: []
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-js',
    description: 'Create a function that reverses a string.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: 'function reverseString(str) {\n  // Write your code here\n}\n\nconsole.log(reverseString("hello"));',
    competencyIndex: 2,
    testCases: [{ input: 'hello', expected: 'olleh', description: 'Should return olleh' }]
  },
  {
    title: 'Palindrome Check',
    slug: 'palindrome-js',
    description: 'Create a function that checks if a string is a palindrome.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: 'function isPalindrome(str) {\n  // Write your code here\n}\n\nconsole.log(isPalindrome("racecar"));',
    competencyIndex: 2,
    testCases: [{ input: 'racecar', expected: true, description: 'Should return true' }]
  },
  {
    title: 'Find Maximum',
    slug: 'find-max-js',
    description: 'Create a function that finds the maximum value in an array.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: 'function findMax(arr) {\n  // Write your code here\n}\n\nconsole.log(findMax([1, 5, 3, 9, 2]));',
    competencyIndex: 3,
    testCases: [{ input: [1, 5, 3, 9, 2], expected: 9, description: 'Should return 9' }]
  },
  {
    title: 'Hello World',
    slug: 'hello-world-py',
    description: 'Create a program that prints "Hello, World!" to the console.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: '# Write your code here\n',
    competencyIndex: 0,
    testCases: [{ input: null, expected: 'Hello, World!', description: 'Should print Hello, World!' }]
  },
  {
    title: 'Add Two Numbers',
    slug: 'add-two-numbers-py',
    description: 'Create a function that adds two numbers and returns the result.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: 'def add(a, b):\n    # Write your code here\n    pass\n\nprint(add(5, 3))',
    competencyIndex: 0,
    testCases: [{ input: { a: 5, b: 3 }, expected: 8, description: 'Should return 8' }]
  },
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz-py',
    description: 'Print numbers 1-15. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for both print "FizzBuzz".',
    language: 'python',
    difficulty: 'beginner',
    starterCode: '# Print FizzBuzz from 1 to 15\nfor i in range(1, 16):\n    # Write your code here\n    pass',
    competencyIndex: 1,
    testCases: []
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-py',
    description: 'Create a function that reverses a string.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: 'def reverse_string(s):\n    # Write your code here\n    pass\n\nprint(reverse_string("hello"))',
    competencyIndex: 2,
    testCases: [{ input: 'hello', expected: 'olleh', description: 'Should return olleh' }]
  },
  {
    title: 'List Sum',
    slug: 'list-sum-py',
    description: 'Create a function that returns the sum of all numbers in a list.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: 'def list_sum(numbers):\n    # Write your code here\n    pass\n\nprint(list_sum([1, 2, 3, 4, 5]))',
    competencyIndex: 3,
    testCases: [{ input: [1, 2, 3, 4, 5], expected: 15, description: 'Should return 15' }]
  },
  {
    title: 'Hello World',
    slug: 'hello-world-java',
    description: 'Create a program that prints "Hello, World!" to the console.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}',
    competencyIndex: 0,
    testCases: [{ input: null, expected: 'Hello, World!', description: 'Should print Hello, World!' }]
  },
  {
    title: 'Add Two Numbers',
    slug: 'add-two-numbers-java',
    description: 'Create a method that adds two numbers and returns the result.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: 'public class Main {\n    public static int add(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(add(5, 3));\n    }\n}',
    competencyIndex: 0,
    testCases: [{ input: { a: 5, b: 3 }, expected: 8, description: 'Should return 8' }]
  },
  {
    title: 'FizzBuzz',
    slug: 'fizzbuzz-java',
    description: 'Print numbers 1-15. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for both print "FizzBuzz".',
    language: 'java',
    difficulty: 'beginner',
    starterCode: 'public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 15; i++) {\n            // Write your code here\n        }\n    }\n}',
    competencyIndex: 1,
    testCases: []
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-java',
    description: 'Create a method that reverses a string.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: 'public class Main {\n    public static String reverseString(String s) {\n        // Write your code here\n        return "";\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(reverseString("hello"));\n    }\n}',
    competencyIndex: 2,
    testCases: [{ input: 'hello', expected: 'olleh', description: 'Should return olleh' }]
  }
]

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'
  
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    await Challenge.deleteMany({})
    console.log('Cleared existing challenges')

    await Challenge.insertMany(challenges)
    console.log(`Seeded ${challenges.length} challenges`)

    await mongoose.disconnect()
    console.log('Done!')
    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seed()
