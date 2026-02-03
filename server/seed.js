// Database seed script for initial content.
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Challenge from './models/Challenge.js'
import { syncExercismTests } from './services/exercismTestsSync.js'
import { syncExercismTemplates } from './services/exercismTemplatesSync.js'

dotenv.config()

const challenges = [
  // JavaScript - Beginner
  {
    title: 'Hello World',
    slug: 'hello-world-js',
    description: 'Write a function that returns the string "Hello, World!".\n\nExample:\nhello() → "Hello, World!"\n\nRequirements:\n- Implement function `hello()`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function hello() {
  // Return the greeting "Hello, World!"
  
}

// Test your solution
console.log(hello());`,
    solution: 'Hello, World!',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Functions'
    ],
    testCases: [
      { input: null, expected: 'Hello, World!', description: 'Should return "Hello, World!"' }
    ]
  },
  {
    title: 'Two Fer',
    slug: 'two-fer-js',
    description: 'Create a sentence of the form "One for X, one for me."\n\nWhere X is the given name. However, if the name is missing, use "you" instead.\n\nExamples:\ntwoFer("Alice") → "One for Alice, one for me."\ntwoFer() → "One for you, one for me."\n\nRequirements:\n- Implement function `twoFer(name)`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function twoFer(name) {
  // Return "One for [name], one for me."
  // If no name provided, use "you"
  
}

// Test your solution
console.log(twoFer("Alice"));
console.log(twoFer());`,
    solution: 'One for Alice, one for me.',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Functions',
      'Control Structures'
    ],
    testCases: [
      { input: 'Alice', expected: 'One for Alice, one for me.', description: 'With name Alice' },
      { input: null, expected: 'One for you, one for me.', description: 'With no name' }
    ]
  },
  {
    title: 'Leap Year',
    slug: 'leap-js',
    description: 'Determine whether a year is a leap year.\n\nA leap year occurs:\n- On every year divisible by 4\n- Except years divisible by 100\n- Unless the year is also divisible by 400\n\nExamples:\nisLeap(2000) → true\nisLeap(1900) → false\nisLeap(2024) → true\n\nRequirements:\n- Implement function `isLeap(year)`.\n- Return true/false; do not print directly.',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function isLeap(year) {
  // Return true if year is a leap year, false otherwise
  
}

// Test your solution
console.log(isLeap(2024));`,
    solution: 'true',
    competencyIndex: 1,
    competencies: [
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: 2000, expected: true, description: 'Year 2000 is a leap year' },
      { input: 1900, expected: false, description: 'Year 1900 is not a leap year' },
      { input: 2024, expected: true, description: 'Year 2024 is a leap year' }
    ]
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-js',
    description: 'Reverse a string.\n\nExamples:\nreverseString("hello") → "olleh"\nreverseString("robot") → "tobor"\n\nRequirements:\n- Implement function `reverseString(str)`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function reverseString(str) {
  // Return the reversed string
  
}

// Test your solution
console.log(reverseString("hello"));`,
    solution: 'olleh',
    competencyIndex: 2,
    competencies: [
      'Functions',
      'Control Structures',
      'Arrays & Collections'
    ],
    testCases: [
      { input: 'hello', expected: 'olleh', description: 'Reverses hello' },
      { input: 'robot', expected: 'tobor', description: 'Reverses robot' }
    ]
  },
  {
    title: 'Resistor Color',
    slug: 'resistor-color-js',
    description: 'Resistors have color coded bands. Return the numeric value of a color.\n\nColors: black=0, brown=1, red=2, orange=3, yellow=4, green=5, blue=6, violet=7, grey=8, white=9\n\nExamples:\ncolorCode("black") → 0\ncolorCode("brown") → 1\n\nRequirements:\n- Implement function `colorCode(color)`.\n- Define constant `COLORS` with the color list in order.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `const COLORS = [
  "black", "brown", "red", "orange", "yellow",
  "green", "blue", "violet", "grey", "white"
];

function colorCode(color) {
  // Return the numeric value for the color
  
}

// Test your solution
console.log(colorCode("brown"));`,
    solution: '1',
    competencyIndex: 3,
    competencies: [
      'Variables & Data Types',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 'black', expected: 0, description: 'Black is 0' },
      { input: 'brown', expected: 1, description: 'Brown is 1' },
      { input: 'red', expected: 2, description: 'Red is 2' }
    ]
  },

  // JavaScript - Intermediate
  {
    title: 'Hamming Distance',
    slug: 'hamming-js',
    description: 'Calculate the Hamming distance between two DNA strands.\n\nThe Hamming distance is the number of positions where the corresponding characters differ.\n\nExamples:\ncompute("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT") → 7\n\nRequirements:\n- Implement function `compute(strand1, strand2)`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function compute(strand1, strand2) {
  // Return the number of differences between strands
  
}

// Test your solution
console.log(compute("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"));`,
    solution: '7',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: ['GAGCCTACTAACGGGAT', 'CATCGTAATGACGGCCT'], expected: 7, description: 'Long strands' },
      { input: ['GGACG', 'GGTCG'], expected: 1, description: 'Short strands' }
    ]
  },
  {
    title: 'Isogram',
    slug: 'isogram-js',
    description: 'Determine if a word is an isogram (no repeating letters).\n\nExamples:\nisIsogram("lumberjacks") → true\nisIsogram("isograms") → false\n\nRequirements:\n- Implement function `isIsogram(word)`.\n- Return true/false; do not print directly.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function isIsogram(word) {
  // Return true if word has no repeating letters
  
}

