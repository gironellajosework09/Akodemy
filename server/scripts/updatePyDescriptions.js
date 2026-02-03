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
    slug: 'hello-world-py',
    description: 'Write a function that returns the string "Hello, World!".\n\nExample:\nhello_world() → "Hello, World!"\n\nRequirements:\n- Implement function `hello_world()`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'two-fer-py',
    description: 'Create a sentence of the form "One for X, one for me."\n\nWhere X is the given name. However, if the name is missing, use "you" instead.\n\nExamples:\ntwo_fer("Alice") → "One for Alice, one for me."\ntwo_fer() → "One for you, one for me."\n\nRequirements:\n- Implement function `two_fer(name=None)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'leap-py',
    description: 'Determine whether a year is a leap year.\n\nA leap year occurs on every year divisible by 4, except years divisible by 100, unless also divisible by 400.\n\nExamples:\nis_leap(2000) → True\nis_leap(1900) → False\nis_leap(2024) → True\n\nRequirements:\n- Implement function `is_leap(year)`.\n- Return True/False; do not print directly.'
  },
  {
    slug: 'reverse-string-py',
    description: 'Reverse a string.\n\nExample:\nreverse_string("hello") → "olleh"\n\nRequirements:\n- Implement function `reverse_string(s)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'sum-multiples-py',
    description: 'Find the sum of all unique multiples of given factors below a limit.\n\nExample:\nsum_of_multiples(20, [3, 5]) → 78\n\nRequirements:\n- Implement function `sum_of_multiples(limit, factors)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'hamming-py',
    description: 'Calculate the Hamming distance between two DNA strands.\n\nThe Hamming distance is the number of positions where the corresponding characters differ.\n\nExample:\nhamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT") → 7\n\nRequirements:\n- Implement function `hamming(strand1, strand2)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'isogram-py',
    description: 'Determine if a word is an isogram (no repeating letters).\n\nExamples:\nis_isogram("lumberjacks") → True\nis_isogram("isograms") → False\n\nRequirements:\n- Implement function `is_isogram(word)`.\n- Return True/False; do not print directly.'
  },
  {
    slug: 'pangram-py',
    description: 'Determine if a sentence is a pangram (contains every letter of the alphabet).\n\nExample:\nis_pangram("The quick brown fox jumps over the lazy dog") → True\n\nRequirements:\n- Implement function `is_pangram(sentence)`.\n- Return True/False; do not print directly.'
  },
  {
    slug: 'rna-py',
    description: 'Given a DNA strand, return its RNA complement.\n\nDNA to RNA: G→C, C→G, T→A, A→U\n\nExample:\nto_rna("GCTA") → "CGAU"\n\nRequirements:\n- Implement function `to_rna(dna)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'triangle-py',
    description: 'Determine if three sides form a valid triangle, and what type.\n\nReturn "equilateral", "isosceles", "scalene", or "invalid".\n\nExample:\ntriangle_type(3, 3, 3) → "equilateral"\n\nRequirements:\n- Implement function `triangle_type(a, b, c)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'isbn-verifier-py',
    description: 'Verify if a string is a valid ISBN-10.\n\nAn ISBN-10 is valid if the weighted sum of its digits is divisible by 11.\nThe final digit can be "X" which represents 10.\nHyphens may appear and should be ignored.\n\nExamples:\nis_valid("3-598-21508-8") → True\nis_valid("3-598-21508-9") → False\n\nRequirements:\n- Implement function `is_valid(isbn)`.\n- Return True/False; do not print directly.'
  },
  {
    slug: 'bank-account-py',
    description: 'Implement a simple bank account with open/close and deposit/withdraw operations.\n\nRequirements:\n- Create class `BankAccount`.\n- Methods: `open()`, `close()`, `deposit(amount)`, `withdraw(amount)`, `get_balance()`.\n- Raise `ValueError` for invalid operations (closed account, negative amounts, insufficient funds).'
  },
  {
    slug: 'anagram-py',
    description: 'Given a word and a list of candidates, find all anagrams.\n\nExample:\nfind_anagrams("listen", ["enlist", "google", "silent"]) → ["enlist", "silent"]\n\nRequirements:\n- Implement function `find_anagrams(word, candidates)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'binary-search-py',
    description: 'Implement binary search to find a value in a sorted list.\n\nExample:\nbinary_search([1, 3, 5, 8, 13, 21], 8) → 3\n\nRequirements:\n- Implement function `binary_search(arr, target)`.\n- Return the index or -1; do not print directly.'
  },
  {
    slug: 'flatten-py',
    description: 'Flatten a nested array and remove None values.\n\nExample:\nflatten([1, [2, 3, None, 4], [[5]], [[[6]]]]) → [1, 2, 3, 4, 5, 6]\n\nRequirements:\n- Implement function `flatten(arr)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'roman-numerals-py',
    description: 'Convert a number to a Roman numeral.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000\n\nExample:\nto_roman(1990) → "MCMXC"\n\nRequirements:\n- Implement function `to_roman(num)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'rle-py',
    description: 'Implement run-length encoding and decoding.\n\nConsecutive identical characters are encoded as count + character.\n\nExamples:\nencode("WWWWBWWWWBBB") → "4WB4W3B"\ndecode("4WB4W3B") → "WWWWBWWWWBBB"\n\nRequirements:\n- Implement function `encode(s)`.\n- Implement function `decode(s)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'robot-name-py',
    description: 'Create a robot with a unique name.\n\nA robot name is two uppercase letters followed by three digits (e.g., "RX837").\nThe name must be generated on first access and should stay the same until reset.\n\nRequirements:\n- Create class `Robot`.\n- Provide a `name` attribute.\n- Implement `reset()` to assign a new unique name.'
  }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'python' },
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
