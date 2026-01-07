import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'
import { sendOtpEmail, generateOtp } from '../services/emailService.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'akodemy-secret-key-2025'

function validatePassword(password) {
  const errors = []
  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('At least one number')
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) errors.push('At least one special character')
  return errors
}

function getPasswordStrength(password) {
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

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Password does not meet requirements',
        errors: passwordErrors
      })
    }

    const strength = getPasswordStrength(password)
    if (strength === 'weak') {
      return res.status(400).json({ message: 'Password is too weak. Please use a stronger password.' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    })

    await user.save()

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
    const userData = user.toObject()
    delete userData.password

    res.status(201).json({ token, user: userData })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
    const userData = user.toObject()
    delete userData.password

    res.json({ token, user: userData })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    const { name, address, phone, birthdate, sex } = req.body
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, address, phone, birthdate, sex },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' })
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000)

    user.resetOtp = { code: otp, expiresAt }
    await user.save()

    const result = await sendOtpEmail(email, otp)
    if (!result.success) {
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' })
    }

    res.json({ message: 'OTP sent to your email address', expiresAt })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Failed to process request' })
  }
})

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.resetOtp || !user.resetOtp.code) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new code.' })
    }

    if (new Date() > new Date(user.resetOtp.expiresAt)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' })
    }

    if (user.resetOtp.code !== otp.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid OTP code' })
    }

    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '10m' }
    )

    res.json({ message: 'OTP verified successfully', resetToken })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ message: 'Failed to verify OTP' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body

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

    let decoded
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET)
    } catch {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please start over.' })
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password)
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
    user.resetOtp = undefined
    await user.save()

    res.json({ message: 'Password reset successfully. You can now login with your new password.' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ message: 'Failed to reset password' })
  }
})

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' })
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000)

    user.resetOtp = { code: otp, expiresAt }
    await user.save()

    const result = await sendOtpEmail(email, otp)
    if (!result.success) {
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' })
    }

    res.json({ message: 'New OTP sent to your email address', expiresAt })
  } catch (error) {
    console.error('Resend OTP error:', error)
    res.status(500).json({ message: 'Failed to resend OTP' })
  }
})

export default router