// Test your solution
console.log(isIsogram("lumberjacks"));`,
    solution: 'true',
    competencyIndex: 2,
    competencies: [
      'Arrays & Collections',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: 'lumberjacks', expected: true, description: 'Is an isogram' },
      { input: 'isograms', expected: false, description: 'Not an isogram (has s twice)' }
    ]
  },
  {
    title: 'Pangram',
    slug: 'pangram-js',
    description: 'Determine if a sentence is a pangram (contains every letter of the alphabet).\n\nExample:\nisPangram("The quick brown fox jumps over the lazy dog") → true\n\nRequirements:\n- Implement function `isPangram(sentence)`.\n- Return true/false; do not print directly.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function isPangram(sentence) {
  // Return true if sentence contains every letter a-z
  
}

// Test your solution
console.log(isPangram("The quick brown fox jumps over the lazy dog"));`,
    solution: 'true',
    competencyIndex: 2,
    testCases: [
      { input: 'The quick brown fox jumps over the lazy dog', expected: true, description: 'Classic pangram' }
    ]
  },
  {
    title: 'RNA Transcription',
    slug: 'rna-transcription-js',
    description: 'Given a DNA strand, return its RNA complement.\n\nDNA to RNA: G→C, C→G, T→A, A→U\n\nExamples:\ntoRna("GCTA") → "CGAU"\n\nRequirements:\n- Implement function `toRna(dna)`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function toRna(dna) {
  // Convert DNA strand to RNA
  
}

// Test your solution
console.log(toRna("GCTA"));`,
    solution: 'CGAU',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 'G', expected: 'C', description: 'G to C' },
      { input: 'GCTA', expected: 'CGAU', description: 'Full strand' }
    ]
  },
  {
    title: 'Space Age',
    slug: 'space-age-js',
    description: 'Calculate how old someone would be on different planets.\n\nEarth year = 365.25 days. Planet orbital periods (Earth years):\nMercury: 0.2408467, Venus: 0.61519726, Mars: 1.8808158, Jupiter: 11.862615\n\nExample:\nage("earth", 1000000000) → 31.69 (seconds to years)\n\nRequirements:\n- Implement function `age(planet, seconds)`.\n- Return the value (rounded to 2 decimals); do not print directly.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function age(planet, seconds) {
  // Return age in years on the given planet (rounded to 2 decimals)
  
}

// Test your solution
console.log(age("Earth", 1000000000));`,
    solution: '31.69',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: [1000000000, 'Earth'], expected: 31.69, description: 'Age on Earth' }
    ]
  },

  // JavaScript - Advanced
  {
    title: 'Anagram Detector',
    slug: 'anagram-js',
    description: 'Given a word and a list of candidates, find all anagrams.\n\nAn anagram uses all original letters exactly once.\n\nExample:\nfindAnagrams("listen", ["enlist", "google", "silent"]) → ["enlist", "silent"]\n\nRequirements:\n- Implement function `findAnagrams(word, candidates)`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function findAnagrams(word, candidates) {
  // Return array of candidates that are anagrams of word
  
}

// Test your solution
console.log(findAnagrams("listen", ["enlist", "google", "silent"]));`,
    solution: '["enlist","silent"]',
    competencyIndex: 3,
    competencies: [
      'Arrays & Collections',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: ['listen', ['enlist', 'google', 'silent']], expected: ['enlist', 'silent'], description: 'Find anagrams' }
    ]
  },
  {
    title: 'Flatten Array',
    slug: 'flatten-array-js',
    description: 'Flatten a nested array and remove null/undefined values.\n\nExample:\nflatten([1, [2, 3, null, 4], [[5]], [[[6]]]]) → [1, 2, 3, 4, 5, 6]\n\nRequirements:\n- Implement function `flatten(arr)`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'advanced',
    starterCode: `function flatten(arr) {
  // Return flattened array without null/undefined
  
}

