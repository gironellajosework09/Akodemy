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
    description: 'Write a function that returns the string "Hello, World!".\n\nExample:\nhelloWorld() → "Hello, World!"',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function helloWorld() {
  // Return the greeting "Hello, World!"
  
}

// Test your solution
console.log(helloWorld());`,
    solution: 'Hello, World!',
    competencyIndex: 0,
    testCases: [
      { input: null, expected: 'Hello, World!', description: 'Should return "Hello, World!"' }
    ]
  },
  {
    title: 'Two Fer',
    slug: 'two-fer-js',
    description: 'Create a sentence of the form "One for X, one for me."\n\nWhere X is the given name. However, if the name is missing, use "you" instead.\n\nExamples:\ntwoFer("Alice") → "One for Alice, one for me."\ntwoFer() → "One for you, one for me."',
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
    testCases: [
      { input: 'Alice', expected: 'One for Alice, one for me.', description: 'With name Alice' },
      { input: null, expected: 'One for you, one for me.', description: 'With no name' }
    ]
  },
  {
    title: 'Leap Year',
    slug: 'leap-js',
    description: 'Determine whether a year is a leap year.\n\nA leap year occurs:\n- On every year divisible by 4\n- Except years divisible by 100\n- Unless the year is also divisible by 400\n\nExamples:\nisLeap(2000) → true\nisLeap(1900) → false\nisLeap(2024) → true',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function isLeap(year) {
  // Return true if year is a leap year, false otherwise
  
}

// Test your solution
console.log(isLeap(2024));`,
    solution: 'true',
    competencyIndex: 1,
    testCases: [
      { input: 2000, expected: true, description: 'Year 2000 is a leap year' },
      { input: 1900, expected: false, description: 'Year 1900 is not a leap year' },
      { input: 2024, expected: true, description: 'Year 2024 is a leap year' }
    ]
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-js',
    description: 'Reverse a string.\n\nExamples:\nreverseString("hello") → "olleh"\nreverseString("robot") → "tobor"',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function reverseString(str) {
  // Return the reversed string
  
}

// Test your solution
console.log(reverseString("hello"));`,
    solution: 'olleh',
    competencyIndex: 2,
    testCases: [
      { input: 'hello', expected: 'olleh', description: 'Reverses hello' },
      { input: 'robot', expected: 'tobor', description: 'Reverses robot' }
    ]
  },
  {
    title: 'Resistor Color',
    slug: 'resistor-color-js',
    description: 'Resistors have color coded bands. Return the numeric value of a color.\n\nColors: black=0, brown=1, red=2, orange=3, yellow=4, green=5, blue=6, violet=7, grey=8, white=9\n\nExamples:\ncolorCode("black") → 0\ncolorCode("brown") → 1',
    language: 'javascript',
    difficulty: 'beginner',
    starterCode: `function colorCode(color) {
  // Return the numeric value for the color
  
}

