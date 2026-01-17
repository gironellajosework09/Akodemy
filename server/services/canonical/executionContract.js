export const EXECUTION_CONTRACT = {
  inputs: {
    codeFormat: 'function-based',
    signatureStyle: {
      javascript: 'function functionName(arg1, arg2) { ... } or const functionName = (arg1, arg2) => { ... }',
      python: 'def function_name(arg1, arg2): ...',
      java: 'public ReturnType methodName(Type1 arg1, Type2 arg2) { ... }'
    },
    inputOrder: 'canonical_order',
    inputNormalization: {
      strings: 'exact_match',
      numbers: 'strict_equality',
      floats: 'epsilon_comparison_disabled',
      arrays: 'order_sensitive',
      objects: 'key_order_insensitive'
    }
  },
  outputs: {
    format: 'return_value',
    comparison: {
      strings: 'exact_match',
      numbers: 'strict_equality',
      floats: 'epsilon_comparison_disabled',
      booleans: 'strict_equality',
      arrays: 'deep_equal_order_sensitive',
      objects: 'deep_equal_key_order_insensitive',
      null: 'strict_null_check',
      undefined: 'treat_as_null'
    },
    whitespace: {
      trim: false,
      normalize: false
    }
  },
  errors: {
    expectedException: {
      scoring: 'pass_if_thrown',
      matchMessage: false
    },
    unexpectedException: {
      scoring: 'fail',
      captureMessage: true
    },
    compileError: {
      scoring: 'zero',
      captureMessage: true
    },
    timeout: {
      scoring: 'zero',
      defaultLimitMs: 10000
    },
    runtimeError: {
      scoring: 'fail_test',
      captureStackTrace: false
    }
  },
  determinism: {
    randomSeed: 'fixed_or_mocked',
    dateTime: 'fixed_or_mocked',
    ordering: 'stable_sort_required',
    floatingPoint: 'strict_ieee754'
  },
  performance: {
    timeLimitMs: 10000,
    memoryLimitKb: 128000,
    perTestTimeout: false,
    scoringImpact: 'none'
  },
  scoring: {
    formula: 'passed_tests / total_tests * 100',
    rounding: 'round_to_integer',
    partialCredit: true,
    minimumScore: 0,
    maximumScore: 100
  }
}

export function validateExecutionContract(testCase) {
  const issues = []

  if (!testCase.uuid) {
    issues.push({ field: 'uuid', message: 'Missing required uuid' })
  }

  if (!testCase.description) {
    issues.push({ field: 'description', message: 'Missing required description' })
  }

  if (!testCase.property) {
    issues.push({ field: 'property', message: 'Missing required property (function name)' })
  }

  if (testCase.input === undefined) {
    issues.push({ field: 'input', message: 'Missing input specification' })
  }

  if (testCase.expected === undefined) {
    issues.push({ field: 'expected', message: 'Missing expected value' })
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

export function computeScore(passedCount, totalCount) {
  if (totalCount === 0) return 0
  const raw = (passedCount / totalCount) * 100
  return Math.round(raw)
}

export function deepEqual(a, b) {
  if (a === b) return true
  
  if (a === null && b === undefined) return true
  if (a === undefined && b === null) return true
  if (a === null || b === null) return a === b
  
  if (typeof a !== typeof b) return false
  
  if (typeof a === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true
    return a === b
  }
  
  if (typeof a !== 'object') return a === b
  
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  
  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()
  if (keysA.length !== keysB.length) return false
  if (!keysA.every((k, i) => k === keysB[i])) return false
  
  return keysA.every(k => deepEqual(a[k], b[k]))
}

export function isErrorExpected(expected) {
  return expected !== null && 
         typeof expected === 'object' && 
         expected.error !== undefined
}

export function formatTestResult(testCase, actual, error = null) {
  const result = {
    uuid: testCase.uuid,
    description: testCase.description,
    property: testCase.property,
    passed: false,
    expected: testCase.expected,
    actual: null,
    error: null
  }

  if (error) {
    if (isErrorExpected(testCase.expected)) {
      result.passed = true
      result.actual = `Error thrown: ${error}`
    } else {
      result.passed = false
      result.error = error
    }
  } else {
    if (isErrorExpected(testCase.expected)) {
      result.passed = false
      result.actual = actual
      result.error = 'Expected error but function returned successfully'
    } else {
      result.passed = deepEqual(actual, testCase.expected)
      if (!result.passed) {
        result.actual = actual
      }
    }
  }

  return result
}

export function aggregateResults(testResults) {
  const total = testResults.length
  const passed = testResults.filter(r => r.passed).length
  const failed = total - passed
  const score = computeScore(passed, total)

  return {
    total,
    passed,
    failed,
    score,
    details: testResults.map(r => ({
      uuid: r.uuid,
      description: r.description,
      passed: r.passed,
      expected: r.passed ? undefined : r.expected,
      actual: r.passed ? undefined : r.actual,
      error: r.error
    }))
  }
}

export const COMPETENCY_THRESHOLDS = [
  { min: 90, name: 'Mastered', color: 'green' },
  { min: 75, name: 'Proficient', color: 'blue' },
  { min: 50, name: 'Developing', color: 'yellow' },
  { min: 0, name: 'Not Started', color: 'red' }
]

export function getCompetency(score) {
  for (const level of COMPETENCY_THRESHOLDS) {
    if (score >= level.min) return level
  }
  return COMPETENCY_THRESHOLDS[COMPETENCY_THRESHOLDS.length - 1]
}