// Test your solution
console.log(flatten([1, [2, 3, null, 4], [[5]], [[[6]]]]));`,
    solution: '[1,2,3,4,5,6]',
    competencyIndex: 3,
    competencies: [
      'Arrays & Collections',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: [[1, [2, 3, null, 4], [[5]], [[[6]]]]], expected: [1, 2, 3, 4, 5, 6], description: 'Flatten nested arrays' }
    ]
  },
  {
    title: 'Run Length Encoding',
    slug: 'rle-js',
    description: 'Implement run-length encoding and decoding.\n\nConsecutive identical characters are encoded as count + character.\n\nExamples:\nencode("WWWWBWWWWBBB") → "4WB4W3B"\ndecode("4WB4W3B") → "WWWWBWWWWBBB"\n\nRequirements:\n- Implement function `encode(str)`.\n- Implement function `decode(str)`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function encode(str) {
  // Return run-length encoded string
  
}

// Test your solution
console.log(encode("WWWWBWWWWBBB"));

function decode(str) {
  // Return run-length decoded string
}
`,
    solution: '4WB4W3B',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 'WWWWBWWWWBBB', expected: '4WB4W3B', description: 'Encode repeated chars' },
      { input: 'AABCCCDEEEE', expected: '2AB3CD4E', description: 'Mixed encoding' }
    ]
  },
  {
    title: 'Bank Account',
    slug: 'bank-account-js',
    description: 'Implement a simple bank account with open/close and deposit/withdraw operations.\n\nRequirements:\n- Create class `BankAccount`.\n- Methods: `open()`, `close()`, `deposit(amount)`, `withdraw(amount)`.\n- Provide `balance` getter.\n- Throw `ValueError` for invalid operations.',
    language: 'javascript',
    difficulty: 'intermediate',
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
console.log(account.balance);`,
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
    slug: 'robot-name-js',
    description: 'Create a robot with a unique name.\n\nA robot name is two uppercase letters followed by three digits (e.g., "RX837").\nThe name must be generated on first access and should stay the same until reset.\n\nRequirements:\n- Create class `Robot`.\n- Provide a `name` property.\n- Implement `reset()` to assign a new unique name.\n- Implement `static releaseNames()` to clear stored names.',
    language: 'javascript',
    difficulty: 'beginner',
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
console.log(robot.name);`,
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
    slug: 'isbn-verifier-js',
    description: 'Verify if a string is a valid ISBN-10.\n\nAn ISBN-10 is valid if the weighted sum of its digits is divisible by 11.\nThe final digit can be "X" which represents 10.\nHyphens may appear and should be ignored.\n\nExamples:\nisValid("3-598-21508-8") → true\nisValid("3-598-21508-9") → false\n\nRequirements:\n- Implement function `isValid(isbn)`.\n- Return true/false; do not print directly.',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function isValid(isbn) {
  // Return true if ISBN-10 is valid
  return false;
}

// Test your solution
console.log(isValid("3-598-21508-8"));`,
    solution: '',
    competencyIndex: 5,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions',
      'Error Handling'
    ],
    testCases: []
  },
  {
    title: 'Binary Search',
    slug: 'binary-search-js',
    description: 'Implement binary search to find a value in a sorted array.\n\nReturn the index of the value, or -1 if not found.\n\nExample:\nfind([1, 3, 5, 8, 13, 21], 8) → 3\n\nRequirements:\n- Implement function `find(arr, target)`.\n- Return the index or -1; do not print directly.',
    language: 'javascript',
    difficulty: 'advanced',
    starterCode: `function find(arr, target) {
  // Return index of target in sorted array, or -1
  
}

// Test your solution
console.log(find([1, 3, 5, 8, 13, 21], 8));`,
    solution: '3',
    competencyIndex: 3,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: [[1, 3, 5, 8, 13, 21], 8], expected: 3, description: 'Find 8 at index 3' },
      { input: [[1, 3, 5, 8, 13, 21], 21], expected: 5, description: 'Find 21 at index 5' }
    ]
  },
  {
    title: 'Roman Numerals',
    slug: 'roman-numerals-js',
    description: 'Convert a number to a Roman numeral.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000\n\nExample:\ntoRoman(1990) → "MCMXC"\n\nRequirements:\n- Implement function `toRoman(num)`.\n- Return the value; do not print directly.',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function toRoman(num) {
  // Convert number to Roman numeral
  
}

// Test your solution
console.log(toRoman(1990));`,
    solution: 'MCMXC',
    competencyIndex: 1,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 1, expected: 'I', description: '1 is I' },
      { input: 1990, expected: 'MCMXC', description: '1990 is MCMXC' }
    ]
  },

  // Python - Beginner
  {
    title: 'Hello World',
    slug: 'hello-world-py',
    description: 'Write a function that returns the string "Hello, World!".\n\nExample:\nhello_world() → "Hello, World!"\n\nRequirements:\n- Implement function `hello_world()`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def hello_world():
    # Return the greeting "Hello, World!"
    pass

# Test your solution
print(hello_world())`,
    solution: 'Hello, World!',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Functions'
    ],
    testCases: [
      { input: null, expected: 'Hello, World!', description: 'Should return "Hello, World!"' }
    ]
  },
  {
    title: 'Two Fer',
    slug: 'two-fer-py',
    description: 'Create a sentence of the form "One for X, one for me."\n\nWhere X is the given name. However, if the name is missing, use "you" instead.\n\nExamples:\ntwo_fer("Alice") → "One for Alice, one for me."\ntwo_fer() → "One for you, one for me."\n\nRequirements:\n- Implement function `two_fer(name=None)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def two_fer(name=None):
    # Return "One for [name], one for me."
    pass

# Test your solution
print(two_fer("Alice"))
print(two_fer())`,
    solution: 'One for Alice, one for me.',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Functions',
      'Control Structures'
    ],
    testCases: [
      { input: 'Alice', expected: 'One for Alice, one for me.', description: 'With name Alice' }
    ]
  },
  {
    title: 'Leap Year',
    slug: 'leap-py',
    description: 'Determine whether a year is a leap year.\n\nA leap year occurs on every year divisible by 4, except years divisible by 100, unless also divisible by 400.\n\nExamples:\nis_leap(2000) → True\nis_leap(1900) → False\nis_leap(2024) → True\n\nRequirements:\n- Implement function `is_leap(year)`.\n- Return True/False; do not print directly.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def is_leap(year):
    # Return True if year is a leap year
    pass

# Test your solution
print(is_leap(2024))`,
    solution: 'True',
    competencyIndex: 1,
    competencies: [
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: 2024, expected: true, description: '2024 is a leap year' }
    ]
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-py',
    description: 'Reverse a string.\n\nExample:\nreverse_string("hello") → "olleh"\n\nRequirements:\n- Implement function `reverse_string(s)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def reverse_string(s):
    # Return the reversed string
    pass

