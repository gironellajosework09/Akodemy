import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Challenge from '../models/Challenge.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'

const UPDATES = [
  {
    slug: 'hello-world-js',
    starterCode: `function hello() {
  // Return the greeting "Hello, World!"
  
}

// Test your solution
console.log(hello());`
  },
  {
    slug: 'leap-js',
    starterCode: `function isLeap(year) {
  // Return true if year is a leap year, false otherwise
  
}

// Test your solution
console.log(isLeap(2024));`
  },
  {
    slug: 'resistor-color-js',
    starterCode: `const COLORS = [
  "black", "brown", "red", "orange", "yellow",
  "green", "blue", "violet", "grey", "white"
];

function colorCode(color) {
  // Return the numeric value for the color
  
}

// Test your solution
console.log(colorCode("brown"));`
  },
  {
    slug: 'reverse-string-js',
    starterCode: `function reverseString(str) {
  // Return the reversed string
  
}

// Test your solution
console.log(reverseString("hello"));`
  },
  {
    slug: 'two-fer-js',
    starterCode: `function twoFer(name) {
  // Return "One for [name], one for me."
  // If no name provided, use "you"
  
}

// Test your solution
console.log(twoFer("Alice"));
console.log(twoFer());`
  },
  {
    slug: 'hamming-js',
    starterCode: `function compute(strand1, strand2) {
  // Return the number of differences between strands
  
}

// Test your solution
console.log(compute("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"));`
  },
  {
    slug: 'isogram-js',
    starterCode: `function isIsogram(word) {
  // Return true if word has no repeating letters
  
}

// Test your solution
console.log(isIsogram("lumberjacks"));`
  },
  {
    slug: 'pangram-js',
    starterCode: `function isPangram(sentence) {
  // Return true if sentence contains every letter a-z
  
}

// Test your solution
console.log(isPangram("The quick brown fox jumps over the lazy dog"));`
  },
  {
    slug: 'rna-transcription-js',
    starterCode: `function toRna(dna) {
  // Convert DNA strand to RNA
  
}

// Test your solution
console.log(toRna("GCTA"));`
  },
  {
    slug: 'space-age-js',
    starterCode: `function age(planet, seconds) {
  // Return age in years on the given planet (rounded to 2 decimals)
  
}

// Test your solution
console.log(age("Earth", 1000000000));`
  },
  {
    slug: 'anagram-js',
    starterCode: `function findAnagrams(word, candidates) {
  // Return array of candidates that are anagrams of word
  
}

// Test your solution
console.log(findAnagrams("listen", ["enlist", "google", "silent"]));`
  },
  {
    slug: 'binary-search-js',
    starterCode: `function find(arr, target) {
  // Return index of target in sorted array, or -1
  
}

// Test your solution
console.log(find([1, 3, 5, 8, 13, 21], 8));`
  },
  {
    slug: 'flatten-array-js',
    starterCode: `function flatten(arr) {
  // Return flattened array without null/undefined
  
}

// Test your solution
console.log(flatten([1, [2, 3, null, 4], [[5]], [[[6]]]]));`
  },
  {
    slug: 'roman-numerals-js',
    starterCode: `function toRoman(num) {
  // Convert number to Roman numeral
  
}

// Test your solution
console.log(toRoman(1990));`
  },
  {
    slug: 'rle-js',
    starterCode: `function encode(str) {
  // Return run-length encoded string
  
}

// Test your solution
console.log(encode("WWWWBWWWWBBB"));

function decode(str) {
  // Return run-length decoded string
}`
  },
  {
    slug: 'bank-account-js',
    starterCode: `class ValueError extends Error {}

class BankAccount {
  constructor() {
    this._balance = 0;
    this._open = false;
  }

  open() {
    // Open the account
  }

  close() {
    // Close the account
  }

  deposit(amount) {
    // Deposit amount
  }

  withdraw(amount) {
    // Withdraw amount
  }

  get balance() {
    // Return current balance
    return this._balance;
  }
}

// Test your solution
const account = new BankAccount();
account.open();
account.deposit(100);
console.log(account.balance);`
  },
  {
    slug: 'robot-name-js',
    starterCode: `class Robot {
  constructor() {
    // Assign a unique name
    this._name = "";
  }

  get name() {
    return this._name;
  }

  reset() {
    // Assign a new unique name
  }

  static releaseNames() {
    // Clear stored names
  }
}

// Test your solution
const robot = new Robot();
console.log(robot.name);`
  },
  {
    slug: 'isbn-verifier-js',
    starterCode: `function isValid(isbn) {
  // Return true if ISBN-10 is valid
  return false;
}

// Test your solution
console.log(isValid("3-598-21508-8"));`
  }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'javascript' },
        { $set: { starterCode: update.starterCode } }
      )

      if (result.matchedCount > 0) {
        console.log(`Updated: ${update.slug}`)
      } else {
        console.log(`Skipped (not found): ${update.slug}`)
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
