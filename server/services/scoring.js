// Scoring helpers for test results.
import { runTests, runTestsWithCanonicalData } from './testRunner.js'

// Service logic for Scoring.
export const calculateScore = async (userCode, language, challengeId = null, testCases = []) => {
  try {
    let result
    
    if (challengeId) {
      result = await runTests(userCode, language, challengeId, testCases)
    } else if (testCases && testCases.length > 0) {
      result = await runTestsWithCanonicalData(userCode, language, testCases)
    } else {
      return {
        passed: 0,
        total: 0,
        score: 0,
        results: [],
        error: 'No challenge ID or test cases provided'
      }
    }
    
    return {
      passed: result.passed,
      total: result.total,
      score: result.score,
      results: result.results || [],
      error: result.error || null
    }
    
  } catch (error) {
    console.error('Scoring error:', error)
    return {
      passed: 0,
      total: 1,
      score: 0,
      results: [],
      error: error.message
    }
  }
}

export default { calculateScore }