# Test your solution
print(reverse_string("hello"))`,
    solution: 'olleh',
    competencyIndex: 2,
    competencies: [
      'Functions',
      'Control Structures',
      'Arrays & Collections'
    ],
    testCases: [
      { input: 'hello', expected: 'olleh', description: 'Reverses hello' }
    ]
  },
  {
    title: 'Sum of Multiples',
    slug: 'sum-multiples-py',
    description: 'Find the sum of all unique multiples of given factors below a limit.\n\nExample:\nsum_of_multiples(20, [3, 5]) → 78\n\nRequirements:\n- Implement function `sum_of_multiples(limit, factors)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def sum_of_multiples(limit, factors):
    # Return sum of all unique multiples below limit
    pass

# Test your solution
print(sum_of_multiples(20, [3, 5]))`,
    solution: '78',
    competencyIndex: 3,
    competencies: [
      'Control Structures',
      'Functions',
      'Arrays & Collections'
    ],
    testCases: [
      { input: [20, [3, 5]], expected: 78, description: 'Multiples of 3 and 5 below 20' }
    ]
  },

  // Python - Intermediate
  {
    title: 'Hamming Distance',
    slug: 'hamming-py',
    description: 'Calculate the Hamming distance between two DNA strands.\n\nThe Hamming distance is the number of positions where the corresponding characters differ.\n\nExample:\nhamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT") → 7\n\nRequirements:\n- Implement function `hamming(strand1, strand2)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def hamming(strand1, strand2):
    # Return the number of differences
    pass

