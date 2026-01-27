// Express routes for User profile endpoints.
import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

const PASSWORD_MIN_LENGTH = 8

const ALLOWED_FIELDS = [
  'name',
  'email',
  'phone',
  'address',
  'birthdate',
  'sex',
  'yearSection',
  'portalUsername'
]

const pickUpdates = (payload) => {
  const updates = {}
  for (const field of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      updates[field] = payload[field]
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(payload, 'username') &&
    !Object.prototype.hasOwnProperty.call(payload, 'portalUsername')
  ) {
    updates.portalUsername = payload.username
  }
  return updates
}

const validatePassword = (password) => {
  const errors = []
  if (password.length < PASSWORD_MIN_LENGTH) errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('At least one number')
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) {
    errors.push('At least one special character')
  }
  return errors
}

const getPasswordStrength = (password) => {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) score++

  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

const normalizeBcryptHash = (hash) => {
  if (!hash) return hash
  if (hash.startsWith('$2y$')) {
    return `$2a$${hash.slice(4)}`
  }
  return hash
}

const buildProfileResponse = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  student_id: user.student_id || null,
  phone: user.phone || '',
  address: user.address || '',
  birthdate: user.birthdate || '',
  sex: user.sex || '',
  yearSection: user.yearSection || '',
  portalUsername: user.portalUsername || null,
  username: user.portalUsername || null,
  role: user.role
})

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('name email student_id phone address birthdate sex yearSection portalUsername role')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.yearSection) {
      const rawUser = await User.collection.findOne(
        { _id: user._id },
        { projection: { year: 1, section: 1 } }
      )
      if (rawUser?.year && rawUser?.section) {
        const normalized = `${rawUser.year}${rawUser.section}`.trim().toUpperCase()
        if (/^[1-9][A-Z]$/.test(normalized)) {
          user.yearSection = normalized
          await User.updateOne(
            { _id: user._id },
            { $set: { yearSection: normalized }, $unset: { year: '', section: '' } }
          )
        }
      }
    }

    res.json(buildProfileResponse(user))
  } catch (error) {
    console.error('Fetch profile error:', error)
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const updates = pickUpdates(req.body || {})
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' })
    }

    const currentUser = await User.findById(req.user._id)
      .select('email portalUsername')

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (typeof updates.email === 'string' && updates.email.trim() === '') {
      return res.status(400).json({ message: 'Email cannot be empty' })
    }

    if (typeof updates.name === 'string' && updates.name.trim() === '') {
      return res.status(400).json({ message: 'Name cannot be empty' })
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'yearSection')) {
      const normalized = String(updates.yearSection || '').trim().toUpperCase()
      if (normalized && !/^[1-9][A-Z]$/.test(normalized)) {
        return res.status(400).json({
          message: 'Year must be a number and section must be an uppercase letter'
        })
      }
      updates.yearSection = normalized
    }

    if (updates.email && updates.email !== currentUser.email) {
      const existingEmail = await User.findOne({
        email: updates.email,
        _id: { $ne: currentUser._id }
      }).select('_id')
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already in use' })
      }
    }

    if (updates.portalUsername && updates.portalUsername !== currentUser.portalUsername) {
      const existingUsername = await User.findOne({
        portalUsername: updates.portalUsername,
        _id: { $ne: currentUser._id }
      }).select('_id')
      if (existingUsername) {
        return res.status(409).json({ message: 'Username already in use' })
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('name email phone address birthdate sex yearSection portalUsername role')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(buildProfileResponse(user))
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors })
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Duplicate value detected' })
    }
    console.error('Profile update error:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

router.patch('/me/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {}

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }

    const passwordErrors = validatePassword(newPassword)
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: 'Password does not meet requirements',
        errors: passwordErrors
      })
    }

    const strength = getPasswordStrength(newPassword)
    if (strength === 'weak') {
      return res.status(400).json({ message: 'Password is too weak. Please use a stronger password.' })
    }

    const user = await User.findById(req.user._id).select('password previousPassword')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const normalizedHash = normalizeBcryptHash(user.password)
    const isValidPassword = await bcrypt.compare(currentPassword, normalizedHash)
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    const isSameAsCurrent = await bcrypt.compare(newPassword, normalizedHash)
    if (isSameAsCurrent) {
      return res.status(400).json({ message: 'New password must be different from current password' })
    }

    if (user.previousPassword) {
      const isSameAsPrevious = await bcrypt.compare(newPassword, user.previousPassword)
      if (isSameAsPrevious) {
        return res.status(400).json({ message: 'New password must be different from previous password' })
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.previousPassword = user.password
    user.password = hashedPassword
    user.passwordSource = 'akodemy'
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Password update error:', error)
    res.status(500).json({ message: 'Failed to update password' })
  }
})

export default router
