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
    slug: 'hello-world-java',
    description: 'Write a method that returns the string "Hello, World!".\n\nExample:\ngetGreeting() → "Hello, World!"\n\nRequirements:\n- Implement method `getGreeting()` in class `Greeter`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'two-fer-java',
    description: 'Create a sentence of the form "One for X, one for me."\n\nWhere X is the given name. If the name is missing, use "you" instead.\n\nExamples:\ntwofer("Alice") → "One for Alice, one for me."\ntwofer(null) → "One for you, one for me."\n\nRequirements:\n- Implement method `twofer(String name)` in class `Twofer`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'leap-java',
    description: 'Determine whether a year is a leap year.\n\nA leap year occurs:\n- On every year divisible by 4\n- Except years divisible by 100\n- Unless the year is also divisible by 400\n\nExamples:\nisLeapYear(2000) → true\nisLeapYear(1900) → false\nisLeapYear(2024) → true\n\nRequirements:\n- Implement method `isLeapYear(int year)` in class `Leap`.\n- Return true/false; do not print directly.'
  },
  {
    slug: 'reverse-string-java',
    description: 'Reverse a string.\n\nExamples:\nreverse("hello") → "olleh"\nreverse("robot") → "tobor"\n\nRequirements:\n- Implement method `reverse(String input)` in class `ReverseString`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'resistor-color-java',
    description: 'Resistors have color coded bands. Return the numeric value of a color.\n\nColors: black=0, brown=1, red=2, orange=3, yellow=4, green=5, blue=6, violet=7, grey=8, white=9\n\nExamples:\ncolorCode("black") → 0\ncolorCode("brown") → 1\n\nRequirements:\n- Implement methods `colorCode(String color)` and `colors()` in class `ResistorColor`.\n- `colors()` should return the color list in order.\n- Return values; do not print directly.'
  },
  {
    slug: 'resistor-java',
    description: 'Resistors have color coded bands. Return the numeric value of a color.\n\nColors: black=0, brown=1, red=2, orange=3, yellow=4, green=5, blue=6, violet=7, grey=8, white=9\n\nExamples:\ncolorCode("black") → 0\ncolorCode("brown") → 1\n\nRequirements:\n- Implement methods `colorCode(String color)` and `colors()` in class `ResistorColor`.\n- `colors()` should return the color list in order.\n- Return values; do not print directly.'
  },
  {
    slug: 'hamming-java',
    description: 'Calculate the Hamming distance between two DNA strands.\n\nThe Hamming distance is the number of positions where the corresponding characters differ.\n\nExample:\nnew Hamming("GAGCCTACTAACGGGAT", "CATCGTAATGACGGCCT").getHammingDistance() → 7\n\nRequirements:\n- Implement constructor `Hamming(String left, String right)`.\n- Implement method `getHammingDistance()`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'isogram-java',
    description: 'Determine if a word is an isogram (no repeating letters).\n\nExamples:\nisIsogram("lumberjacks") → true\nisIsogram("isograms") → false\n\nRequirements:\n- Implement method `isIsogram(String word)` in class `IsogramChecker`.\n- Return true/false; do not print directly.'
  },
  {
    slug: 'pangram-java',
    description: 'Determine if a sentence is a pangram (contains every letter of the alphabet).\n\nExample:\nisPangram("The quick brown fox jumps over the lazy dog") → true\n\nRequirements:\n- Implement method `isPangram(String sentence)` in class `PangramChecker`.\n- Return true/false; do not print directly.'
  },
  {
    slug: 'rna-java',
    description: 'Given a DNA strand, return its RNA complement.\n\nDNA to RNA: G→C, C→G, T→A, A→U\n\nExamples:\ntranscribe("GCTA") → "CGAU"\n\nRequirements:\n- Implement method `transcribe(String dna)` in class `RnaTranscription`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'difference-squares-java',
    description: 'Find the difference between the square of the sum and the sum of the squares.\n\nExample for 1..10:\n(1+2+...+10)² - (1²+2²+...+10²) = 2640\n\nRequirements:\n- Implement methods `computeSquareOfSumTo(int n)`, `computeSumOfSquaresTo(int n)`, `computeDifferenceOfSquares(int n)` in class `DifferenceOfSquaresCalculator`.\n- Return values; do not print directly.'
  },
  {
    slug: 'anagram-java',
    description: 'Given a word and a list of candidates, find all anagrams.\n\nAn anagram uses all original letters exactly once.\n\nExample:\nnew Anagram("listen").match(List.of("enlist", "google", "silent")) → ["enlist", "silent"]\n\nRequirements:\n- Implement constructor `Anagram(String source)`.\n- Implement method `match(List<String> candidates)`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'rle-java',
    description: 'Implement run-length encoding and decoding.\n\nConsecutive identical characters are encoded as count + character.\n\nExamples:\nencode("WWWWBWWWWBBB") → "4WB4W3B"\ndecode("4WB4W3B") → "WWWWBWWWWBBB"\n\nRequirements:\n- Implement methods `encode(String input)` and `decode(String input)` in class `RunLengthEncoding`.\n- Return values; do not print directly.'
  },
  {
    slug: 'binary-search-java',
    description: 'Implement binary search to find a value in a sorted list.\n\nReturn the index of the value, or throw `ValueNotFoundException` if not found.\n\nExample:\nnew BinarySearch(List.of(1, 3, 5, 8, 13, 21)).indexOf(8) → 3\n\nRequirements:\n- Implement constructor `BinarySearch(List<Integer> list)`.\n- Implement method `indexOf(int value)`.\n- Return the index; do not print directly.'
  },
  {
    slug: 'roman-numerals-java',
    description: 'Convert a number to a Roman numeral.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000\n\nExample:\nnew RomanNumerals(1990).getRomanNumeral() → "MCMXC"\n\nRequirements:\n- Implement constructor `RomanNumerals(int number)`.\n- Implement method `getRomanNumeral()`.\n- Return the value; do not print directly.'
  },
  {
    slug: 'prime-factors-java',
    description: 'Compute the prime factors of a given number.\n\nExample:\ncalculatePrimeFactorsOf(60) → [2, 2, 3, 5]\n\nRequirements:\n- Implement method `calculatePrimeFactorsOf(long number)` in class `PrimeFactorsCalculator`.\n- Return a list of prime factors; do not print directly.'
  },
  {
    slug: 'bank-account-java',
    description: 'Implement a simple bank account with open/close and deposit/withdraw operations.\n\nRequirements:\n- Implement class `BankAccount` with `open()`, `close()`, `deposit(int amount)`, `withdraw(int amount)`, `getBalance()`.\n- Throw `BankAccountActionInvalidException` for invalid operations (closed account, negative amounts, insufficient funds).\n- Protect account state (encapsulation).'
  },
  {
    slug: 'robot-name-java',
    description: 'Create a robot with a unique name.\n\nA robot name is two uppercase letters followed by three digits (e.g., "RX837"). The name must be generated on first access and should stay the same until reset.\n\nRequirements:\n- Implement class `Robot` with `getName()` and `reset()`.\n- Return values; do not print directly.'
  },
  {
    slug: 'isbn-verifier-java',
    description: 'Verify if a string is a valid ISBN-10.\n\nAn ISBN-10 is valid if the weighted sum of its digits is divisible by 11. The final digit can be "X" which represents 10. Hyphens may appear and should be ignored.\n\nExamples:\nisValid("3-598-21508-8") → true\nisValid("3-598-21508-9") → false\n\nRequirements:\n- Implement method `isValid(String stringToVerify)` in class `IsbnVerifier`.\n- Return true/false; do not print directly.'
  }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'java' },
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