# Test your solution
print(hamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"))`,
    solution: '7',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Functions',
      'Arrays & Collections'
    ],
    testCases: [
      { input: ['GAGCCTACTAACGGGAT', 'CATCGTAATGACGGCCT'], expected: 7, description: 'Count differences' }
    ]
  },
  {
    title: 'Isogram',
    slug: 'isogram-py',
    description: 'Determine if a word is an isogram (no repeating letters).\n\nExamples:\nis_isogram("lumberjacks") → True\nis_isogram("isograms") → False\n\nRequirements:\n- Implement function `is_isogram(word)`.\n- Return True/False; do not print directly.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def is_isogram(word):
    # Return True if word has no repeating letters
    pass

# Test your solution
print(is_isogram("lumberjacks"))`,
    solution: 'True',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 'lumberjacks', expected: true, description: 'Is an isogram' }
    ]
  },
  {
    title: 'Pangram',
    slug: 'pangram-py',
    description: 'Determine if a sentence is a pangram (contains every letter of the alphabet).\n\nExample:\nis_pangram("The quick brown fox jumps over the lazy dog") → True\n\nRequirements:\n- Implement function `is_pangram(sentence)`.\n- Return True/False; do not print directly.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def is_pangram(sentence):
    # Return True if sentence contains every letter a-z
    pass

# Test your solution
print(is_pangram("The quick brown fox jumps over the lazy dog"))`,
    solution: 'True',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 'The quick brown fox jumps over the lazy dog', expected: true, description: 'Classic pangram' }
    ]
  },
  {
    title: 'RNA Transcription',
    slug: 'rna-py',
    description: 'Given a DNA strand, return its RNA complement.\n\nDNA to RNA: G→C, C→G, T→A, A→U\n\nExample:\nto_rna("GCTA") → "CGAU"\n\nRequirements:\n- Implement function `to_rna(dna)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def to_rna(dna):
    # Convert DNA to RNA
    pass

# Test your solution
print(to_rna("GCTA"))`,
    solution: 'CGAU',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Functions',
      'Arrays & Collections'
    ],
    testCases: [
      { input: 'GCTA', expected: 'CGAU', description: 'Full strand conversion' }
    ]
  },
  {
    title: 'Triangle',
    slug: 'triangle-py',
    description: 'Determine if three sides form a valid triangle, and what type.\n\nReturn "equilateral", "isosceles", "scalene", or "invalid".\n\nExample:\ntriangle_type(3, 3, 3) → "equilateral"\n\nRequirements:\n- Implement function `triangle_type(a, b, c)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def triangle_type(a, b, c):
    # Return the type of triangle
    pass

# Test your solution
print(triangle_type(3, 3, 3))`,
    solution: 'equilateral',
    competencyIndex: 1,
    competencies: [
      'Control Structures',
      'Functions',
      'Error Handling'
    ],
    testCases: [
      { input: [3, 3, 3], expected: 'equilateral', description: 'Equal sides' }
    ]
  },
  {
    title: 'ISBN Verifier',
    slug: 'isbn-verifier-py',
    exerciseSlug: 'isbn-verifier',
    description: 'Verify if a string is a valid ISBN-10.\n\nAn ISBN-10 is valid if the weighted sum of its digits is divisible by 11.\nThe final digit can be "X" which represents 10.\nHyphens may appear and should be ignored.\n\nExamples:\nis_valid("3-598-21508-8") → True\nis_valid("3-598-21508-9") → False\n\nRequirements:\n- Implement function `is_valid(isbn)`.\n- Return True/False; do not print directly.',
    language: 'python',
    difficulty: 'beginner',
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
  },
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

  // Python - Advanced
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
    title: 'Anagram Detector',
    slug: 'anagram-py',
    description: 'Given a word and a list of candidates, find all anagrams.\n\nExample:\nfind_anagrams("listen", ["enlist", "google", "silent"]) → ["enlist", "silent"]\n\nRequirements:\n- Implement function `find_anagrams(word, candidates)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def find_anagrams(word, candidates):
    # Return list of anagrams
    pass

# Test your solution
print(find_anagrams("listen", ["enlist", "google", "silent"]))`,
    solution: "['enlist', 'silent']",
    competencyIndex: 3,
    competencies: [
      'Arrays & Collections',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: ['listen', ['enlist', 'google', 'silent']], expected: ['enlist', 'silent'], description: 'Find anagrams' }
    ]
  },
  {
    title: 'Flatten Array',
    slug: 'flatten-py',
    description: 'Flatten a nested array and remove None values.\n\nExample:\nflatten([1, [2, 3, None, 4], [[5]], [[[6]]]]) → [1, 2, 3, 4, 5, 6]\n\nRequirements:\n- Implement function `flatten(arr)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'advanced',
    starterCode: `def flatten(arr):
    # Return flattened list without None
    pass

# Test your solution
print(flatten([1, [2, 3, None, 4], [[5]], [[[6]]]]))`,
    solution: '[1, 2, 3, 4, 5, 6]',
    competencyIndex: 3,
    competencies: [
      'Arrays & Collections',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: [[1, [2, 3, null, 4], [[5]], [[[6]]]]], expected: [1, 2, 3, 4, 5, 6], description: 'Flatten nested' }
    ]
  },
  {
    title: 'Run Length Encoding',
    slug: 'rle-py',
    description: 'Implement run-length encoding and decoding.\n\nConsecutive identical characters are encoded as count + character.\n\nExamples:\nencode("WWWWBWWWWBBB") → "4WB4W3B"\ndecode("4WB4W3B") → "WWWWBWWWWBBB"\n\nRequirements:\n- Implement function `encode(s)`.\n- Implement function `decode(s)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'advanced',
    starterCode: `def encode(s):
    # Return run-length encoded string
    pass

# Test your solution
print(encode("WWWWBWWWWBBB"))`,
    solution: '4WB4W3B',
    competencyIndex: 2,
    testCases: [
      { input: 'WWWWBWWWWBBB', expected: '4WB4W3B', description: 'Encode repeated chars' }
    ]
  },
  {
    title: 'Binary Search',
    slug: 'binary-search-py',
    description: 'Implement binary search to find a value in a sorted list.\n\nExample:\nbinary_search([1, 3, 5, 8, 13, 21], 8) → 3\n\nRequirements:\n- Implement function `binary_search(arr, target)`.\n- Return the index or -1; do not print directly.',
    language: 'python',
    difficulty: 'advanced',
    starterCode: `def binary_search(arr, target):
    # Return index of target, or -1
    pass

# Test your solution
print(binary_search([1, 3, 5, 8, 13, 21], 8))`,
    solution: '3',
    competencyIndex: 3,
    testCases: [
      { input: [[1, 3, 5, 8, 13, 21], 8], expected: 3, description: 'Find 8 at index 3' }
    ]
  },
  {
    title: 'Roman Numerals',
    slug: 'roman-numerals-py',
    description: 'Convert a number to a Roman numeral.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000\n\nExample:\nto_roman(1990) → "MCMXC"\n\nRequirements:\n- Implement function `to_roman(num)`.\n- Return the value; do not print directly.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def to_roman(num):
    # Convert number to Roman numeral
    pass

# Test your solution
print(to_roman(1990))`,
    solution: 'MCMXC',
    competencyIndex: 1,
    testCases: [
      { input: 1990, expected: 'MCMXC', description: '1990 is MCMXC' }
    ]
  },

  // Java - Beginner
  {
    title: 'Hello World',
    slug: 'hello-world-java',
    exerciseSlug: 'hello-world',
    description: 'Write a method that returns the string "Hello, World!".\n\nExample:\ngetGreeting() → "Hello, World!"\n\nRequirements:\n- Implement method `getGreeting()` in class `Greeter`.\n- Return the value; do not print directly.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class Greeter {
    public String getGreeting() {
        // Return "Hello, World!"
        return "";
    }
}`,
    solution: 'Hello, World!',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Functions'
    ],
    testCases: [
      { input: null, expected: 'Hello, World!', description: 'Should return greeting' }
    ]
  },
  {
    title: 'Two Fer',
    slug: 'two-fer-java',
    exerciseSlug: 'two-fer',
    description: 'Create a sentence of the form "One for X, one for me."\n\nWhere X is the given name. If the name is missing, use "you" instead.\n\nExamples:\ntwofer("Alice") → "One for Alice, one for me."\ntwofer(null) → "One for you, one for me."\n\nRequirements:\n- Implement method `twofer(String name)` in class `Twofer`.\n- Return the value; do not print directly.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class Twofer {
    public String twofer(String name) {
        // Return "One for [name], one for me."
        return "";
    }
}`,
    solution: 'One for Alice, one for me.',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Functions',
      'Control Structures'
    ],
    testCases: [
      { input: 'Alice', expected: 'One for Alice, one for me.', description: 'With name' }
    ]
  },
  {
    title: 'Leap Year',
    slug: 'leap-java',
    exerciseSlug: 'leap',
    description: 'Determine whether a year is a leap year.\n\nA leap year occurs:\n- On every year divisible by 4\n- Except years divisible by 100\n- Unless the year is also divisible by 400\n\nExamples:\nisLeapYear(2000) → true\nisLeapYear(1900) → false\nisLeapYear(2024) → true\n\nRequirements:\n- Implement method `isLeapYear(int year)` in class `Leap`.\n- Return true/false; do not print directly.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class Leap {
    public boolean isLeapYear(int year) {
        // Return true if leap year
        return false;
    }
}`,
    solution: 'true',
    competencyIndex: 1,
    competencies: [
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: 2024, expected: true, description: '2024 is a leap year' }
    ]
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-java',
    exerciseSlug: 'reverse-string',
    description: 'Reverse a string.\n\nExamples:\nreverse("hello") → "olleh"\nreverse("robot") → "tobor"\n\nRequirements:\n- Implement method `reverse(String input)` in class `ReverseString`.\n- Return the value; do not print directly.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class ReverseString {
    public String reverse(String input) {
        // Return reversed string
        return "";
    }
}`,
    solution: 'olleh',
    competencyIndex: 2,
    competencies: [
      'Functions',
      'Control Structures',
      'Arrays & Collections'
    ],
    testCases: [
      { input: 'hello', expected: 'olleh', description: 'Reverses hello' }
    ]
  },
  {
    title: 'Resistor Color',
    slug: 'resistor-color-java',
    exerciseSlug: 'resistor-color',
    description: 'Resistors have color coded bands. Return the numeric value of a color.\n\nColors: black=0, brown=1, red=2, orange=3, yellow=4, green=5, blue=6, violet=7, grey=8, white=9\n\nExamples:\ncolorCode("black") → 0\ncolorCode("brown") → 1\n\nRequirements:\n- Implement methods `colorCode(String color)` and `colors()` in class `ResistorColor`.\n- `colors()` should return the color list in order.\n- Return values; do not print directly.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class ResistorColor {
    public int colorCode(String color) {
        // Return numeric value for color
        return -1;
    }

    public String[] colors() {
        // Return the color array
        return new String[] {};
    }
}`,
    solution: '1',
    competencyIndex: 3,
    competencies: [
      'Variables & Data Types',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 'brown', expected: 1, description: 'Brown is 1' }
    ]
  },

  // Java - Intermediate
  {
    title: 'Hamming Distance',
    slug: 'hamming-java',
    exerciseSlug: 'hamming',
    description: 'Calculate the Hamming distance between two DNA strands.\n\nThe Hamming distance is the number of positions where the corresponding characters differ.\n\nExample:\nnew Hamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT").getHammingDistance() → 7\n\nRequirements:\n- Implement constructor `Hamming(String left, String right)`.\n- Implement method `getHammingDistance()`.\n- Return the value; do not print directly.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class Hamming {
    private final String left;
    private final String right;

    public Hamming(String left, String right) {
        this.left = left;
        this.right = right;
    }

    public int getHammingDistance() {
        // Return count of differences
        return 0;
    }
}`,
    solution: '7',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: ['GAGCCTACTAACGGGAT', 'CATCGTAATGACGGCCT'], expected: 7, description: 'Count differences' }
    ]
  },
  {
    title: 'Isogram',
    slug: 'isogram-java',
    exerciseSlug: 'isogram',
    description: 'Determine if a word is an isogram (no repeating letters).\n\nExamples:\nisIsogram("lumberjacks") → true\nisIsogram("isograms") → false\n\nRequirements:\n- Implement method `isIsogram(String word)` in class `IsogramChecker`.\n- Return true/false; do not print directly.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class IsogramChecker {
    public boolean isIsogram(String word) {
        // Return true if no repeating letters
        return false;
    }
}`,
    solution: 'true',
    competencyIndex: 2,
    competencies: [
      'Arrays & Collections',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: 'lumberjacks', expected: true, description: 'Is an isogram' }
    ]
  },
  {
    title: 'Pangram',
    slug: 'pangram-java',
    exerciseSlug: 'pangram',
    description: 'Determine if a sentence is a pangram (contains every letter of the alphabet).\n\nExample:\nisPangram("The quick brown fox jumps over the lazy dog") → true\n\nRequirements:\n- Implement method `isPangram(String sentence)` in class `PangramChecker`.\n- Return true/false; do not print directly.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class PangramChecker {
    public boolean isPangram(String sentence) {
        // Return true if contains all letters
        return false;
    }
}`,
    solution: 'true',
    competencyIndex: 2,
    competencies: [
      'Arrays & Collections',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: 'The quick brown fox jumps over the lazy dog', expected: true, description: 'Classic pangram' }
    ]
  },
  {
    title: 'RNA Transcription',
    slug: 'rna-java',
    exerciseSlug: 'rna-transcription',
    description: 'Given a DNA strand, return its RNA complement.\n\nDNA to RNA: G→C, C→G, T→A, A→U\n\nExamples:\ntranscribe("GCTA") → "CGAU"\n\nRequirements:\n- Implement method `transcribe(String dna)` in class `RnaTranscription`.\n- Return the value; do not print directly.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class RnaTranscription {
    public String transcribe(String dna) {
        // Convert DNA to RNA
        return "";
    }
}

class Main {
    public static void main(String[] args) {
        RnaTranscription rna = new RnaTranscription();
        // Example run
        System.out.println(rna.transcribe("GCTA"));
    }
}
`,
    solution: 'CGAU',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 'GCTA', expected: 'CGAU', description: 'Full strand' }
    ]
  },
  {
    title: 'Difference of Squares',
    slug: 'difference-squares-java',
    exerciseSlug: 'difference-of-squares',
    description: 'Find the difference between the square of the sum and the sum of the squares.\n\nExample for 1..10:\n(1+2+...+10)² - (1²+2²+...+10²) = 2640\n\nRequirements:\n- Implement methods `computeSquareOfSumTo(int n)`, `computeSumOfSquaresTo(int n)`, `computeDifferenceOfSquares(int n)` in class `DifferenceOfSquaresCalculator`.\n- Return values; do not print directly.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class DifferenceOfSquaresCalculator {
    public int computeSquareOfSumTo(int input) {
        // Return square of sum to input
        return 0;
    }

    public int computeSumOfSquaresTo(int input) {
        // Return sum of squares to input
        return 0;
    }

    public int computeDifferenceOfSquares(int input) {
        // Return square of sum minus sum of squares
        return 0;
    }
}`,
    solution: '2640',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: 10, expected: 2640, description: 'Difference for 1-10' }
    ]
  },

  // Java - Advanced
  {
    title: 'Anagram Detector',
    slug: 'anagram-java',
    exerciseSlug: 'anagram',
    description: 'Given a word and a list of candidates, find all anagrams.\n\nAn anagram uses all original letters exactly once.\n\nExample:\nnew Anagram("listen").match(List.of("enlist", "google", "silent")) → ["enlist", "silent"]\n\nRequirements:\n- Implement constructor `Anagram(String source)`.\n- Implement method `match(List<String> candidates)`.\n- Return the value; do not print directly.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `import java.util.ArrayList;
