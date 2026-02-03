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
    exerciseSlug: 'hello-world',
    starterCode: `public class Greeter {
    public String getGreeting() {
        // Return "Hello, World!"
        return "";
    }
}`
  },
  {
    slug: 'two-fer-java',
    exerciseSlug: 'two-fer',
    starterCode: `public class Twofer {
    public String twofer(String name) {
        // Return "One for [name], one for me."
        return "";
    }
}`
  },
  {
    slug: 'leap-java',
    exerciseSlug: 'leap',
    starterCode: `public class Leap {
    public boolean isLeapYear(int year) {
        // Return true if leap year
        return false;
    }
}`
  },
  {
    slug: 'reverse-string-java',
    exerciseSlug: 'reverse-string',
    starterCode: `public class ReverseString {
    public String reverse(String input) {
        // Return reversed string
        return "";
    }
}`
  },
  {
    slug: 'resistor-java',
    exerciseSlug: 'resistor-color',
    starterCode: `public class ResistorColor {
    public int colorCode(String color) {
        // Return numeric value for color
        return -1;
    }

    public String[] colors() {
        // Return the color array
        return new String[] {};
    }
}`
  },
  {
    slug: 'resistor-color-java',
    exerciseSlug: 'resistor-color',
    starterCode: `public class ResistorColor {
    public int colorCode(String color) {
        // Return numeric value for color
        return -1;
    }

    public String[] colors() {
        // Return the color array
        return new String[] {};
    }
}`
  },
  {
    slug: 'difference-squares-java',
    exerciseSlug: 'difference-of-squares',
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
}`
  },
  {
    slug: 'hamming-java',
    exerciseSlug: 'hamming',
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
}`
  },
  {
    slug: 'isogram-java',
    exerciseSlug: 'isogram',
    starterCode: `public class IsogramChecker {
    public boolean isIsogram(String word) {
        // Return true if no repeating letters
        return false;
    }
}`
  },
  {
    slug: 'pangram-java',
    exerciseSlug: 'pangram',
    starterCode: `public class PangramChecker {
    public boolean isPangram(String sentence) {
        // Return true if contains all letters
        return false;
    }
}`
  },
  {
    slug: 'rna-java',
    exerciseSlug: 'rna-transcription',
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
}`
  },
  {
    slug: 'anagram-java',
    exerciseSlug: 'anagram',
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
}`
  },
  {
    slug: 'binary-search-java',
    exerciseSlug: 'binary-search',
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
`
  },
  {
    slug: 'prime-factors-java',
    exerciseSlug: 'prime-factors',
    starterCode: `import java.util.ArrayList;
import java.util.List;

public class PrimeFactorsCalculator {
    public List<Long> calculatePrimeFactorsOf(long number) {
        // Return list of prime factors
        return new ArrayList<>();
    }
}`
  },
  {
    slug: 'roman-numerals-java',
    exerciseSlug: 'roman-numerals',
    starterCode: `public class RomanNumerals {
    private final int number;

    public RomanNumerals(int number) {
        this.number = number;
    }

    public String getRomanNumeral() {
        // Convert to Roman numeral
        return "";
    }
}`
  },
  {
    slug: 'rle-java',
    exerciseSlug: 'run-length-encoding',
    starterCode: `public class RunLengthEncoding {
    public String encode(String input) {
        // Return run-length encoded string
        return "";
    }

    public String decode(String input) {
        // Return decoded string
        return "";
    }
}`
  },
  {
    slug: 'bank-account-java',
    exerciseSlug: 'bank-account',
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
}`
  },
  {
    slug: 'robot-name-java',
    exerciseSlug: 'robot-name',
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
}`
  },
  {
    slug: 'isbn-verifier-java',
    exerciseSlug: 'isbn-verifier',
    starterCode: `class IsbnVerifier {
    public boolean isValid(String stringToVerify) {
        // Return true if ISBN-10 is valid
        return false;
    }
}`
  }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const update of UPDATES) {
      const result = await Challenge.updateOne(
        { slug: update.slug, language: 'java' },
        {
          $set: {
            exerciseSlug: update.exerciseSlug,
            starterCode: update.starterCode
          }
        }
      )

      if (result.matchedCount > 0) {
        console.log(`Updated: ${update.slug}`)
      } else {
        console.log(`Skipped (not found): ${update.slug}`)
      }
    }

    const challenges = await Challenge.find({ language: 'java' }).select('slug starterCode')
    let wrapped = 0
    for (const challenge of challenges) {
      if (!challenge.starterCode) continue

      let updatedStarter = challenge.starterCode.trim()
      const hasMain = /\bclass\s+Main\b/.test(updatedStarter)

      if (!hasMain) {
        updatedStarter = `${updatedStarter}

public class Main {
    public static void main(String[] args) {
        // Add your own test calls here
    }
}
`
      } else {
        updatedStarter = updatedStarter.replace(/\bclass\s+Main\b/, 'public class Main')
      }

      // Ensure only Main is public.
      updatedStarter = updatedStarter.replace(/public\s+class\s+(?!Main\b)/g, 'class ')

      if (updatedStarter !== challenge.starterCode.trim()) {
        await Challenge.updateOne(
          { _id: challenge._id },
          { $set: { starterCode: updatedStarter } }
        )
        wrapped++
      }
    }

    console.log(`Updated ${wrapped} Java starter templates with public Main`)
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
