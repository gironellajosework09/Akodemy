import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  checkAndUnlockBadge,
  claimBadge,
  equipBadge,
  unequipBadge,
  getEquippedBadge,
  getUserBadges,
  getBadgeProgress,
  checkAllBadgesForUser,
  BADGE_MAPPING
} from '../services/badgeService.js'

const router = express.Router()

router.use(authenticateToken)
router.use(requireRole('student', 'faculty'))

router.get('/my-badges', async (req, res) => {
  try {
    const badges = await getUserBadges(req.user._id)
    res.json({ badges })
  } catch (error) {
    console.error('Error fetching badges:', error)
    res.status(500).json({ message: 'Failed to fetch badges' })
  }
})

router.get('/progress', async (req, res) => {
  try {
    const progress = await getBadgeProgress(req.user._id)
    res.json({ progress })
  } catch (error) {
    console.error('Error fetching badge progress:', error)
    res.status(500).json({ message: 'Failed to fetch badge progress' })
  }
})

router.get('/equipped', async (req, res) => {
  try {
    const badge = await getEquippedBadge(req.user._id)
    res.json({ badge })
  } catch (error) {
    console.error('Error fetching equipped badge:', error)
    res.status(500).json({ message: 'Failed to fetch equipped badge' })
  }
})

router.post('/check', async (req, res) => {
  try {
    const { language, difficulty } = req.body
    
    if (!language || !difficulty) {
      return res.status(400).json({ 
        message: 'Language and difficulty are required' 
      })
    }
    
    const result = await checkAndUnlockBadge(
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

router.post('/claim', async (req, res) => {
  try {
    const { language, difficulty } = req.body
    
    if (!language || !difficulty) {
      return res.status(400).json({ 
        message: 'Language and difficulty are required' 
      })
    }
    
    const result = await claimBadge(req.user._id, language, difficulty)
    
    if (!result.success) {
      return res.status(400).json(result)
    }
    
    res.json(result)
  } catch (error) {
    console.error('Error claiming badge:', error)
    res.status(500).json({ message: 'Failed to claim badge' })
  }
})

router.post('/equip', async (req, res) => {
  try {
    const { language, difficulty } = req.body
    
    if (!language || !difficulty) {
      return res.status(400).json({ 
        message: 'Language and difficulty are required' 
      })
    }
    
    const result = await equipBadge(req.user._id, language, difficulty)
    
    if (!result.success) {
      return res.status(400).json(result)
    }
    
    res.json(result)
  } catch (error) {
    console.error('Error equipping badge:', error)
    res.status(500).json({ message: 'Failed to equip badge' })
  }
})

router.post('/unequip', async (req, res) => {
  try {
    const result = await unequipBadge(req.user._id)
    res.json(result)
  } catch (error) {
    console.error('Error unequipping badge:', error)
    res.status(500).json({ message: 'Failed to unequip badge' })
  }
})

router.post('/check-all', async (req, res) => {
  try {
    const newBadges = await checkAllBadgesForUser(req.user._id)
    const allBadges = await getUserBadges(req.user._id)
    
    res.json({
      newBadges,
      allBadges,
      newBadgesUnlocked: newBadges.length
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
