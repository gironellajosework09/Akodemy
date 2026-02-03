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
    description: 'Write a function that returns the string "Hello, World!".\n\nExample:\nhello() → "Hello, World!"\n\nRequirements:\n- Implement function `hello()`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'two-fer-js',
    description: 'Create a sentence of the form "One for X, one for me."\n\nWhere X is the given name. However, if the name is missing, use "you" instead.\n\nExamples:\ntwoFer("Alice") → "One for Alice, one for me."\ntwoFer() → "One for you, one for me."\n\nRequirements:\n- Implement function `twoFer(name)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'leap-js',
    description: 'Determine whether a year is a leap year.\n\nA leap year occurs:\n- On every year divisible by 4\n- Except years divisible by 100\n- Unless the year is also divisible by 400\n\nExamples:\nisLeap(2000) → true\nisLeap(1900) → false\nisLeap(2024) → true\n\nRequirements:\n- Implement function `isLeap(year)`.\n- Return true/false; do not print directly.'
  },
  {
    slug: 'reverse-string-js',
    description: 'Reverse a string.\n\nExamples:\nreverseString("hello") → "olleh"\nreverseString("robot") → "tobor"\n\nRequirements:\n- Implement function `reverseString(str)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'resistor-color-js',
    description: 'Resistors have color coded bands. Return the numeric value of a color.\n\nColors: black=0, brown=1, red=2, orange=3, yellow=4, green=5, blue=6, violet=7, grey=8, white=9\n\nExamples:\ncolorCode("black") → 0\ncolorCode("brown") → 1\n\nRequirements:\n- Implement function `colorCode(color)`.\n- Define constant `COLORS` with the color list in order.\n- Return the value; do not print directly.'
  },
  {
    slug: 'hamming-js',
    description: 'Calculate the Hamming distance between two DNA strands.\n\nThe Hamming distance is the number of positions where the corresponding characters differ.\n\nExamples:\ncompute("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT") → 7\n\nRequirements:\n- Implement function `compute(strand1, strand2)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'isogram-js',
    description: 'Determine if a word is an isogram (no repeating letters).\n\nExamples:\nisIsogram("lumberjacks") → true\nisIsogram("isograms") → false\n\nRequirements:\n- Implement function `isIsogram(word)`.\n- Return true/false; do not print directly.'
  },
  {
    slug: 'pangram-js',
    description: 'Determine if a sentence is a pangram (contains every letter of the alphabet).\n\nExample:\nisPangram("The quick brown fox jumps over the lazy dog") → true\n\nRequirements:\n- Implement function `isPangram(sentence)`.\n- Return true/false; do not print directly.'
  },
  {
    slug: 'rna-transcription-js',
    description: 'Given a DNA strand, return its RNA complement.\n\nDNA to RNA: G→C, C→G, T→A, A→U\n\nExamples:\ntoRna("GCTA") → "CGAU"\n\nRequirements:\n- Implement function `toRna(dna)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'space-age-js',
    description: 'Calculate how old someone would be on different planets.\n\nEarth year = 365.25 days. Planet orbital periods (Earth years):\nMercury: 0.2408467, Venus: 0.61519726, Mars: 1.8808158, Jupiter: 11.862615\n\nExample:\nage("earth", 1000000000) → 31.69 (seconds to years)\n\nRequirements:\n- Implement function `age(planet, seconds)`.\n- Return the value (rounded to 2 decimals); do not print directly.'
  },
  {
    slug: 'anagram-js',
    description: 'Given a word and a list of candidates, find all anagrams.\n\nAn anagram uses all original letters exactly once.\n\nExample:\nfindAnagrams("listen", ["enlist", "google", "silent"]) → ["enlist", "silent"]\n\nRequirements:\n- Implement function `findAnagrams(word, candidates)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'binary-search-js',
    description: 'Implement binary search to find a value in a sorted array.\n\nReturn the index of the value, or -1 if not found.\n\nExample:\nfind([1, 3, 5, 8, 13, 21], 8) → 3\n\nRequirements:\n- Implement function `find(arr, target)`.\n- Return the index or -1; do not print directly.'
  },
  {
    slug: 'flatten-array-js',
    description: 'Flatten a nested array and remove null/undefined values.\n\nExample:\nflatten([1, [2, 3, null, 4], [[5]], [[[6]]]]) → [1, 2, 3, 4, 5, 6]\n\nRequirements:\n- Implement function `flatten(arr)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'roman-numerals-js',
    description: 'Convert a number to a Roman numeral.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000\n\nExample:\ntoRoman(1990) → "MCMXC"\n\nRequirements:\n- Implement function `toRoman(num)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'rle-js',
    description: 'Implement run-length encoding and decoding.\n\nConsecutive identical characters are encoded as count + character.\n\nExamples:\nencode("WWWWBWWWWBBB") → "4WB4W3B"\ndecode("4WB4W3B") → "WWWWBWWWWBBB"\n\nRequirements:\n- Implement function `encode(str)`.\n- Implement function `decode(str)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'bank-account-js',
    description: 'Implement a simple bank account with open/close and deposit/withdraw operations.\n\nRequirements:\n- Create class `BankAccount`.\n- Methods: `open()`, `close()`, `deposit(amount)`, `withdraw(amount)`.\n- Provide `balance` getter.\n- Throw `ValueError` for invalid operations.'
  },
  {
    slug: 'robot-name-js',
    description: 'Create a robot with a unique name.\n\nA robot name is two uppercase letters followed by three digits (e.g., "RX837").\nThe name must be generated on first access and should stay the same until reset.\n\nRequirements:\n- Create class `Robot`.\n- Provide a `name` property.\n- Implement `reset()` to assign a new unique name.\n- Implement `static releaseNames()` to clear stored names.'
  },
  {
    slug: 'isbn-verifier-js',
    description: 'Verify if a string is a valid ISBN-10.\n\nAn ISBN-10 is valid if the weighted sum of its digits is divisible by 11.\nThe final digit can be "X" which represents 10.\nHyphens may appear and should be ignored.\n\nExamples:\nisValid("3-598-21508-8") → true\nisValid("3-598-21508-9") → false\n\nRequirements:\n- Implement function `isValid(isbn)`.\n- Return true/false; do not print directly.'
  }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'javascript' },
        { $set: { description: update.description } }
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