import java.util.List;

public class Anagram {
    private final String source;

    public Anagram(String source) {
        this.source = source;
    }

    public List<String> match(List<String> candidates) {
        // Return list of anagrams
        return new ArrayList<>();
    }
}`,
    solution: '[enlist, silent]',
    competencyIndex: 3,
    competencies: [
      'Arrays & Collections',
      'Control Structures',
      'Functions'
    ],
    testCases: [
      { input: ['listen', ['enlist', 'google', 'silent']], expected: ['enlist', 'silent'], description: 'Find anagrams' }
    ]
  },
  {
    title: 'Run Length Encoding',
    slug: 'rle-java',
    exerciseSlug: 'run-length-encoding',
    description: 'Implement run-length encoding and decoding.\n\nConsecutive identical characters are encoded as count + character.\n\nExamples:\nencode("WWWWBWWWWBBB") → "4WB4W3B"\ndecode("4WB4W3B") → "WWWWBWWWWBBB"\n\nRequirements:\n- Implement methods `encode(String input)` and `decode(String input)` in class `RunLengthEncoding`.\n- Return values; do not print directly.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `public class RunLengthEncoding {
    public String encode(String input) {
        // Return run-length encoded string
        return "";
    }

    public String decode(String input) {
        // Return decoded string
        return "";
    }
}`,
    solution: '4WB4W3B',
    competencyIndex: 2,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 'WWWWBWWWWBBB', expected: '4WB4W3B', description: 'Encode repeated chars' }
    ]
  },
  {
    title: 'Binary Search',
    slug: 'binary-search-java',
    exerciseSlug: 'binary-search',
    description: 'Implement binary search to find a value in a sorted list.\n\nReturn the index of the value, or throw `ValueNotFoundException` if not found.\n\nExample:\nnew BinarySearch(List.of(1, 3, 5, 8, 13, 21)).indexOf(8) → 3\n\nRequirements:\n- Implement constructor `BinarySearch(List<Integer> list)`.\n- Implement method `indexOf(int value)`.\n- Return the index; do not print directly.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `import java.util.List;

