import CompetencyScore from '../models/CompetencyScore.js'
import CompetencyHistory from '../models/CompetencyHistory.js'
import Challenge from '../models/Challenge.js'
import ChallengeAnswer from '../models/ChallengeAnswer.js'

const COMPETENCY_INDEX_MAP = {
  0: 'variables',
  1: 'controlStructures',
  2: 'functions',
  3: 'arrays',
  4: 'oop',
  5: 'errorHandling'
}

const DIFFICULTY_MULTIPLIERS = {
  beginner: 0.8,
  intermediate: 1.0,
  advanced: 1.3
}

const MIN_COMPETENCY_SCORE = 0
const MAX_COMPETENCY_SCORE = 100

const BASE_CORRECT_INCREASE = 10
const BASE_INCORRECT_DECREASE = 5

const DIMINISHING_RETURNS_THRESHOLD = 3
const DIMINISHING_RETURNS_FACTOR = 0.5

export async function calculateCompetencyChange(userId, challengeId, submissionResult, attemptNumber) {
  const challenge = await Challenge.findById(challengeId).lean()
  if (!challenge) {
    throw new Error('Challenge not found')
  }

  const { language, difficulty, impactWeight = 10, competencyIndex } = challenge
  
  let targetCompetencies = challenge.targetCompetencies || []
  if (targetCompetencies.length === 0 && competencyIndex !== undefined) {
    const mapped = COMPETENCY_INDEX_MAP[competencyIndex]
    if (mapped) targetCompetencies = [mapped]
  }

  if (targetCompetencies.length === 0) {
    return { changes: [], reason: 'no_target_competencies' }
  }

  const isCorrect = submissionResult.isCorrect
  const testScore = submissionResult.score || 0
  const passedTests = submissionResult.passedTests || 0
  const totalTests = submissionResult.totalTests || 1

  const hasPreviousCorrect = await ChallengeAnswer.exists({
    userId,
    challengeId,
    isCorrect: true,
    attemptNumber: { $lt: attemptNumber }
  })

  let reason
  if (attemptNumber === 1) {
    reason = 'first_attempt'
  } else if (hasPreviousCorrect) {
    reason = isCorrect ? 'retake_correct' : 'retake_incorrect'
  } else {
    reason = isCorrect ? 'correct_submission' : 'incorrect_submission'
  }

  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0
  const weightMultiplier = impactWeight / 10

  let baseDelta
  if (isCorrect) {
    baseDelta = BASE_CORRECT_INCREASE * (testScore / 100) * difficultyMultiplier * weightMultiplier
    
    if (hasPreviousCorrect && attemptNumber > DIMINISHING_RETURNS_THRESHOLD) {
      baseDelta *= DIMINISHING_RETURNS_FACTOR
    }
  } else {
    baseDelta = -BASE_INCORRECT_DECREASE * difficultyMultiplier * weightMultiplier
    
    if (passedTests > 0 && totalTests > 0) {
      const partialCredit = (passedTests / totalTests) * 0.5
      baseDelta = baseDelta * (1 - partialCredit)
    }
  }

  baseDelta = Math.round(baseDelta * 10) / 10

  const changes = []

  for (const competencyArea of targetCompetencies) {
    const currentScore = await CompetencyScore.getOrCreate(userId, language, competencyArea)
    const previousScore = currentScore.score

    const updatedScore = await CompetencyScore.updateScore(
      userId,
      language,
      competencyArea,
      baseDelta,
      isCorrect
    )

    changes.push({
      competencyArea,
      previousScore,
      newScore: updatedScore.score,
      delta: updatedScore.score - previousScore
    })
  }

  return {
    changes,
    reason,
    isCorrect,
    attemptNumber,
    baseDelta,
    hasPreviousCorrect
  }
}

export async function logCompetencyChanges(userId, challengeId, submissionId, language, competencyResult, testDetails) {
  const historyEntries = []

  for (const change of competencyResult.changes) {
    const entry = await CompetencyHistory.logChange({
      userId,
      challengeId,
      submissionId,
      language,
      competencyArea: change.competencyArea,
      previousScore: change.previousScore,
      newScore: change.newScore,
      scoreDelta: change.delta,
      reason: competencyResult.reason,
      isCorrect: competencyResult.isCorrect,
      attemptNumber: competencyResult.attemptNumber,
      testScore: testDetails.score || 0,
      passedTests: testDetails.passedTests || 0,
      totalTests: testDetails.totalTests || 0
    })
    historyEntries.push(entry)
  }

  return historyEntries
}

