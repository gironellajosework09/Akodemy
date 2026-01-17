import mongoose from 'mongoose'
import ChallengeAnswer from '../../models/ChallengeAnswer.js'
import Challenge from '../../models/Challenge.js'
import ScoreMismatchLog from '../../models/ScoreMismatchLog.js'
import { gradeSubmission } from './gradingEngine.js'
import { computeScore, deepEqual, COMPETENCY_THRESHOLDS } from './executionContract.js'

export class ScoreVerificationService {
  constructor(options = {}) {
    this.debugMode = options.debugMode || false
    this.autoCorrect = options.autoCorrect || false
    this.logs = []
  }

  log(level, message, data = null) {
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data: this.debugMode ? data : undefined
    }
    this.logs.push(entry)
    
    if (this.debugMode) {
      const prefix = `[ScoreVerify:${level.toUpperCase()}]`
      if (level === 'error') {
        console.error(prefix, message, data || '')
      } else if (level === 'warn') {
        console.warn(prefix, message, data || '')
      } else {
        console.log(prefix, message, data || '')
      }
    }
  }

  async verifySubmission(submissionId) {
    this.log('info', `Verifying submission: ${submissionId}`)

    try {
      const submission = await ChallengeAnswer.findById(submissionId).lean()
      
      if (!submission) {
        return {
          success: false,
          error: `Submission not found: ${submissionId}`,
          mismatch: false
        }
      }

      const challenge = await Challenge.findById(submission.challengeId).lean()
      
      if (!challenge) {
        return {
          success: false,
          error: `Challenge not found: ${submission.challengeId}`,
          mismatch: false
        }
      }

      const gradingResult = await gradeSubmission(
        submission.answer,
        submission.language,
        challenge.exercismSlug || challenge.slug
      )

      const storedScore = submission.score || 0
      const computedScore = gradingResult.score || 0
      const storedIsCorrect = submission.isCorrect || false
      const computedIsCorrect = computedScore >= 90

      const mismatch = storedScore !== computedScore || storedIsCorrect !== computedIsCorrect

      const result = {
        success: true,
        submissionId,
        challengeId: submission.challengeId.toString(),
        exerciseSlug: challenge.exercismSlug,
        language: submission.language,
        stored: {
          score: storedScore,
          isCorrect: storedIsCorrect
        },
        computed: {
          score: computedScore,
          isCorrect: computedIsCorrect,
          passed: gradingResult.passed,
          total: gradingResult.total
        },
        mismatch,
        mismatchDetails: null
      }

      if (mismatch) {
        result.mismatchDetails = {
          scoreDiff: computedScore - storedScore,
          correctnessMismatch: storedIsCorrect !== computedIsCorrect,
          gradingDetails: this.debugMode ? gradingResult.details : undefined
        }

        this.log('warn', 'Score mismatch detected', {
          submissionId,
          stored: result.stored,
          computed: result.computed
        })

        await this.logScoreMismatch({
          submissionId,
          challengeId: submission.challengeId,
          userId: submission.userId,
          exerciseSlug: challenge.exercismSlug,
          language: submission.language,
          storedScore,
          computedScore,
          scoreDiff: computedScore - storedScore,
          storedIsCorrect,
          computedIsCorrect,
          correctnessMismatch: storedIsCorrect !== computedIsCorrect,
          gradingDetails: this.debugMode ? gradingResult.details : undefined
        })

        if (this.autoCorrect) {
          await this.correctSubmission(submissionId, computedScore, computedIsCorrect)
          result.corrected = true
        }
      }

      return result

    } catch (error) {
      this.log('error', `Verification failed: ${error.message}`, {
        submissionId,
        stack: this.debugMode ? error.stack : undefined
      })
      
      return {
        success: false,
        error: error.message,
        submissionId,
        mismatch: false
      }
    }
  }

  async logScoreMismatch(data) {
    try {
      const logEntry = new ScoreMismatchLog(data)
      await logEntry.save()
      this.log('info', `Score mismatch logged to database`, {
        submissionId: data.submissionId,
        scoreDiff: data.scoreDiff
      })
    } catch (error) {
      this.log('error', `Failed to log score mismatch: ${error.message}`)
    }
  }

  async correctSubmission(submissionId, newScore, newIsCorrect) {
    this.log('info', `Correcting submission: ${submissionId}`, {
      newScore,
      newIsCorrect
    })

    try {
      await ChallengeAnswer.findByIdAndUpdate(submissionId, {
        $set: {
          score: newScore,
          isCorrect: newIsCorrect,
          correctedAt: new Date(),
          correctionReason: 'score_verification_mismatch'
        }
      })

      await ScoreMismatchLog.findOneAndUpdate(
        { submissionId },
        { $set: { corrected: true, correctedAt: new Date() } }
      )

      this.log('info', `Submission corrected successfully: ${submissionId}`)
      return true

    } catch (error) {
      this.log('error', `Failed to correct submission: ${error.message}`)
      return false
    }
  }

  async verifyRecentSubmissions(options = {}) {
    const {
      limit = 100,
      language = null,
      exerciseSlug = null,
      onlyMismatches = false
    } = options

    this.log('info', 'Verifying recent submissions', options)

    const query = {}
    if (language) query.language = language

    let challengeIds = null
    if (exerciseSlug) {
      const challenge = await Challenge.findOne({ exercismSlug: exerciseSlug }).lean()
      if (challenge) {
        challengeIds = [challenge._id]
        query.challengeId = { $in: challengeIds }
      }
    }

    const submissions = await ChallengeAnswer.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .lean()

    const results = {
      total: submissions.length,
      verified: 0,
      mismatches: 0,
      errors: 0,
      corrected: 0,
      details: []
    }

    for (const submission of submissions) {
      const result = await this.verifySubmission(submission._id.toString())
      results.verified++

      if (!result.success) {
        results.errors++
      } else if (result.mismatch) {
        results.mismatches++
        if (result.corrected) {
          results.corrected++
        }
      }

      if (!onlyMismatches || result.mismatch || !result.success) {
        results.details.push(result)
      }
    }

    return results
  }

  async generateMismatchReport(options = {}) {
    const verificationResults = await this.verifyRecentSubmissions({
      ...options,
      onlyMismatches: true
    })

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalVerified: verificationResults.verified,
        totalMismatches: verificationResults.mismatches,
        totalErrors: verificationResults.errors,
        mismatchRate: verificationResults.verified > 0
          ? ((verificationResults.mismatches / verificationResults.verified) * 100).toFixed(2) + '%'
          : '0%'
      },
      mismatches: verificationResults.details.filter(d => d.mismatch),
      errors: verificationResults.details.filter(d => !d.success)
    }

    const exerciseMismatchCounts = {}
    for (const mismatch of report.mismatches) {
      const slug = mismatch.exerciseSlug || 'unknown'
      exerciseMismatchCounts[slug] = (exerciseMismatchCounts[slug] || 0) + 1
    }

    report.byExercise = Object.entries(exerciseMismatchCounts)
      .map(([exercise, count]) => ({ exercise, count }))
      .sort((a, b) => b.count - a.count)

    return report
  }
}

export const VERIFICATION_INDEXES = [
  { collection: 'challengeanswers', keys: { submittedAt: -1 } },
  { collection: 'challengeanswers', keys: { challengeId: 1, submittedAt: -1 } },
  { collection: 'challengeanswers', keys: { language: 1, submittedAt: -1 } },
  { collection: 'challengeanswers', keys: { score: 1, isCorrect: 1 } }
]

export async function ensureVerificationIndexes() {
  const db = mongoose.connection.db
  
  for (const indexDef of VERIFICATION_INDEXES) {
    try {
      await db.collection(indexDef.collection).createIndex(indexDef.keys)
    } catch (error) {
      console.warn(`Index creation warning: ${error.message}`)
    }
  }
}

export async function verifyAndReport(options = {}) {
  const service = new ScoreVerificationService({
    debugMode: options.debugMode || false,
    autoCorrect: options.autoCorrect || false
  })

  return await service.generateMismatchReport(options)
}