public class BinarySearch {
    private final List<Integer> list;

    public BinarySearch(List<Integer> list) {
        this.list = list;
    }

    public int indexOf(int value) throws ValueNotFoundException {
        // Return index of value or throw ValueNotFoundException
        return -1;
    }
}

class ValueNotFoundException extends Exception {
    public ValueNotFoundException(String message) {
        super(message);
    }
}
`,
    solution: '3',
    competencyIndex: 3,
    competencies: [
      'Control Structures',
      'Functions',
      'Arrays & Collections'
    ],
    testCases: [
      { input: [[1, 3, 5, 8, 13, 21], 8], expected: 3, description: 'Find 8 at index 3' }
    ]
  },
  {
    title: 'Roman Numerals',
    slug: 'roman-numerals-java',
    exerciseSlug: 'roman-numerals',
    description: 'Convert a number to a Roman numeral.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000\n\nExample:\nnew RomanNumerals(1990).getRomanNumeral() → "MCMXC"\n\nRequirements:\n- Implement constructor `RomanNumerals(int number)`.\n- Implement method `getRomanNumeral()`.\n- Return the value; do not print directly.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class RomanNumerals {
    private final int number;

    public RomanNumerals(int number) {
        this.number = number;
    }

    public String getRomanNumeral() {
        // Convert to Roman numeral
        return "";
    }
}`,
    solution: 'MCMXC',
    competencyIndex: 1,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions'
    ],
    testCases: [
      { input: 1990, expected: 'MCMXC', description: '1990 is MCMXC' }
    ]
  },
  {
    title: 'Prime Factors',
    slug: 'prime-factors-java',
    exerciseSlug: 'prime-factors',
    description: 'Compute the prime factors of a given number.\n\nExample:\ncalculatePrimeFactorsOf(60) → [2, 2, 3, 5]\n\nRequirements:\n- Implement method `calculatePrimeFactorsOf(long number)` in class `PrimeFactorsCalculator`.\n- Return a list of prime factors; do not print directly.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `import java.util.ArrayList;
import java.util.List;

public class PrimeFactorsCalculator {
    public List<Long> calculatePrimeFactorsOf(long number) {
        // Return list of prime factors
        return new ArrayList<>();
    }
}`,
    solution: '[2, 2, 3, 5]',
    competencyIndex: 0,
    competencies: [
      'Variables & Data Types',
      'Control Structures',
      'Functions',
      'Arrays & Collections'
    ],
    testCases: [
      { input: 60, expected: [2, 2, 3, 5], description: 'Prime factors of 60' }
    ]
  },
  {
    title: 'Bank Account',
    slug: 'bank-account-java',
    exerciseSlug: 'bank-account',
    description: 'Implement a simple bank account with open/close and deposit/withdraw operations.\n\nRequirements:\n- Implement class `BankAccount` with `open()`, `close()`, `deposit(int amount)`, `withdraw(int amount)`, `getBalance()`.\n- Throw `BankAccountActionInvalidException` for invalid operations (closed account, negative amounts, insufficient funds).\n- Protect account state (encapsulation).',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `class BankAccountActionInvalidException extends Exception {
    public BankAccountActionInvalidException(String message) {
        super(message);
    }
}

class BankAccount {
    private int balance = 0;
    private boolean open = false;

    public void open() throws BankAccountActionInvalidException {
        // Open the account
    }

    public void close() throws BankAccountActionInvalidException {
        // Close the account
    }

    public int getBalance() throws BankAccountActionInvalidException {
        // Return current balance
        return balance;
    }

    public void deposit(int amount) throws BankAccountActionInvalidException {
        // Deposit amount
    }

    public void withdraw(int amount) throws BankAccountActionInvalidException {
        // Withdraw amount
    }
}

public class Main {
    public static void main(String[] args) {
        // Add your own test calls here
    }
}
`,
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
    slug: 'robot-name-java',
    exerciseSlug: 'robot-name',
    description: 'Create a robot with a unique name.\n\nA robot name is two uppercase letters followed by three digits (e.g., "RX837"). The name must be generated on first access and should stay the same until reset.\n\nRequirements:\n- Implement class `Robot` with `getName()` and `reset()`.\n- Return values; do not print directly.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `class Robot {
    private String name;

    public Robot() {
        // Assign a unique name
        this.name = "";
    }

    public String getName() {
        // Return robot name
        return name;
    }

    public void reset() {
        // Assign a new unique name
    }
}

public class Main {
    public static void main(String[] args) {
        // Add your own test calls here
    }
}
`,
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
    slug: 'isbn-verifier-java',
    exerciseSlug: 'isbn-verifier',
    description: 'Verify if a string is a valid ISBN-10.\n\nAn ISBN-10 is valid if the weighted sum of its digits is divisible by 11. The final digit can be "X" which represents 10. Hyphens may appear and should be ignored.\n\nExamples:\nisValid("3-598-21508-8") → true\nisValid("3-598-21508-9") → false\n\nRequirements:\n- Implement method `isValid(String stringToVerify)` in class `IsbnVerifier`.\n- Return true/false; do not print directly.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `class IsbnVerifier {
    public boolean isValid(String stringToVerify) {
        // Return true if ISBN-10 is valid
        return false;
    }
}

public class Main {
    public static void main(String[] args) {
        // Add your own test calls here
    }
}
`,
    solution: '',
    competencyIndex: 5,
    competencies: [
      'Control Structures',
      'Arrays & Collections',
      'Functions',
      'Error Handling'
    ],
    testCases: []
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

    if (process.env.SEED_SYNC_EXERCISM === 'true') {
      console.log('Syncing Exercism tests and templates...')
      await syncExercismTests(Challenge, { onProgress: (message) => console.log(message) })
      await syncExercismTemplates(Challenge, { onProgress: (message) => console.log(message) })
    }

    await mongoose.disconnect()
    console.log('Done!')
    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seed()


