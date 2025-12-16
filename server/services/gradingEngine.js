import { fetchTests } from './github/testFetcher.js'
import { getRunner, getCompetencyLevel } from './runners/index.js'

export async function runTests(language, exercisePath, userCode) {
  const runner = getRunner(language)
  
  const testData = await fetchTests(language, exercisePath)
  
  if (!testData) {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: [{ test: 'setup', error: `Could not fetch tests for ${exercisePath}` }],
      details: []
    }
  }
  
  return await runner.run(userCode, testData.content, exercisePath)
}

export function gradeResults(testOutput, exercise, language) {
  const { totalTests, passedTests, failedTests, errors, details } = testOutput
  
  const passRate = totalTests > 0 ? passedTests / totalTests : 0
  const competency = getCompetencyLevel(passRate)
  
  return {
    exercise,
    language,
    totalTests,
    passedTests,
    failedTests,
    passRate: Math.round(passRate * 100) / 100,
    competency: competency.name,
    score: Math.round(passRate * 100),
    errors: errors || [],
    details: details || []
  }
}

export async function gradeSubmission(userCode, language, exerciseSlug) {
  const normalizedSlug = exerciseSlug
    .replace(/-(?:javascript|python|java)$/i, '')
    .replace(/-(?:js|py)$/i, '')
  
  try {
    const testOutput = await runTests(language, normalizedSlug, userCode)
    return gradeResults(testOutput, normalizedSlug, language)
  } catch (error) {
    console.error('Grading error:', error)
    return {
      exercise: normalizedSlug,
      language,
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      passRate: 0,
      competency: 'Not Started',
      score: 0,
      errors: [{ test: 'grading', error: error.message }],
      details: []
    }
  }
}

export { fetchTests } from './github/testFetcher.js'
export { getRunner, getCompetencyLevel } from './runners/index.js'
