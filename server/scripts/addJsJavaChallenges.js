import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Challenge from '../models/Challenge.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/akodemy'

const CHALLENGES = [
  {
    title: 'Bank Account',
    slug: 'bank-account-js',
    exerciseSlug: 'bank-account',
    description: 'Implement a simple bank account with open/close and deposit/withdraw operations.\n\nRequirements:\n- Create class `BankAccount`.\n- Methods: `open()`, `close()`, `deposit(amount)`, `withdraw(amount)`.\n- Provide `balance` getter.\n- Throw `ValueError` for invalid operations.',
    language: 'javascript',
    difficulty: 'advanced',
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
    testCases: []
  },
  {
    title: 'Robot Name',
    slug: 'robot-name-js',
    exerciseSlug: 'robot-name',
    description: 'Create a robot with a unique name.\n\nA robot name is two uppercase letters followed by three digits (e.g., "RX837").\nThe name must be generated on first access and should stay the same until reset.\n\nRequirements:\n- Create class `Robot`.\n- Provide a `name` property.\n- Implement `reset()` to assign a new unique name.\n- Implement `static releaseNames()` to clear stored names.',
    language: 'javascript',
    difficulty: 'advanced',
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
    testCases: []
  },
  {
    title: 'ISBN Verifier',
    slug: 'isbn-verifier-js',
    exerciseSlug: 'isbn-verifier',
    description: 'Verify if a string is a valid ISBN-10.\n\nAn ISBN-10 is valid if the weighted sum of its digits is divisible by 11.\nThe final digit can be "X" which represents 10.\nHyphens may appear and should be ignored.\n\nExamples:\nisValid("3-598-21508-8") → true\nisValid("3-598-21508-9") → false\n\nRequirements:\n- Implement function `isValid(isbn)`.\n- Return true/false; do not print directly.',
    language: 'javascript',
    difficulty: 'advanced',
    starterCode: `function isValid(isbn) {
  // Return true if ISBN-10 is valid
  return false;
}

// Test your solution
console.log(isValid("3-598-21508-8"));`,
    solution: '',
    competencyIndex: 5,
    testCases: []
  },
  {
    title: 'Bank Account',
    slug: 'bank-account-java',
    exerciseSlug: 'bank-account',
    description: 'Implement a simple bank account with open/close and deposit/withdraw operations.',
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
    testCases: []
  },
  {
    title: 'Robot Name',
    slug: 'robot-name-java',
    exerciseSlug: 'robot-name',
    description: 'Create a robot with a unique name that follows the pattern AA000.',
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
    testCases: []
  },
  {
    title: 'ISBN Verifier',
    slug: 'isbn-verifier-java',
    exerciseSlug: 'isbn-verifier',
    description: 'Verify if a string is a valid ISBN-10.',
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
    testCases: []
  }
]

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    for (const challenge of CHALLENGES) {
      const result = await Challenge.updateOne(
        { slug: challenge.slug, language: challenge.language },
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
