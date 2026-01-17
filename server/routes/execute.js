// Express routes for Execute endpoints.
import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { executeCode } from '../services/judge0.js'
import { rephraseError } from '../services/gpt.js'
import { runOfficialTests } from '../services/officialTestsRunner.js'
import { normalizeToExercismSlug } from '../services/exercismTestSync.js'
import { getTestCases } from '../services/canonical/testFetcher.js'
import { runTests } from '../services/testRunner.js'
import { checkAndAwardBadge } from '../services/badgeService.js'
import Submission from '../models/Submission.js'
import Challenge from '../models/Challenge.js'

// Route handlers for Execute APIs.
const router = express.Router()

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { code, language, challengeId } = req.body

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' })
    }

    const result = await executeCode(code, language)

    let output = result.stdout || ''
    let error = result.stderr || result.compileOutput || ''
    let hint = null

    if (error) {
      hint = await rephraseError(error, language, code)
    }

    let testResults = null
    let passed = false

    if (challengeId) {
      try {
        const challenge = await Challenge.findById(challengeId)

        if (challenge && !error) {
          const baseSlug = challenge.exerciseSlug || normalizeToExercismSlug(challenge.slug)
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

          if (tests.length > 0) {
            const result = await runOfficialTests(code, language, baseSlug, tests)
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
          } else if ((challenge.testFilePath || challenge.officialTestFilePath) && language !== 'java') {
            const fileResult = await runTests(code, language, baseSlug, [])
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
          } else if (challenge.solution) {
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

    let badgeEarned = null
    if (passed && challengeId) {
      try {
        const challenge = await Challenge.findById(challengeId)
        if (challenge) {
          const badgeResult = await checkAndAwardBadge(
            req.user._id,
            challenge.language,
            challenge.difficulty
          )
          if (badgeResult.award) {
            badgeEarned = {
              badgeName: badgeResult.badgeName,
              language: badgeResult.language,
              difficulty: badgeResult.difficulty
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
      status: result.status,
      time: result.time,
      memory: result.memory,
      testResults,
      passed,
      badgeEarned
    })
  } catch (error) {
    console.error('Execute error:', error)
    res.status(500).json({ message: 'Execution failed', error: error.message })
  }
})

export default router



