// Express routes for Auth endpoints.
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'
import { sendOtpEmail, generateOtp } from '../services/emailService.js'

// Route handlers for Auth APIs.
const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'akodemy-secret-key-2025'
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET
const SSO_ISSUER = process.env.SSO_ISSUER || 'ccis-portal'
const SSO_AUDIENCE = process.env.SSO_AUDIENCE || 'akodemy'
const SSO_CLOCK_SKEW_SECONDS = Number.parseInt(process.env.SSO_CLOCK_SKEW_SECONDS || '300', 10)
const MAX_FAILED_LOGIN_ATTEMPTS = Number.parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10)
const LOGIN_LOCKOUT_MINUTES = Number.parseInt(process.env.LOGIN_LOCKOUT_MINUTES || '3', 10)
const LOGIN_LOCKOUT_MS = LOGIN_LOCKOUT_MINUTES * 60 * 1000

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

function normalizeBcryptHash(hash) {
  if (!hash) return hash
  if (hash.startsWith('$2y$')) {
    return `$2a$${hash.slice(4)}`
  }
  return hash
}

function mapPortalRole(role) {
  if (role === 'faculty') return 'faculty'
  return 'student'
}

function buildSyncUpdate(payload) {
  const update = {}
  if (payload.name) update.name = payload.name
  if (payload.email) update.email = payload.email
  if (payload.phone) update.phone = payload.phone
  if (payload.address) update.address = payload.address
  if (payload.birthdate) update.birthdate = payload.birthdate
  if (payload.sex) update.sex = payload.sex
  if (payload.portalUserId) update.portalUserId = payload.portalUserId
  if (payload.portalUsername) update.portalUsername = payload.portalUsername
  if (payload.portalRole) update.portalRole = payload.portalRole
  if (payload.role) update.role = mapPortalRole(payload.role)
  return update
}

function verifySyncSecret(req) {
  if (!SSO_SHARED_SECRET) return false
  const signature = req.headers['x-sso-signature']
  const timestamp = req.headers['x-sso-timestamp']
  if (!signature || !timestamp) return false

  const timestampNumber = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(timestampNumber)) return false
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - timestampNumber) > SSO_CLOCK_SKEW_SECONDS) {
    return false
  }

  const body = JSON.stringify(req.body || {})
  const expected = crypto
    .createHmac('sha256', SSO_SHARED_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected, 'hex')
  const signatureBuffer = Buffer.from(signature, 'hex')
  if (expectedBuffer.length !== signatureBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}

router.post('/register', async (req, res) => {
  return res.status(403).json({ 
    message: 'Public registration is disabled. Please contact your administrator to create an account.' 
  })
})

router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body
    const identifier = (email || username || '').trim()

    if (!identifier) {
      return res.status(400).json({ message: 'Email or username is required' })
    }

    let user = await User.findOne({ email: identifier })
    if (!user) {
      user = await User.findOne({ portalUsername: identifier })
    }
    if (!user) {
      user = await User.findOne({ uid: identifier })
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.isActive === false) {
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact an administrator for assistance.' 
      })
    }

    const now = new Date()
    if (user.lockoutUntil && new Date(user.lockoutUntil) > now) {
      return res.status(423).json({
        message: `Too many failed login attempts. This account is locked for ${LOGIN_LOCKOUT_MINUTES} minutes. Please try again later.`,
        lockoutUntil: user.lockoutUntil
      })
    }

    if (user.lockoutUntil && new Date(user.lockoutUntil) <= now) {
      user.lockoutUntil = null
      user.failedLoginAttempts = 0
      await user.save()
    }

    const normalizedHash = normalizeBcryptHash(user.password)
    const isValidPassword = await bcrypt.compare(password, normalizedHash)
    if (!isValidPassword) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOGIN_LOCKOUT_MS)
        user.failedLoginAttempts = 0
        await user.save()
        return res.status(423).json({
          message: `Too many failed login attempts. This account is locked for ${LOGIN_LOCKOUT_MINUTES} minutes. Please try again later.`,
          lockoutUntil: user.lockoutUntil
        })
      }
      await user.save()
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.failedLoginAttempts || user.lockoutUntil) {
      user.failedLoginAttempts = 0
      user.lockoutUntil = null
      await user.save()
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

    const { name, address, phone, birthdate, sex, yearSection } = req.body
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, address, phone, birthdate, sex, yearSection },
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

router.post('/portal-sync', async (req, res) => {
  try {
    if (!SSO_SHARED_SECRET) {
      return res.status(500).json({ message: 'SSO secret not configured' })
    }

    if (!verifySyncSecret(req)) {
      return res.status(401).json({ message: 'Invalid sync signature' })
    }

    const {
      portalUserId,
      portalUsername,
      portalRole,
      email,
      name,
      role,
      passwordHash,
      phone,
      address,
      birthdate,
      sex
    } = req.body || {}

    if (!email || !passwordHash) {
      return res.status(400).json({ message: 'Email and password hash are required' })
    }

    const query = []
    if (portalUserId) query.push({ portalUserId })
    if (email) query.push({ email })

    const update = buildSyncUpdate({
      portalUserId,
      portalUsername,
      portalRole,
      email,
      name,
      role,
      phone,
      address,
      birthdate,
      sex
    })

    update.password = passwordHash
    update.passwordSource = 'ccis'
    update.lastSyncedAt = new Date()

    const user = await User.findOneAndUpdate(
      query.length > 0 ? { $or: query } : { email },
      { $set: update, $setOnInsert: { email } },
      { new: true, upsert: true }
    )

    res.json({ success: true, userId: user._id })
  } catch (error) {
    console.error('Portal sync error:', error)
    res.status(500).json({ message: 'Failed to sync user' })
  }
})

router.post('/sso', async (req, res) => {
  try {
    if (!SSO_SHARED_SECRET) {
      return res.status(500).json({ message: 'SSO secret not configured' })
    }

    const { token } = req.body
    if (!token) {
      return res.status(400).json({ message: 'SSO token is required' })
    }

    let payload
    try {
      payload = jwt.verify(token, SSO_SHARED_SECRET, {
        issuer: SSO_ISSUER,
        audience: SSO_AUDIENCE,
        clockTolerance: SSO_CLOCK_SKEW_SECONDS
      })
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired SSO token' })
    }

    const update = buildSyncUpdate({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      portalUserId: payload.portalUserId,
      portalUsername: payload.portalUsername,
      portalRole: payload.portalRole,
      phone: payload.phone,
      address: payload.address,
      birthdate: payload.birthdate,
      sex: payload.sex
    })

    if (!update.email) {
      return res.status(400).json({ message: 'Email is required in SSO payload' })
    }

    const query = []
    if (update.portalUserId) query.push({ portalUserId: update.portalUserId })
    if (update.email) query.push({ email: update.email })

    let user = await User.findOne(query.length > 0 ? { $or: query } : { email: update.email })

    if (user) {
      Object.assign(user, update)
      user.lastSyncedAt = update.portalUserId ? new Date() : user.lastSyncedAt
      await user.save()
    } else {
      const tempPassword = crypto.randomBytes(18).toString('hex')
      const hashedPassword = await bcrypt.hash(tempPassword, 10)
      user = await User.create({
        ...update,
        password: hashedPassword,
        passwordSource: 'sso-temp'
      })
    }

    const sessionToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
    const userData = user.toObject()
    delete userData.password

    res.json({ token: sessionToken, user: userData })
  } catch (error) {
    console.error('SSO login error:', error)
    res.status(500).json({ message: 'SSO login failed' })
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



