import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  checkAndAwardBadge,
  getUserBadges,
  getBadgeProgress,
  checkAllBadgesForUser,
  BADGE_MAPPING
} from '../services/badgeService.js'

const router = express.Router()

router.get('/my-badges', authenticateToken, async (req, res) => {
  try {
    const badges = await getUserBadges(req.user._id)
    res.json({ badges })
  } catch (error) {
    console.error('Error fetching badges:', error)
    res.status(500).json({ message: 'Failed to fetch badges' })
  }
})

router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const progress = await getBadgeProgress(req.user._id)
    res.json({ progress })
  } catch (error) {
    console.error('Error fetching badge progress:', error)
    res.status(500).json({ message: 'Failed to fetch badge progress' })
  }
})

router.post('/check', authenticateToken, async (req, res) => {
  try {
    const { language, difficulty } = req.body
    
    if (!language || !difficulty) {
      return res.status(400).json({ 
        message: 'Language and difficulty are required' 
      })
    }
    
    const result = await checkAndAwardBadge(
      req.user._id, 
      language, 
      difficulty
    )
    
    res.json(result)
  } catch (error) {
    console.error('Error checking badge:', error)
    res.status(500).json({ message: 'Failed to check badge eligibility' })
  }
})

router.post('/check-all', authenticateToken, async (req, res) => {
  try {
    const newBadges = await checkAllBadgesForUser(req.user._id)
    const allBadges = await getUserBadges(req.user._id)
    
    res.json({
      newBadges,
      allBadges,
      newBadgesAwarded: newBadges.length
    })
  } catch (error) {
    console.error('Error checking all badges:', error)
    res.status(500).json({ message: 'Failed to check badges' })
  }
})

router.get('/mapping', (req, res) => {
  res.json({ mapping: BADGE_MAPPING })
})

export default router
