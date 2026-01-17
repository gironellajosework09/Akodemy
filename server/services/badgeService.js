import Badge from '../models/Badge.js'
import Challenge from '../models/Challenge.js'
import Submission from '../models/Submission.js'

const BADGE_MAPPING = {
  java: {
    beginner: 'Java Barista',
    intermediate: 'Java Brewer',
    advanced: 'Java Roast Master'
  },
  python: {
    beginner: 'Python Catcher',
    intermediate: 'Python Handler',
    advanced: 'Python Expert'
  },
  javascript: {
    beginner: 'Script Starter',
    intermediate: 'Script Engineer',
    advanced: 'Script Architect'
  }
}

export async function checkAndAwardBadge(userId, language, difficulty) {
  const challenges = await Challenge.find({ language, difficulty })
  
  if (challenges.length === 0) {
    return {
      award: false,
      alreadyAwarded: false,
      badgeName: null,
      language,
      difficulty,
      reason: 'No challenges found for this language and difficulty.',
      missingOrIncorrect: []
    }
  }

  const existingBadge = await Badge.findOne({ userId, language, difficulty })
  if (existingBadge) {
    return {
      award: false,
      alreadyAwarded: true,
      badgeName: existingBadge.badgeName,
      language,
      difficulty,
      reason: 'Badge already awarded.',
      missingOrIncorrect: []
    }
  }

  const challengeIds = challenges.map(c => c._id)
  
  const submissions = await Submission.find({
    userId,
    challengeId: { $in: challengeIds },
    status: 'accepted'
  })

  const completedChallengeIds = new Set(
    submissions.map(s => s.challengeId.toString())
  )

  const missingOrIncorrect = []
  
  for (const challenge of challenges) {
    const isCompleted = completedChallengeIds.has(challenge._id.toString())
    if (!isCompleted) {
      missingOrIncorrect.push({
        challengeId: challenge._id.toString(),
        title: challenge.title,
        isCompleted: false,
        isCorrect: false
      })
    }
  }

  if (missingOrIncorrect.length > 0) {
    return {
      award: false,
      alreadyAwarded: false,
      badgeName: null,
      language,
      difficulty,
      reason: 'Not all challenges are completed with correct answers.',
      missingOrIncorrect,
      progress: {
        completed: completedChallengeIds.size,
        total: challenges.length
      }
    }
  }

  const badgeName = BADGE_MAPPING[language]?.[difficulty]
  if (!badgeName) {
    return {
      award: false,
      alreadyAwarded: false,
      badgeName: null,
      language,
      difficulty,
      reason: 'Invalid language or difficulty combination.',
      missingOrIncorrect: []
    }
  }

  const newBadge = await Badge.create({
    userId,
    badgeName,
    language,
    difficulty
  })

  return {
    award: true,
    alreadyAwarded: false,
    badgeName,
    language,
    difficulty,
    reason: 'All challenges in this tier are completed and correct.',
    missingOrIncorrect: [],
    badge: newBadge
  }
}

export async function getUserBadges(userId) {
  const badges = await Badge.find({ userId }).sort({ awardedAt: -1 })
  return badges
}

export async function getBadgeProgress(userId) {
  const languages = ['javascript', 'python', 'java']
  const difficulties = ['beginner', 'intermediate', 'advanced']
  
  const progress = {}
  
  for (const language of languages) {
    progress[language] = {}
    
    for (const difficulty of difficulties) {
      const challenges = await Challenge.find({ language, difficulty })
      const challengeIds = challenges.map(c => c._id)
      
      const completedSubmissions = await Submission.find({
        userId,
        challengeId: { $in: challengeIds },
        status: 'accepted'
      })
      
      const completedIds = new Set(
        completedSubmissions.map(s => s.challengeId.toString())
      )
      
      const existingBadge = await Badge.findOne({ userId, language, difficulty })
      
      progress[language][difficulty] = {
        completed: completedIds.size,
        total: challenges.length,
        badgeEarned: !!existingBadge,
        badgeName: BADGE_MAPPING[language]?.[difficulty] || null
      }
    }
  }
  
  return progress
}

export async function checkAllBadgesForUser(userId) {
  const languages = ['javascript', 'python', 'java']
  const difficulties = ['beginner', 'intermediate', 'advanced']
  const results = []
  
  for (const language of languages) {
    for (const difficulty of difficulties) {
      const result = await checkAndAwardBadge(userId, language, difficulty)
      if (result.award) {
        results.push(result)
      }
    }
  }
  
  return results
}

export { BADGE_MAPPING }
