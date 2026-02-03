// Minimal script to exercise the Error Humanizer with sample Judge0 errors.
import dotenv from 'dotenv'
import { humanizeJudge0Error } from '../services/errorHumanizer.js'

dotenv.config()

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. The script will return fallback output.')
}

const samples = [
  {
    name: 'Syntax Error (compile)',
    judge0Result: {
      status: { id: 6, description: 'Compilation Error' },
      compile_output: "Main.java:3: error: ';' expected\nSystem.out.println(\"hi\")\n        ^\n1 error",
      stderr: '',
      message: '',
      exit_code: 1
    },
    context: {
      language: 'java',
      challengeTitle: 'Hello Printer',
      difficulty: 'beginner'
    }
  },
  {
    name: 'Runtime Error',
    judge0Result: {
      status: { id: 11, description: 'Runtime Error (NZEC)' },
      compile_output: '',
      stderr: 'Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print(x)\nNameError: name \'x\' is not defined',
      message: '',
      exit_code: 1
    },
    context: {
      language: 'python',
      challengeTitle: 'Variable Basics',
      difficulty: 'beginner'
    }
  },
  {
    name: 'Time Limit',
    judge0Result: {
      status: { id: 5, description: 'Time Limit Exceeded' },
      compile_output: '',
      stderr: '',
      message: 'Execution timed out',
      exit_code: 1
    },
    context: {
      language: 'javascript',
      challengeTitle: 'Loop Optimization',
      difficulty: 'intermediate'
    }
  }
]

async function run() {
  for (const sample of samples) {
    const feedback = await humanizeJudge0Error(sample.judge0Result, sample.context)
    console.log(`\n=== ${sample.name} ===`)
    console.log(JSON.stringify(feedback, null, 2))
  }
}

run().catch((error) => {
  console.error('Error running humanizer samples:', error.message)
  process.exit(1)
})
