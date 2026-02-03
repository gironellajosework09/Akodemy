// Express routes for Execute endpoints.
import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { executeCode } from '../services/judge0.js'
import { humanizeJudge0Error } from '../services/errorHumanizer.js'
import { runOfficialTests } from '../services/officialTestsRunner.js'
import { normalizeToExercismSlug, readTestFile } from '../services/exercismTestSync.js'
import { getTestCases } from '../services/canonical/testFetcher.js'
import { runTests } from '../services/testRunner.js'
import { extractJavaTestCases } from '../services/javaTestParser.js'
import { checkAndUnlockBadge } from '../services/badgeService.js'
import Submission from '../models/Submission.js'
import Challenge from '../models/Challenge.js'

// Route handlers for Execute APIs.
const router = express.Router()

function wrapJavaForRun(code) {
  const hasMain = /\bclass\s+Main\b/.test(code)
  if (hasMain) return code
  const stripped = code.replace(/\bpublic\s+(class|interface|enum|record)\b/g, '$1')
  return `${stripped}

public class Main {
    public static void main(String[] args) {
        // No-op runner to avoid missing Main errors.
    }
}
`
}

router.use(authenticateToken)
router.use(requireRole('student', 'faculty'))

router.post('/', async (req, res) => {
  try {
    const { code, language, challengeId } = req.body
    const normalizedLanguage = String(language || '').toLowerCase()

    if (!code || !normalizedLanguage) {
      return res.status(400).json({ message: 'Code and language are required' })
    }

    if (!challengeId) {
      return res.status(400).json({
        message: 'Challenge ID is required to run tests. Please submit via a challenge.',
        error: 'Missing challengeId'
      })
    }

    let runCode = code
    if (normalizedLanguage === 'java' && challengeId) {
      runCode = wrapJavaForRun(code)
    }

    const result = await executeCode(runCode, normalizedLanguage)

    const technicalDetails = {
      status: {
        id: result.statusId ?? null,
        description: result.status || ''
      },
      stderr: result.stderr || '',
      compile_output: result.compileOutput || '',
      message: result.message || '',
      exit_code: result.exitCode ?? null
    }

    let output = result.stdout || ''
    let error = result.stderr || result.compileOutput || ''
    let hint = null
    let friendlyFeedback = null
    let challenge = null

    let testResults = null
    let passed = false

    if (challengeId) {
      try {
        challenge = await Challenge.findById(challengeId)

        friendlyFeedback = await humanizeJudge0Error(
          {
            status: { id: result.statusId, description: result.status },
            compile_output: result.compileOutput,
            stderr: result.stderr,
            stdout: result.stdout,
            message: result.message,
            exit_code: result.exitCode,
            time: result.time,
            memory: result.memory
          },
          {
            language: normalizedLanguage,
            challengeTitle: challenge?.title,
            difficulty: challenge?.difficulty,
            forceHumanize: Boolean(req.body?.forceHumanize)
          }
        )

        if (friendlyFeedback) {
          hint = friendlyFeedback.summary
        }

        if (challenge && !error) {
          const baseSlug = normalizeToExercismSlug(challenge.exerciseSlug || challenge.slug)
          const toName = (value) => value === undefined ? undefined : (typeof value === 'string' ? value : JSON.stringify(value))
          const pickFirstFailure = (details = [], errors = [], fallbackError = null) => {
            const firstDetail = details.find(detail => detail && (detail.passed === false || detail.error))
            if (firstDetail) return firstDetail
            if (errors && errors.length > 0) {
              const errorItem = errors[0]
              return { error: errorItem?.error || errorItem?.message || String(errorItem) }
            }
            if (fallbackError) return { error: fallbackError }
            return null
          }
          const mapToTest = (test) => ({
            name: test.name || test.description || 'Unnamed test',
            property: test.property || null,
            input: Object.prototype.hasOwnProperty.call(test, 'input') ? test.input : {},
            expected: test.expected
          })
          const hasMeaningfulInput = (test) => {
            if (!Object.prototype.hasOwnProperty.call(test, 'input')) return false
            const input = test.input
            if (input === null || input === undefined) return false
            if (Array.isArray(input)) return input.length > 0
            if (typeof input === 'object') return Object.keys(input).length > 0
            return true
          }

          let tests = []

          const officialTests = Array.isArray(challenge.officialTests) ? challenge.officialTests : []
          const canonicalTests = Array.isArray(challenge.canonicalTests) ? challenge.canonicalTests : []
          const legacyTests = Array.isArray(challenge.testCases) ? challenge.testCases : []

          if (officialTests.length > 0) {
            const mapped = officialTests.map(mapToTest)
            const hasInputs = mapped.some(hasMeaningfulInput)
            if (!hasInputs) {
              if (canonicalTests.length > 0) {
                tests = canonicalTests.map(mapToTest)
              } else {
                try {
                  const canonical = await getTestCases(baseSlug)
                  tests = (canonical.cases || []).map(mapToTest)
                } catch {
                  tests = mapped
                }
              }
            } else {
              tests = mapped
            }
          } else if (canonicalTests.length > 0) {
            tests = canonicalTests.map(mapToTest)
          } else if (legacyTests.length > 0) {
            tests = legacyTests.map(mapToTest)
          } else {
            try {
              const canonical = await getTestCases(baseSlug)
              tests = (canonical.cases || []).map(mapToTest)
            } catch {}
          }

          if (normalizedLanguage === 'python' && (baseSlug === 'run-length-encoding' || baseSlug === 'binary-search' || baseSlug === 'flatten-array' || baseSlug === 'roman-numerals' || baseSlug === 'reverse-string' || baseSlug === 'sum-of-multiples' || baseSlug === 'sum-multiples' || baseSlug === 'two-fer')) {
            const hasInputs = tests.some(hasMeaningfulInput)
            if (!hasInputs) {
              try {
                const canonical = await getTestCases(baseSlug)
                tests = (canonical.cases || []).map(mapToTest)
              } catch {}
            }
          }

          if (normalizedLanguage === 'python' && baseSlug === 'reverse-string') {
            const getInputString = (input) => {
              if (typeof input === 'string') return input
              if (input && typeof input === 'object') {
                if (typeof input.value === 'string') return input.value
                if (typeof input.string === 'string') return input.string
              }
              return null
            }
            const isNonAscii = (value) => /[^\x00-\x7F]/.test(value)
            const filterNonAscii = (list) => list.filter(test => {
              const str = getInputString(test.input)
              return !str || !isNonAscii(str)
            })

            if (tests.length > 0) {
              tests = filterNonAscii(tests)
            }

            try {
              const canonical = await getTestCases(baseSlug)
              const filtered = (canonical.cases || []).filter(test => {
                const str = getInputString(test.input)
                return !str || !isNonAscii(str)
              })
              if (filtered.length > 0) {
                tests = filtered.map(mapToTest)
              }
            } catch {}
          }

          if (normalizedLanguage === 'java') {
            try {
              const javaTestFile = await readTestFile('java', baseSlug)
              if (javaTestFile?.content) {
                const parsed = extractJavaTestCases(javaTestFile.content)
                if (parsed.length > 0 && baseSlug !== 'bank-account') {
                  tests = parsed
                }
              }
            } catch (err) {
              console.error('Failed to parse Java test file:', err.message)
            }
          }

          if (normalizedLanguage === 'javascript') {
            try {
              const jsTestFile = await readTestFile('javascript', baseSlug)
              if (jsTestFile?.content) {
                let skipJsTests = false
                const importMatches = [...jsTestFile.content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g)]
                const requiredNames = importMatches
                  .filter((match) => match[2]?.startsWith('.'))
                  .flatMap((match) => match[1]
                    .split(',')
                    .map(name => name.trim().split(' as ')[0])
                    .filter(Boolean)
                  )
                if (requiredNames.length > 0) {
                  const missing = requiredNames.filter((name) => {
                    const regex = new RegExp(`\\b(function|const|let|var|class)\\s+${name}\\b`)
                    return !regex.test(code)
                  })
                  if (missing.length > 0) {
                    passed = false
                    testResults = {
                      passed: false,
                      total: requiredNames.length,
                      passedCount: 0,
                      failedCount: requiredNames.length,
                      expected: `Definitions for: ${requiredNames.join(', ')}`,
                      actual: `Missing: ${missing.join(', ')}`,
                      details: [],
                      message: 'Required function(s) not defined'
                    }
                    skipJsTests = true
                  }
                }

                if (!skipJsTests) {
                  const fileResult = await runTests(code, normalizedLanguage, baseSlug, [])
                  const details = fileResult.details || fileResult.results || []
                  const firstFail = pickFirstFailure(details, [], fileResult.error)
                  const expectedValue = firstFail?.expected
                  const actualValue = firstFail?.actual ?? (firstFail?.error ? `Error: ${firstFail.error}` : undefined)
                  const total = fileResult.total ?? details.length
                  const passedCount = typeof fileResult.passed === 'number' ? fileResult.passed : (fileResult.passedTests || 0)
                  const failedCount = Math.max(0, total - passedCount)

                  if (total === 0) {
                    passed = false
                    testResults = {
                      passed: false,
                      total: 0,
                      passedCount: 0,
                      failedCount: 0,
                      expected: 'N/A',
                      actual: 'N/A',
                      details,
                      message: 'Tests were not executed for this submission'
                    }
                  } else {
                    passed = failedCount === 0 && !fileResult.error
                    testResults = {
                      passed,
                      total,
                      passedCount,
                      failedCount,
                      expected: firstFail ? (toName(expectedValue) ?? 'N/A') : (passed ? '' : 'N/A'),
                      actual: firstFail ? (toName(actualValue) ?? 'N/A') : (passed ? '' : 'N/A'),
                      details,
                      message: fileResult.error || (passed ? 'All tests passed!' : 'Some tests failed')
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Failed to run JavaScript test file:', err.message)
            }
          }

          if (normalizedLanguage === 'python') {
            try {
              const pyTestFile = await readTestFile('python', baseSlug)
              let skipPyTests = false
              const moduleName = baseSlug.replace(/-/g, '_')
              const requiredNames = new Set()
              const parseImportList = (raw) => raw
                .replace(/#.*$/gm, '')
                .replace(/[\r\n]/g, ' ')
                .replace(/[()]/g, ' ')
                .split(',')
                .map(name => name.trim().split(' as ')[0])
                .filter(name => name && name !== '*')

              if (pyTestFile?.content) {
                const multilineRegex = new RegExp(`from\\s+${moduleName}\\s+import\\s*\\(([^)]+)\\)`, 'gs')
                for (const match of pyTestFile.content.matchAll(multilineRegex)) {
                  parseImportList(match[1]).forEach(name => requiredNames.add(name))
                }

                const singleRegex = new RegExp(`from\\s+${moduleName}\\s+import\\s+([^\\n]+)`, 'g')
                for (const match of pyTestFile.content.matchAll(singleRegex)) {
                  const list = match[1]
                  if (list.includes('(')) continue
                  parseImportList(list).forEach(name => requiredNames.add(name))
                }
              }

              if (requiredNames.size === 0 && tests.length > 0) {
                const toSnake = (value) => value
                  .replace(/([A-Z])/g, (_, c) => `_${c.toLowerCase()}`)
                  .replace(/-/g, '_')
                  .replace(/^_/, '')
                const inferred = new Set(
                  tests.map(test => toSnake(test.property || baseSlug)).filter(Boolean)
                )
                inferred.forEach(name => requiredNames.add(name))
              }

              if (requiredNames.size > 0) {
                const enforcedBySlug = {
                  'hello-world': ['hello_world'],
                  leap: ['is_leap'],
                  'reverse-string': ['reverse_string'],
                  hamming: ['hamming'],
                  triangle: ['triangle_type'],
                  'binary-search': ['binary_search'],
                  'roman-numerals': ['to_roman'],
                  'sum-of-multiples': ['sum_of_multiples'],
                  'sum-multiples': ['sum_of_multiples'],
                  'run-length-encoding': ['encode', 'decode']
                }
                const requiredList = enforcedBySlug[baseSlug] || Array.from(requiredNames)
                const missing = requiredList.filter((name) => {
                  const regex = new RegExp(`(^|\\n)\\s*(def|class)\\s+${name}\\b`, 'm')
                  return !regex.test(code)
                })
                if (missing.length > 0) {
                  passed = false
                  testResults = {
                    passed: false,
                    total: requiredList.length,
                    passedCount: 0,
                    failedCount: requiredList.length,
                    expected: `Definitions for: ${requiredList.join(', ')}`,
                    actual: `Missing: ${missing.join(', ')}`,
                    details: [],
                    message: missing.length === 1
                      ? `Missing required function: ${missing[0]}`
                      : 'Required function(s) not defined'
                  }
                  skipPyTests = true
                }
              }

              if (pyTestFile?.content && !skipPyTests) {
                const fileResult = await runTests(code, normalizedLanguage, baseSlug, [])
                const details = fileResult.details || fileResult.results || []
                const firstFail = pickFirstFailure(details, [], fileResult.error)
                const expectedValue = firstFail?.expected
                const actualValue = firstFail?.actual ?? (firstFail?.error ? `Error: ${firstFail.error}` : undefined)
                const total = fileResult.total ?? details.length
                const passedCount = typeof fileResult.passed === 'number' ? fileResult.passed : (fileResult.passedTests || 0)
                const failedCount = Math.max(0, total - passedCount)

                if (total === 0) {
                  passed = false
                  testResults = {
                    passed: false,
                    total: 0,
                    passedCount: 0,
                    failedCount: 0,
                    expected: 'N/A',
                    actual: 'N/A',
                    details,
                    message: 'Tests were not executed for this submission'
                  }
                } else {
                  passed = failedCount === 0 && !fileResult.error
                  testResults = {
                    passed,
                    total,
                    passedCount,
                    failedCount,
                    expected: firstFail ? (toName(expectedValue) ?? 'N/A') : (passed ? '' : 'N/A'),
                    actual: firstFail ? (toName(actualValue) ?? 'N/A') : (passed ? '' : 'N/A'),
                    details,
                    message: fileResult.error || (passed ? 'All tests passed!' : 'Some tests failed')
                  }
                }
              }
            } catch (err) {
              console.error('Failed to run Python test file:', err.message)
            }
          }

          if (!testResults && tests.length > 0) {
            const result = await runOfficialTests(code, normalizedLanguage, baseSlug, tests)
            const firstFail = pickFirstFailure(result.details || [], result.errors || [], result.error)
            const expectedValue = firstFail?.expected
            const actualValue = firstFail?.actual ?? (firstFail?.error ? `Error: ${firstFail.error}` : undefined)

            passed = result.totalTests > 0 && result.failedTests === 0 && !result.error
            testResults = {
              passed,
              total: result.totalTests,
              passedCount: result.passedTests,
              failedCount: result.failedTests,
              expected: firstFail ? (toName(expectedValue) ?? 'N/A') : (passed ? '' : 'N/A'),
              actual: firstFail ? (toName(actualValue) ?? 'N/A') : (passed ? '' : 'N/A'),
              details: result.details || [],
              message: result.error || (passed ? 'All tests passed!' : 'Some tests failed')
            }
          } else if ((challenge.testFilePath || challenge.officialTestFilePath) && normalizedLanguage !== 'java' && normalizedLanguage !== 'javascript') {
            const fileResult = await runTests(code, normalizedLanguage, baseSlug, [])
            const details = fileResult.details || fileResult.results || []
            const firstFail = pickFirstFailure(details, [], fileResult.error)
            const expectedValue = firstFail?.expected
            const actualValue = firstFail?.actual ?? (firstFail?.error ? `Error: ${firstFail.error}` : undefined)
            const total = fileResult.total ?? details.length
            const passedCount = typeof fileResult.passed === 'number' ? fileResult.passed : (fileResult.passedTests || 0)
            const failedCount = Math.max(0, total - passedCount)

            passed = total > 0 && failedCount === 0 && !fileResult.error
            testResults = {
              passed,
              total,
              passedCount,
              failedCount,
              expected: firstFail ? (toName(expectedValue) ?? 'N/A') : (passed ? '' : 'N/A'),
              actual: firstFail ? (toName(actualValue) ?? 'N/A') : (passed ? '' : 'N/A'),
              details,
              message: fileResult.error || (passed ? 'All tests passed!' : 'Some tests failed')
            }
          } else if (challenge.solution && normalizedLanguage !== 'java' && normalizedLanguage !== 'javascript' && normalizedLanguage !== 'python') {
            const cleanOutput = output.trim()
            const expectedOutput = challenge.solution.trim()
            passed = cleanOutput === expectedOutput

            testResults = {
              passed,
              expected: expectedOutput,
              actual: cleanOutput,
              message: passed ? 'All tests passed!' : `Expected: ${expectedOutput}\nGot: ${cleanOutput}`
            }
          }
          if (!testResults) {
            passed = false
            testResults = {
              passed: false,
              total: 0,
              passedCount: 0,
              failedCount: 0,
              expected: 'N/A',
              actual: 'N/A',
              details: [],
              message: 'Tests were not executed for this submission'
            }
          }
        }

        const existingSubmission = await Submission.findOne({
          userId: req.user._id,
          challengeId
        })

        const status = error ? 'error' : (passed ? 'accepted' : 'wrong_answer')

        if (existingSubmission) {
          existingSubmission.code = code
          existingSubmission.output = output
          existingSubmission.error = error
          existingSubmission.hint = hint
          existingSubmission.status = status
          existingSubmission.runCount = (existingSubmission.runCount || 0) + 1
          existingSubmission.runtime = result.time
          existingSubmission.memory = result.memory
          await existingSubmission.save()
        } else {
          await Submission.create({
            userId: req.user._id,
            challengeId,
            code,
            output,
            error,
            hint,
            status,
            runtime: result.time,
            memory: result.memory
          })
        }
      } catch (err) {
        console.error('Failed to save submission:', err)
      }
    }

    let badgeUnlocked = null
    if (passed && challengeId) {
      try {
        if (!challenge) {
          challenge = await Challenge.findById(challengeId)
        }
        if (challenge) {
          const badgeResult = await checkAndUnlockBadge(
            req.user._id,
            challenge.language,
            challenge.difficulty
          )
          if (badgeResult.unlocked) {
            badgeUnlocked = {
              badgeName: badgeResult.badgeName,
              language: badgeResult.language,
              difficulty: badgeResult.difficulty,
              status: 'claimable'
            }
          }
        }
      } catch (err) {
        console.error('Failed to check badge:', err)
      }
    }

    res.json({
      output: output || error,
      error: error || null,
      hint,
      friendlyFeedback,
      technicalDetails,
      status: result.status,
      time: result.time,
      memory: result.memory,
      testResults,
      passed,
      badgeUnlocked
    })
  } catch (error) {
    console.error('Execute error:', error)
    res.status(500).json({ message: 'Execution failed', error: error.message })
  }
})

export default router



