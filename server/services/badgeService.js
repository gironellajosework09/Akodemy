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

export async function checkAndUnlockBadge(userId, language, difficulty) {
  const challenges = await Challenge.find({ language, difficulty })
  
  if (challenges.length === 0) {
    return {
      unlocked: false,
      alreadyExists: false,
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
      unlocked: false,
      alreadyExists: true,
      badge: existingBadge,
      badgeName: existingBadge.badgeName,
      language,
      difficulty,
      reason: existingBadge.status === 'claimed' ? 'Badge already claimed.' : 'Badge already unlocked and ready to claim.',
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
      unlocked: false,
      alreadyExists: false,
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
      unlocked: false,
      alreadyExists: false,
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
    difficulty,
    status: 'claimable',
    equipped: false,
    unlockedAt: new Date()
  })

  return {
    unlocked: true,
    alreadyExists: false,
    badgeName,
    language,
    difficulty,
    reason: 'All challenges completed! Badge is now ready to claim.',
    missingOrIncorrect: [],
    badge: newBadge
  }
}

export async function claimBadge(userId, language, difficulty) {
  const badge = await Badge.findOne({ userId, language, difficulty })
  
  if (!badge) {
    return {
      success: false,
      reason: 'Badge not found. Complete all challenges first.'
    }
  }
  
  if (badge.status === 'claimed') {
    return {
      success: false,
      reason: 'Badge already claimed.',
      badge
    }
  }
  
  badge.status = 'claimed'
  badge.claimedAt = new Date()
  await badge.save()
  
  return {
    success: true,
    reason: 'Badge claimed successfully!',
    badge
  }
}

export async function equipBadge(userId, language, difficulty) {
  const badge = await Badge.findOne({ userId, language, difficulty })
  
  if (!badge) {
    return {
      success: false,
      reason: 'Badge not found.'
    }
  }
  
  if (badge.status !== 'claimed') {
    return {
      success: false,
      reason: 'Badge must be claimed before equipping.'
    }
  }
  
  await Badge.updateMany(
    { userId, equipped: true },
    { equipped: false }
  )
  
  badge.equipped = true
  await badge.save()
  
  return {
    success: true,
    reason: 'Badge equipped as your title!',
    badge
  }
}

export async function unequipBadge(userId) {
  const result = await Badge.updateMany(
    { userId, equipped: true },
    { equipped: false }
  )
  
  return {
    success: true,
    reason: 'Title removed from profile.',
    unequippedCount: result.modifiedCount
  }
}

export async function getEquippedBadge(userId) {
  const badge = await Badge.findOne({ userId, equipped: true })
  return badge
}

export async function getUserBadges(userId) {
  const badges = await Badge.find({ userId }).sort({ unlockedAt: -1 })
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
        badgeName: BADGE_MAPPING[language]?.[difficulty] || null,
        status: existingBadge?.status || 'locked',
        equipped: existingBadge?.equipped || false,
        claimable: existingBadge?.status === 'claimable',
        claimed: existingBadge?.status === 'claimed'
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
      const result = await checkAndUnlockBadge(userId, language, difficulty)
      if (result.unlocked) {
        results.push(result)
      }
    }
  }
  
  return results
}

export { BADGE_MAPPING }
