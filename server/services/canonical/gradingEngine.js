import { getTestCases } from './testFetcher.js'
import { 
  generateJavaScriptRunner, 
  generatePythonRunner, 
  generateJavaRunner 
} from './runnerGenerators.js'
import { executeCode } from '../judge0.js'
import Challenge from '../../models/Challenge.js'

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62
}

const COMPETENCY_THRESHOLDS = [
  { min: 90, name: 'Mastered', color: 'green' },
  { min: 75, name: 'Proficient', color: 'blue' },
  { min: 50, name: 'Developing', color: 'yellow' },
  { min: 0, name: 'Not Started', color: 'red' }
]

function getCompetency(score) {
  for (const level of COMPETENCY_THRESHOLDS) {
    if (score >= level.min) return level
  }
  return COMPETENCY_THRESHOLDS[COMPETENCY_THRESHOLDS.length - 1]
}

async function getTestCasesFromDB(exerciseSlug, language) {
  const challenge = await Challenge.findOne({ 
    exercismSlug: exerciseSlug, 
    language 
  })
  
  if (challenge && challenge.canonicalTests && challenge.canonicalTests.length > 0) {
    console.log(`Using stored canonical tests for ${exerciseSlug} (${language})`)
    return {
      exercise: exerciseSlug,
      property: challenge.canonicalTests[0]?.property || exerciseSlug,
      cases: challenge.canonicalTests.map(tc => ({
        uuid: tc.uuid,
        description: tc.description,
        property: tc.property,
        input: tc.input,
        expected: tc.expected
      }))
    }
  }
  
  return null
}

export async function gradeSubmission(code, language, exerciseSlug) {
  if (!LANGUAGE_IDS[language]) {
    throw new Error(`Unsupported language: ${language}. Supported: javascript, python, java`)
  }
  
  const normalizedSlug = exerciseSlug
    .replace(/-(?:javascript|python|java)$/i, '')
    .replace(/-(?:js|py)$/i, '')
  
  console.log(`Grading ${normalizedSlug} (${language})...`)
  
  let testCases = await getTestCasesFromDB(normalizedSlug, language)
  
  if (!testCases) {
    console.log(`No stored tests found, fetching from GitHub...`)
    testCases = await getTestCases(normalizedSlug)
  }
  
  if (!testCases.cases || testCases.cases.length === 0) {
    throw new Error(`No test cases found for exercise: ${normalizedSlug}`)
  }
  
  console.log(`Found ${testCases.cases.length} test cases`)
  
  let runnerCode
  switch (language) {
    case 'javascript':
      runnerCode = generateJavaScriptRunner(code, testCases, normalizedSlug)
      break
    case 'python':
      runnerCode = generatePythonRunner(code, testCases, normalizedSlug)
      break
    case 'java':
      runnerCode = generateJavaRunner(code, testCases, normalizedSlug)
      break
  }
  
  console.log(`Generated runner code (${runnerCode.length} chars)`)
  
  const result = await executeCode(runnerCode, LANGUAGE_IDS[language])
  
  if (result.error) {
    console.error('Execution error:', result.error)
    return {
      exercise: normalizedSlug,
      language,
      total: testCases.cases.length,
      passed: 0,
      score: 0,
      competency: 'Not Started',
      error: result.error,
      details: []
    }
  }
  
  const output = result.stdout?.trim()
  
  if (!output) {
    console.error('No output received from Judge0')
    return {
      exercise: normalizedSlug,
      language,
      total: testCases.cases.length,
      passed: 0,
      score: 0,
      competency: 'Not Started',
      error: result.stderr || 'No output from code execution',
      details: []
    }
  }
  
  let parsedResult
  try {
    parsedResult = JSON.parse(output)
  } catch (parseError) {
    console.error('Failed to parse output:', output)
    return {
      exercise: normalizedSlug,
      language,
      total: testCases.cases.length,
      passed: 0,
      score: 0,
      competency: 'Not Started',
      error: `Failed to parse test output: ${output.substring(0, 200)}`,
      details: []
    }
  }
  
  const competency = getCompetency(parsedResult.score || 0)
  
  return {
    exercise: normalizedSlug,
    language,
    total: parsedResult.total || testCases.cases.length,
    passed: parsedResult.passed || 0,
    score: parsedResult.score || 0,
    competency: competency.name,
    competencyColor: competency.color,
    details: parsedResult.details || []
  }
}