export async function processSubmissionCompetency(userId, challengeId, submissionId, submissionResult) {
  const challenge = await Challenge.findById(challengeId).lean()
  if (!challenge) {
    return null
  }

  const attemptNumber = submissionResult.attemptNumber || 1

  const competencyResult = await calculateCompetencyChange(
    userId,
    challengeId,
    submissionResult,
    attemptNumber
  )

  if (competencyResult.changes.length === 0) {
    return competencyResult
  }

  await logCompetencyChanges(
    userId,
    challengeId,
    submissionId,
    challenge.language,
    competencyResult,
    {
      score: submissionResult.score,
      passedTests: submissionResult.passedTests,
      totalTests: submissionResult.totalTests
    }
  )

  return competencyResult
}

export async function getUserCompetencyScores(userId, language = null) {
  const languages = language ? [language] : ['javascript', 'python', 'java']
  const result = {}

  for (const lang of languages) {
    result[lang] = await CompetencyScore.getFormattedScores(userId, lang)
  }

  return result
}

export async function getUserCompetencyHistory(userId, options = {}) {
  return CompetencyHistory.getUserHistory(userId, options)
}

export function formatCompetencyFeedback(competencyResult) {
  if (!competencyResult || !competencyResult.changes || competencyResult.changes.length === 0) {
    return null
  }

  const feedback = {
    changes: competencyResult.changes.map(change => ({
      area: CompetencyScore.COMPETENCY_NAMES[change.competencyArea] || change.competencyArea,
      areaKey: change.competencyArea,
      previousScore: Math.round(change.previousScore),
      newScore: Math.round(change.newScore),
      delta: Math.round(change.delta * 10) / 10,
      direction: change.delta > 0 ? 'increased' : change.delta < 0 ? 'decreased' : 'unchanged'
    })),
    reason: competencyResult.reason,
    isCorrect: competencyResult.isCorrect,
    message: generateFeedbackMessage(competencyResult)
  }

  return feedback
}

function generateFeedbackMessage(competencyResult) {
  const { changes, reason, isCorrect } = competencyResult
  
  if (changes.length === 0) return null

  const totalDelta = changes.reduce((sum, c) => sum + c.delta, 0)
  const areas = changes.map(c => CompetencyScore.COMPETENCY_NAMES[c.competencyArea]).join(', ')

  switch (reason) {
    case 'first_attempt':
      if (isCorrect) {
        return `Great job on your first attempt! Your ${areas} competency increased by ${Math.abs(totalDelta).toFixed(1)} points.`
      } else {
        return `Keep trying! Your ${areas} competency decreased by ${Math.abs(totalDelta).toFixed(1)} points, but you can improve with more practice.`
      }
    
    case 'retake_correct':
      return `Nice work on the retake! Your ${areas} competency increased by ${Math.abs(totalDelta).toFixed(1)} points.`
    
    case 'retake_incorrect':
      return `Your ${areas} competency decreased by ${Math.abs(totalDelta).toFixed(1)} points after this retake. Keep practicing to improve!`
    
    case 'correct_submission':
      return `Excellent! Your ${areas} competency increased by ${Math.abs(totalDelta).toFixed(1)} points.`
    
    case 'incorrect_submission':
      return `Your ${areas} competency decreased by ${Math.abs(totalDelta).toFixed(1)} points. Review the problem and try again!`
    
    default:
      return isCorrect 
        ? `Competency updated: +${totalDelta.toFixed(1)} points`
        : `Competency updated: ${totalDelta.toFixed(1)} points`
  }
}

export async function migrateCompetencyIndexToTargetCompetencies() {
  const challenges = await Challenge.find({
    $or: [
      { targetCompetencies: { $exists: false } },
      { targetCompetencies: { $size: 0 } }
    ],
    competencyIndex: { $exists: true, $ne: null }
  })

  let migrated = 0
  for (const challenge of challenges) {
    const mapped = COMPETENCY_INDEX_MAP[challenge.competencyIndex]
    if (mapped) {
      challenge.targetCompetencies = [mapped]
      await challenge.save()
      migrated++
    }
  }

  return { migrated, total: challenges.length }
}

export { COMPETENCY_INDEX_MAP }
