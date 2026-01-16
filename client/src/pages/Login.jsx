// Login and password reset flow UI.
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Code2, ArrowLeft, Check, X, AlertCircle } from 'lucide-react'
import api from '../services/api'

// Page logic for Login.
function PasswordStrengthIndicator({ password }) {
  const getStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) score++
    
    if (score <= 2) return { level: 'Weak', color: 'bg-red-500', width: '33%' }
    if (score <= 4) return { level: 'Medium', color: 'bg-yellow-500', width: '66%' }
    return { level: 'Strong', color: 'bg-green-500', width: '100%' }
  }

  const strength = getStrength()
  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Password strength</span>
        <span className={strength.level === 'Weak' ? 'text-red-400' : strength.level === 'Medium' ? 'text-yellow-400' : 'text-green-400'}>
          {strength.level}
        </span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: strength.width }}
        />
      </div>
    </div>
  )
}

function PasswordRequirements({ password }) {
  const requirements = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="mt-3 space-y-1">
      {requirements.map((req, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          {req.valid ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <X className="w-3.5 h-3.5 text-gray-500" />
          )}
          <span className={req.valid ? 'text-green-400' : 'text-gray-500'}>{req.label}</span>
        </div>
      ))}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
}

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-akodemy-purple text-white rounded-lg hover:bg-purple-700 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [otpExpiry, setOtpExpiry] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  const otpRefs = useRef([])
  const { login, register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (otpExpiry) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(otpExpiry) - new Date()) / 1000))
        setTimeLeft(remaining)
        if (remaining === 0) {
          clearInterval(interval)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [otpExpiry])

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const user = await login(email, password)
      navigate(user.role === 'faculty' ? '/faculty' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const user = await register({ name, email, password, role })
      navigate(user.role === 'faculty' ? '/faculty' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const response = await api.post('/api/auth/forgot-password', { email })
      setOtpExpiry(response.data.expiresAt)
      setMode('otp')
      setSuccess('OTP sent to your email')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.charAt(0)
    value = value.toUpperCase()
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setOtpError(false)
    
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setOtpError(true)
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await api.post('/api/auth/verify-otp', { email, otp: otpCode })
      setResetToken(response.data.resetToken)
      setShowConfirmDialog(true)
    } catch (err) {
      setOtpError(true)
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmProceed = () => {
    setShowConfirmDialog(false)
    setMode('reset')
    setError('')
    setSuccess('')
  }

  const handleResendOtp = async () => {
    setLoading(true)
    setError('')
    setOtp(['', '', '', '', '', ''])
    
    try {
      const response = await api.post('/api/auth/resend-otp', { email })
      setOtpExpiry(response.data.expiresAt)
      setSuccess('New OTP sent to your email')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    
    try {
      await api.post('/api/auth/reset-password', {
        resetToken,
        newPassword,
        confirmPassword
      })
      setSuccess('Password reset successfully!')
      setTimeout(() => {
        setMode('login')
        setEmail('')
        setPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setOtp(['', '', '', '', '', ''])
        setResetToken('')
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <nav className="px-6 py-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-akodemy-purple rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Akodemy</span>
          </Link>
          <Link 
            to="/" 
            className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Forgot Password'}
              {mode === 'otp' && 'Verify OTP'}
              {mode === 'reset' && 'Reset Password'}
            </h1>
            <p className="text-gray-400">
              {mode === 'login' && 'Sign in to continue your coding journey'}
              {mode === 'register' && 'Start your coding journey with Akodemy'}
              {mode === 'forgot' && 'Enter your email to receive a reset code'}
              {mode === 'otp' && 'Enter the 6-character code sent to your email'}
              {mode === 'reset' && 'Create your new password'}
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
            {(mode === 'login' || mode === 'register') && (
              <div className="flex mb-6 bg-gray-900 rounded-lg p-1">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-2.5 rounded-lg transition font-medium text-sm ${
                    mode === 'login' 
                      ? 'bg-akodemy-purple text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-2.5 rounded-lg transition font-medium text-sm ${
                    mode === 'register' 
                      ? 'bg-akodemy-purple text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {success}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent transition"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent pr-12 transition"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-akodemy-purple hover:text-purple-400 text-sm transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-akodemy-purple text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      <span>Signing in...</span>
                    </>
                  ) : 'Sign In'}
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent transition"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent transition"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent pr-12 transition"
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                  <PasswordRequirements password={password} />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent transition"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-akodemy-purple text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      <span>Creating account...</span>
                    </>
                  ) : 'Create Account'}
                </button>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent transition"
                    placeholder="Enter your registered email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-akodemy-purple text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      <span>Sending OTP...</span>
                    </>
                  ) : 'Send Reset Code'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="w-full text-gray-400 hover:text-white py-2 transition text-sm"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {mode === 'otp' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-4 text-sm font-medium text-center">
                    Enter 6-character code
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => otpRefs.current[index] = el}
                        type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        maxLength={1}
                        className={`w-12 h-14 text-center text-xl font-bold bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple transition ${
                          otpError 
                            ? 'border-red-500 animate-shake' 
                            : 'border-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {timeLeft > 0 ? (
                    <p className="text-gray-400 text-sm">
                      Code expires in <span className="text-akodemy-purple font-medium">{formatTime(timeLeft)}</span>
                    </p>
                  ) : (
                    <p className="text-red-400 text-sm">Code expired</p>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-akodemy-purple text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      <span>Verifying...</span>
                    </>
                  ) : 'Verify Code'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || timeLeft > 0}
                  className="w-full text-akodemy-purple hover:text-purple-400 py-2 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {timeLeft > 0 ? 'Wait for code to expire to resend' : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setOtp(['', '', '', '', '', '']); }}
                  className="w-full text-gray-400 hover:text-white py-2 transition text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent pr-12 transition"
                      placeholder="Create a new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={newPassword} />
                  <PasswordRequirements password={newPassword} />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent pr-12 transition ${
                        confirmPassword && confirmPassword !== newPassword 
                          ? 'border-red-500' 
                          : 'border-gray-700'
                      }`}
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword !== confirmPassword}
                  className="w-full bg-akodemy-purple text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      <span>Resetting password...</span>
                    </>
                  ) : 'Reset Password'}
                </button>
              </form>
            )}

            {(mode === 'login' || mode === 'register') && (
              <p className="text-center text-gray-500 text-sm mt-6">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                  className="text-akodemy-purple hover:text-purple-400 transition font-medium"
                >
                  {mode === 'login' ? 'Register' : 'Sign In'}
                </button>
              </p>
            )}
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            By continuing, you agree to Akodemy's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Proceed to Reset Password?"
        message="Your OTP has been verified. Click Confirm to proceed to reset your password."
        onConfirm={handleConfirmProceed}
        onCancel={() => setShowConfirmDialog(false)}
      />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}