// Test your solution
console.log(colorCode("brown"));`,
    solution: '1',
    competencyIndex: 3,
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
    description: 'Calculate the Hamming distance between two DNA strands.\n\nThe Hamming distance is the number of positions where the corresponding characters differ.\n\nExamples:\nhamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT") → 7',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function hamming(strand1, strand2) {
  // Return the number of differences between strands
  
}

// Test your solution
console.log(hamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"));`,
    solution: '7',
    competencyIndex: 2,
    testCases: [
      { input: ['GAGCCTACTAACGGGAT', 'CATCGTAATGACGGCCT'], expected: 7, description: 'Long strands' },
      { input: ['GGACG', 'GGTCG'], expected: 1, description: 'Short strands' }
    ]
  },
  {
    title: 'Isogram',
    slug: 'isogram-js',
    description: 'Determine if a word is an isogram (no repeating letters).\n\nExamples:\nisIsogram("lumberjacks") → true\nisIsogram("isograms") → false',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function isIsogram(word) {
  // Return true if word has no repeating letters
  
}

// Test your solution
console.log(isIsogram("lumberjacks"));`,
    solution: 'true',
    competencyIndex: 2,
    testCases: [
      { input: 'lumberjacks', expected: true, description: 'Is an isogram' },
      { input: 'isograms', expected: false, description: 'Not an isogram (has s twice)' }
    ]
  },
  {
    title: 'Pangram',
    slug: 'pangram-js',
    description: 'Determine if a sentence is a pangram (contains every letter of the alphabet).\n\nExample:\nisPangram("The quick brown fox jumps over the lazy dog") → true',
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
    description: 'Given a DNA strand, return its RNA complement.\n\nDNA to RNA: G→C, C→G, T→A, A→U\n\nExamples:\ntoRNA("GCTA") → "CGAU"',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function toRNA(dna) {
  // Convert DNA strand to RNA
  
}

// Test your solution
console.log(toRNA("GCTA"));`,
    solution: 'CGAU',
    competencyIndex: 2,
    testCases: [
      { input: 'G', expected: 'C', description: 'G to C' },
      { input: 'GCTA', expected: 'CGAU', description: 'Full strand' }
    ]
  },
  {
    title: 'Space Age',
    slug: 'space-age-js',
    description: 'Calculate how old someone would be on different planets.\n\nEarth year = 365.25 days. Planet orbital periods (Earth years):\nMercury: 0.2408467, Venus: 0.61519726, Mars: 1.8808158, Jupiter: 11.862615\n\nExample:\nspaceAge(1000000000, "Earth") → 31.69 (seconds to years)',
    language: 'javascript',
    difficulty: 'intermediate',
    starterCode: `function spaceAge(seconds, planet) {
  // Return age in years on the given planet (rounded to 2 decimals)
  
}

// Test your solution
console.log(spaceAge(1000000000, "Earth"));`,
    solution: '31.69',
    competencyIndex: 0,
    testCases: [
      { input: [1000000000, 'Earth'], expected: 31.69, description: 'Age on Earth' }
    ]
  },

  // JavaScript - Advanced
  {
    title: 'Anagram Detector',
    slug: 'anagram-js',
    description: 'Given a word and a list of candidates, find all anagrams.\n\nAn anagram uses all original letters exactly once.\n\nExample:\nfindAnagrams("listen", ["enlist", "google", "silent"]) → ["enlist", "silent"]',
    language: 'javascript',
    difficulty: 'advanced',
    starterCode: `function findAnagrams(word, candidates) {
  // Return array of candidates that are anagrams of word
  
}

// Test your solution
console.log(findAnagrams("listen", ["enlist", "google", "silent"]));`,
    solution: '["enlist","silent"]',
    competencyIndex: 3,
    testCases: [
      { input: ['listen', ['enlist', 'google', 'silent']], expected: ['enlist', 'silent'], description: 'Find anagrams' }
    ]
  },
  {
    title: 'Flatten Array',
    slug: 'flatten-array-js',
    description: 'Flatten a nested array and remove null/undefined values.\n\nExample:\nflattenArray([1, [2, 3, null, 4], [[5]], [[[6]]]])  → [1, 2, 3, 4, 5, 6]',
    language: 'javascript',
    difficulty: 'advanced',
    starterCode: `function flattenArray(arr) {
  // Return flattened array without null/undefined
  
}

// Test your solution
console.log(flattenArray([1, [2, 3, null, 4], [[5]], [[[6]]]]));`,
    solution: '[1,2,3,4,5,6]',
    competencyIndex: 3,
    testCases: [
      { input: [[1, [2, 3, null, 4], [[5]], [[[6]]]]], expected: [1, 2, 3, 4, 5, 6], description: 'Flatten nested arrays' }
    ]
  },
  {
    title: 'Run Length Encoding',
    slug: 'rle-js',
    description: 'Implement run-length encoding.\n\nConsecutive identical characters are encoded as count + character.\n\nExample:\nencode("WWWWBWWWWBBB") → "4WB4W3B"',
    language: 'javascript',
    difficulty: 'advanced',
    starterCode: `function encode(str) {
  // Return run-length encoded string
  
}

// Test your solution
console.log(encode("WWWWBWWWWBBB"));`,
    solution: '4WB4W3B',
    competencyIndex: 2,
    testCases: [
      { input: 'WWWWBWWWWBBB', expected: '4WB4W3B', description: 'Encode repeated chars' },
      { input: 'AABCCCDEEEE', expected: '2AB3CD4E', description: 'Mixed encoding' }
    ]
  },
  {
    title: 'Binary Search',
    slug: 'binary-search-js',
    description: 'Implement binary search to find a value in a sorted array.\n\nReturn the index of the value, or -1 if not found.\n\nExample:\nbinarySearch([1, 3, 5, 8, 13, 21], 8) → 3',
    language: 'javascript',
    difficulty: 'advanced',
    starterCode: `function binarySearch(arr, target) {
  // Return index of target in sorted array, or -1
  
}

// Test your solution
console.log(binarySearch([1, 3, 5, 8, 13, 21], 8));`,
    solution: '3',
    competencyIndex: 3,
    testCases: [
      { input: [[1, 3, 5, 8, 13, 21], 8], expected: 3, description: 'Find 8 at index 3' },
      { input: [[1, 3, 5, 8, 13, 21], 21], expected: 5, description: 'Find 21 at index 5' }
    ]
  },
  {
    title: 'Roman Numerals',
    slug: 'roman-numerals-js',
    description: 'Convert a number to a Roman numeral.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000\n\nExample:\ntoRoman(1990) → "MCMXC"',
    language: 'javascript',
    difficulty: 'advanced',
    starterCode: `function toRoman(num) {
  // Convert number to Roman numeral
  
}

// Test your solution
console.log(toRoman(1990));`,
    solution: 'MCMXC',
    competencyIndex: 1,
    testCases: [
      { input: 1, expected: 'I', description: '1 is I' },
      { input: 1990, expected: 'MCMXC', description: '1990 is MCMXC' }
    ]
  },

  // Python - Beginner
  {
    title: 'Hello World',
    slug: 'hello-world-py',
    description: 'Write a function that returns the string "Hello, World!".\n\nExample:\nhello_world() → "Hello, World!"',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def hello_world():
    # Return the greeting "Hello, World!"
    pass

# Test your solution
print(hello_world())`,
    solution: 'Hello, World!',
    competencyIndex: 0,
    testCases: [
      { input: null, expected: 'Hello, World!', description: 'Should return "Hello, World!"' }
    ]
  },
  {
    title: 'Two Fer',
    slug: 'two-fer-py',
    description: 'Create a sentence of the form "One for X, one for me."\n\nWhere X is the given name. However, if the name is missing, use "you" instead.',
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
    testCases: [
      { input: 'Alice', expected: 'One for Alice, one for me.', description: 'With name Alice' }
    ]
  },
  {
    title: 'Leap Year',
    slug: 'leap-py',
    description: 'Determine whether a year is a leap year.\n\nA leap year occurs on every year divisible by 4, except years divisible by 100, unless also divisible by 400.',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def is_leap(year):
    # Return True if year is a leap year
    pass

# Test your solution
print(is_leap(2024))`,
    solution: 'True',
    competencyIndex: 1,
    testCases: [
      { input: 2024, expected: true, description: '2024 is a leap year' }
    ]
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-py',
    description: 'Reverse a string.\n\nExample:\nreverse_string("hello") → "olleh"',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def reverse_string(s):
    # Return the reversed string
    pass

# Test your solution
print(reverse_string("hello"))`,
    solution: 'olleh',
    competencyIndex: 2,
    testCases: [
      { input: 'hello', expected: 'olleh', description: 'Reverses hello' }
    ]
  },
  {
    title: 'Sum of Multiples',
    slug: 'sum-multiples-py',
    description: 'Find the sum of all unique multiples of given factors below a limit.\n\nExample:\nsum_of_multiples(20, [3, 5]) → 78',
    language: 'python',
    difficulty: 'beginner',
    starterCode: `def sum_of_multiples(limit, factors):
    # Return sum of all unique multiples below limit
    pass

# Test your solution
print(sum_of_multiples(20, [3, 5]))`,
    solution: '78',
    competencyIndex: 3,
    testCases: [
      { input: [20, [3, 5]], expected: 78, description: 'Multiples of 3 and 5 below 20' }
    ]
  },

  // Python - Intermediate
  {
    title: 'Hamming Distance',
    slug: 'hamming-py',
    description: 'Calculate the Hamming distance between two DNA strands.\n\nThe Hamming distance is the number of positions where the corresponding characters differ.',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def hamming(strand1, strand2):
    # Return the number of differences
    pass

# Test your solution
print(hamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"))`,
    solution: '7',
    competencyIndex: 2,
    testCases: [
      { input: ['GAGCCTACTAACGGGAT', 'CATCGTAATGACGGCCT'], expected: 7, description: 'Count differences' }
    ]
  },
  {
    title: 'Isogram',
    slug: 'isogram-py',
    description: 'Determine if a word is an isogram (no repeating letters).',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def is_isogram(word):
    # Return True if word has no repeating letters
    pass

# Test your solution
print(is_isogram("lumberjacks"))`,
    solution: 'True',
    competencyIndex: 2,
    testCases: [
      { input: 'lumberjacks', expected: true, description: 'Is an isogram' }
    ]
  },
  {
    title: 'Pangram',
    slug: 'pangram-py',
    description: 'Determine if a sentence is a pangram (contains every letter of the alphabet).',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def is_pangram(sentence):
    # Return True if sentence contains every letter a-z
    pass

# Test your solution
print(is_pangram("The quick brown fox jumps over the lazy dog"))`,
    solution: 'True',
    competencyIndex: 2,
    testCases: [
      { input: 'The quick brown fox jumps over the lazy dog', expected: true, description: 'Classic pangram' }
    ]
  },
  {
    title: 'RNA Transcription',
    slug: 'rna-py',
    description: 'Given a DNA strand, return its RNA complement.\n\nDNA to RNA: G→C, C→G, T→A, A→U',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def to_rna(dna):
    # Convert DNA to RNA
    pass

# Test your solution
print(to_rna("GCTA"))`,
    solution: 'CGAU',
    competencyIndex: 2,
    testCases: [
      { input: 'GCTA', expected: 'CGAU', description: 'Full strand conversion' }
    ]
  },
  {
    title: 'Triangle',
    slug: 'triangle-py',
    description: 'Determine if three sides form a valid triangle, and what type.\n\nReturn "equilateral", "isosceles", "scalene", or "invalid".',
    language: 'python',
    difficulty: 'intermediate',
    starterCode: `def triangle_type(a, b, c):
    # Return the type of triangle
    pass

# Test your solution
print(triangle_type(3, 3, 3))`,
    solution: 'equilateral',
    competencyIndex: 1,
    testCases: [
      { input: [3, 3, 3], expected: 'equilateral', description: 'Equal sides' }
    ]
  },

  // Python - Advanced
  {
    title: 'Anagram Detector',
    slug: 'anagram-py',
    description: 'Given a word and a list of candidates, find all anagrams.',
    language: 'python',
    difficulty: 'advanced',
    starterCode: `def find_anagrams(word, candidates):
    # Return list of anagrams
    pass

# Test your solution
print(find_anagrams("listen", ["enlist", "google", "silent"]))`,
    solution: "['enlist', 'silent']",
    competencyIndex: 3,
    testCases: [
      { input: ['listen', ['enlist', 'google', 'silent']], expected: ['enlist', 'silent'], description: 'Find anagrams' }
    ]
  },
  {
    title: 'Flatten Array',
    slug: 'flatten-py',
    description: 'Flatten a nested array and remove None values.',
    language: 'python',
    difficulty: 'advanced',
    starterCode: `def flatten(arr):
    # Return flattened list without None
    pass

# Test your solution
print(flatten([1, [2, 3, None, 4], [[5]], [[[6]]]]))`,
    solution: '[1, 2, 3, 4, 5, 6]',
    competencyIndex: 3,
    testCases: [
      { input: [[1, [2, 3, null, 4], [[5]], [[[6]]]]], expected: [1, 2, 3, 4, 5, 6], description: 'Flatten nested' }
    ]
  },
  {
    title: 'Run Length Encoding',
    slug: 'rle-py',
    description: 'Implement run-length encoding.\n\nConsecutive identical characters are encoded as count + character.',
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
    description: 'Implement binary search to find a value in a sorted list.',
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
    description: 'Convert a number to a Roman numeral.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000',
    language: 'python',
    difficulty: 'advanced',
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
    description: 'Write a method that returns "Hello, World!"',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class Main {
    public static String helloWorld() {
        // Return "Hello, World!"
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(helloWorld());
    }
}`,
    solution: 'Hello, World!',
    competencyIndex: 0,
    testCases: [
      { input: null, expected: 'Hello, World!', description: 'Should return greeting' }
    ]
  },
  {
    title: 'Two Fer',
    slug: 'two-fer-java',
    description: 'Create a sentence "One for X, one for me." Use "you" if no name given.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class Main {
    public static String twoFer(String name) {
        // Return "One for [name], one for me."
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(twoFer("Alice"));
    }
}`,
    solution: 'One for Alice, one for me.',
    competencyIndex: 0,
    testCases: [
      { input: 'Alice', expected: 'One for Alice, one for me.', description: 'With name' }
    ]
  },
  {
    title: 'Leap Year',
    slug: 'leap-java',
    description: 'Determine whether a year is a leap year.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class Main {
    public static boolean isLeap(int year) {
        // Return true if leap year
        return false;
    }
    
    public static void main(String[] args) {
        System.out.println(isLeap(2024));
    }
}`,
    solution: 'true',
    competencyIndex: 1,
    testCases: [
      { input: 2024, expected: true, description: '2024 is a leap year' }
    ]
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string-java',
    description: 'Reverse a string.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class Main {
    public static String reverseString(String s) {
        // Return reversed string
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(reverseString("hello"));
    }
}`,
    solution: 'olleh',
    competencyIndex: 2,
    testCases: [
      { input: 'hello', expected: 'olleh', description: 'Reverses hello' }
    ]
  },
  {
    title: 'Resistor Color',
    slug: 'resistor-java',
    description: 'Return the numeric value of a resistor color band.',
    language: 'java',
    difficulty: 'beginner',
    starterCode: `public class Main {
    public static int colorCode(String color) {
        // Return numeric value for color
        return -1;
    }
    
    public static void main(String[] args) {
        System.out.println(colorCode("brown"));
    }
}`,
    solution: '1',
    competencyIndex: 3,
    testCases: [
      { input: 'brown', expected: 1, description: 'Brown is 1' }
    ]
  },

  // Java - Intermediate
  {
    title: 'Hamming Distance',
    slug: 'hamming-java',
    description: 'Calculate the Hamming distance between two DNA strands.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class Main {
    public static int hamming(String strand1, String strand2) {
        // Return count of differences
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(hamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT"));
    }
}`,
    solution: '7',
    competencyIndex: 2,
    testCases: [
      { input: ['GAGCCTACTAACGGGAT', 'CATCGTAATGACGGCCT'], expected: 7, description: 'Count differences' }
    ]
  },
  {
    title: 'Isogram',
    slug: 'isogram-java',
    description: 'Determine if a word is an isogram (no repeating letters).',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class Main {
    public static boolean isIsogram(String word) {
        // Return true if no repeating letters
        return false;
    }
    
    public static void main(String[] args) {
        System.out.println(isIsogram("lumberjacks"));
    }
}`,
    solution: 'true',
    competencyIndex: 2,
    testCases: [
      { input: 'lumberjacks', expected: true, description: 'Is an isogram' }
    ]
  },
  {
    title: 'Pangram',
    slug: 'pangram-java',
    description: 'Determine if a sentence is a pangram.',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class Main {
    public static boolean isPangram(String sentence) {
        // Return true if contains all letters
        return false;
    }
    
    public static void main(String[] args) {
        System.out.println(isPangram("The quick brown fox jumps over the lazy dog"));
    }
}`,
    solution: 'true',
    competencyIndex: 2,
    testCases: [
      { input: 'The quick brown fox jumps over the lazy dog', expected: true, description: 'Classic pangram' }
    ]
  },
  {
    title: 'RNA Transcription',
    slug: 'rna-java',
    description: 'Convert DNA to RNA. G→C, C→G, T→A, A→U',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class Main {
    public static String toRNA(String dna) {
        // Convert DNA to RNA
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(toRNA("GCTA"));
    }
}`,
    solution: 'CGAU',
    competencyIndex: 2,
    testCases: [
      { input: 'GCTA', expected: 'CGAU', description: 'Full strand' }
    ]
  },
  {
    title: 'Difference of Squares',
    slug: 'difference-squares-java',
    description: 'Find the difference between sum of squares and square of sum.\n\nFor 1-10: (1+2+...+10)² - (1²+2²+...+10²) = 2640',
    language: 'java',
    difficulty: 'intermediate',
    starterCode: `public class Main {
    public static int difference(int n) {
        // Return squareOfSum - sumOfSquares
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(difference(10));
    }
}`,
    solution: '2640',
    competencyIndex: 0,
    testCases: [
      { input: 10, expected: 2640, description: 'Difference for 1-10' }
    ]
  },

  // Java - Advanced
  {
    title: 'Anagram Detector',
    slug: 'anagram-java',
    description: 'Find all anagrams of a word from a list of candidates.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `import java.util.*;

public class Main {
    public static List<String> findAnagrams(String word, List<String> candidates) {
        // Return list of anagrams
        return new ArrayList<>();
    }
    
    public static void main(String[] args) {
        List<String> candidates = Arrays.asList("enlist", "google", "silent");
        System.out.println(findAnagrams("listen", candidates));
    }
}`,
    solution: '[enlist, silent]',
    competencyIndex: 3,
    testCases: [
      { input: ['listen', ['enlist', 'google', 'silent']], expected: ['enlist', 'silent'], description: 'Find anagrams' }
    ]
  },
  {
    title: 'Run Length Encoding',
    slug: 'rle-java',
    description: 'Implement run-length encoding.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `public class Main {
    public static String encode(String s) {
        // Return run-length encoded string
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(encode("WWWWBWWWWBBB"));
    }
}`,
    solution: '4WB4W3B',
    competencyIndex: 2,
    testCases: [
      { input: 'WWWWBWWWWBBB', expected: '4WB4W3B', description: 'Encode repeated chars' }
    ]
  },
  {
    title: 'Binary Search',
    slug: 'binary-search-java',
    description: 'Implement binary search.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `public class Main {
    public static int binarySearch(int[] arr, int target) {
        // Return index or -1
        return -1;
    }
    
    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 8, 13, 21};
        System.out.println(binarySearch(arr, 8));
    }
}`,
    solution: '3',
    competencyIndex: 3,
    testCases: [
      { input: [[1, 3, 5, 8, 13, 21], 8], expected: 3, description: 'Find 8 at index 3' }
    ]
  },
  {
    title: 'Roman Numerals',
    slug: 'roman-numerals-java',
    description: 'Convert a number to a Roman numeral.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `public class Main {
    public static String toRoman(int num) {
        // Convert to Roman numeral
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(toRoman(1990));
    }
}`,
    solution: 'MCMXC',
    competencyIndex: 1,
    testCases: [
      { input: 1990, expected: 'MCMXC', description: '1990 is MCMXC' }
    ]
  },
  {
    title: 'Prime Factors',
    slug: 'prime-factors-java',
    description: 'Compute the prime factors of a given number.',
    language: 'java',
    difficulty: 'advanced',
    starterCode: `import java.util.*;

public class Main {
    public static List<Integer> primeFactors(int n) {
        // Return list of prime factors
        return new ArrayList<>();
    }
    
    public static void main(String[] args) {
        System.out.println(primeFactors(60));
    }
}`,
    solution: '[2, 2, 3, 5]',
    competencyIndex: 0,
    testCases: [
      { input: 60, expected: [2, 2, 3, 5], description: 'Prime factors of 60' }
    ]
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


