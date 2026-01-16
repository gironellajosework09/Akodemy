// Run official tests against student code using generated runners.
import { executeCode } from './judge0.js'
import {
  generateJavaScriptRunner,
  generatePythonRunner,
  generateJavaRunner
} from './canonical/runnerGenerators.js'

// Service logic for executing official tests.
function toTestCase(test) {
  const name = test.name || test.description || 'Unnamed test'
  const hasInput = Object.prototype.hasOwnProperty.call(test, 'input')
  const input = hasInput ? test.input : {}
  return {
    description: name,
    property: test.property || null,
    input,
    expected: test.expected
  }
}

function buildTestSuite(slug, tests) {
  const cases = tests
    .filter(test => Object.prototype.hasOwnProperty.call(test, 'expected'))
    .map(toTestCase)

  const defaultProperty = cases.find(testCase => testCase.property)?.property || slug

  return {
    property: defaultProperty,
    cases
  }
}

function parseRunnerOutput(result) {
  const stdout = (result.stdout || '').trim()
  const stderr = result.stderr || result.compileOutput || ''

  if (!stdout) {
    return {
      error: stderr || 'No test output received',
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      errors: [{ test: 'execution', error: stderr || 'No test output received' }],
      details: []
    }
  }

  const lines = stdout.split('\n').filter(Boolean)
  let parsed = null

  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      parsed = JSON.parse(lines[i])
      break
    } catch {}
  }

  if (!parsed) {
    return {
      error: stderr || 'Failed to parse test output',
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      errors: [{ test: 'execution', error: stderr || 'Failed to parse test output' }],
      details: []
    }
  }

  const total = parsed.total ?? 0
  const passed = parsed.passed ?? 0
  const failed = parsed.failed ?? Math.max(0, total - passed)

  return {
    totalTests: total,
    passedTests: passed,
    failedTests: failed,
    errors: parsed.errors || [],
    details: parsed.details || [],
    raw: { stdout, stderr }
  }
}

export async function runOfficialTests(userCode, language, slug, tests) {
  if (!tests || tests.length === 0) {
    return {
      error: 'No tests available',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: [],
      details: []
    }
  }

  const suite = buildTestSuite(slug, tests)
  if (suite.cases.length === 0) {
    return {
      error: 'No runnable tests available',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: [],
      details: []
    }
  }

  let runnerCode
  switch (language) {
    case 'javascript':
      runnerCode = generateJavaScriptRunner(userCode, suite, slug)
      break
    case 'python':
      runnerCode = generatePythonRunner(userCode, suite, slug)
      break
    case 'java':
      runnerCode = generateJavaRunner(userCode, suite, slug)
      break
    default:
      return {
        error: `Unsupported language: ${language}`,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errors: [],
        details: []
      }
  }

  const result = await executeCode(runnerCode, language)
  if (result.error && !result.stdout) {
    return {
      error: result.error,
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      errors: [{ test: 'execution', error: result.error }],
      details: []
    }
  }

  return parseRunnerOutput(result)
}
