// Faculty page: Profile.
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { User, Save, Calendar } from 'lucide-react'
import api from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'

// Faculty page logic for Profile.
export default function FacultyProfile() {
  const { user, updateUser } = useAuth()
  const userId = user?._id
  const todayISO = (() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()
  const formatBirthdateDisplay = (value) => {
    if (!value) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-')
      return `${month}/${day}/${year}`
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return value
    }
    return value
  }

  const parseBirthdateInput = (value) => {
    const normalized = value.trim()
    if (!normalized) return ''
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) return ''
    const [month, day, year] = normalized.split('/').map(Number)
    const date = new Date(year, month - 1, day)
    const isValidDate = !Number.isNaN(date.getTime())
      && date.getFullYear() === year
      && date.getMonth() === month - 1
      && date.getDate() === day
    if (!isValidDate) return ''
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  const [birthdateInput, setBirthdateInput] = useState(() => formatBirthdateDisplay(user?.birthdate || ''))
  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    phone: user?.phone || '',
    birthdate: user?.birthdate || '',
    sex: user?.sex || ''
  })
  const [profileSnapshot, setProfileSnapshot] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const birthdatePickerRef = useRef(null)

  useEffect(() => {
    if (user && !profileSnapshot) {
      setFormData({
        name: user.name || '',
        address: user.address || '',
        phone: user.phone || '',
        birthdate: user.birthdate || '',
        sex: user.sex || ''
      })
      setBirthdateInput(formatBirthdateDisplay(user.birthdate || ''))
      setProfileSnapshot(user)
    }
  }, [user, profileSnapshot])

  useEffect(() => {
    if (!userId) return
    fetchProfile()
  }, [userId])

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 2000)
  }

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordError('')
  }

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/users/me')
      const profile = response.data
      setProfileSnapshot(profile)
      setFormData({
        name: profile.name || '',
        address: profile.address || '',
        phone: profile.phone || '',
        birthdate: profile.birthdate || '',
        sex: profile.sex || ''
      })
      setBirthdateInput(formatBirthdateDisplay(profile.birthdate || ''))
      updateUser(profile)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      showToast('Failed to load profile.', 'error')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBirthdateInput = (e) => {
    const { value } = e.target
    setBirthdateInput(value)
    const isoValue = parseBirthdateInput(value)
    setFormData(prev => ({ ...prev, birthdate: isoValue }))
  }

  const handleBirthdatePicker = (e) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, birthdate: value }))
    setBirthdateInput(formatBirthdateDisplay(value))
  }

  const openBirthdatePicker = () => {
    if (!isEditing) return
    const picker = birthdatePickerRef.current
    if (!picker) return
    if (typeof picker.showPicker === 'function') {
      picker.showPicker()
      return
    }
    picker.focus()
    picker.click()
  }

  const handleSaveConfirm = async () => {
    setShowSaveConfirm(false)
    setSaving(true)
    try {
      const response = await api.patch('/api/users/me', formData)
      updateUser(response.data)
      setProfileSnapshot(response.data)
      setFormData({
        name: response.data.name || '',
        address: response.data.address || '',
        phone: response.data.phone || '',
        birthdate: response.data.birthdate || '',
        sex: response.data.sex || ''
      })
      setBirthdateInput(formatBirthdateDisplay(response.data.birthdate || ''))
      setIsEditing(false)
      showToast('Changes saved successfully.', 'success')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save changes.'
      console.error('Failed to save profile:', error)
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEditConfirm = () => {
    setShowCancelConfirm(false)
    const snapshot = profileSnapshot || user || {}
    setFormData({
      name: snapshot.name || '',
      address: snapshot.address || '',
      phone: snapshot.phone || '',
      birthdate: snapshot.birthdate || '',
      sex: snapshot.sex || ''
    })
    setBirthdateInput(formatBirthdateDisplay(snapshot.birthdate || ''))
    setIsEditing(false)
    showToast('Edits discarded.', 'info')
  }

  const getBirthdateError = () => {
    if (!birthdateInput.trim()) return ''
    const isoValue = parseBirthdateInput(birthdateInput)
    if (!isoValue) {
      return 'Please enter a valid birthdate.'
    }
    if (isoValue > todayISO) {
      return 'Birthdate cannot be in the future.'
    }
    return ''
  }

  const handleSaveRequest = () => {
    const birthdateError = getBirthdateError()
    if (birthdateError) {
      showToast(birthdateError, 'error')
      return
    }
    setShowSaveConfirm(true)
  }

  function hasUnsavedChanges() {
    const snapshot = profileSnapshot || {}
    const snapshotBirthdate = formatBirthdateDisplay(snapshot.birthdate || '')
    if ((birthdateInput || '') !== snapshotBirthdate) return true
    return ['name', 'address', 'phone', 'sex'].some((field) => {
      const currentValue = formData[field] || ''
      const savedValue = snapshot[field] || ''
      return currentValue !== savedValue
    })
  }

  const exitEditIfPristine = () => {
    if (isEditing && !hasUnsavedChanges()) {
      setIsEditing(false)
      return true
    }
    return false
  }

  const handleDiscardAndProceed = () => {
    setShowUnsavedConfirm(false)
    const snapshot = profileSnapshot || user || {}
    setFormData({
      name: snapshot.name || '',
      address: snapshot.address || '',
      phone: snapshot.phone || '',
      birthdate: snapshot.birthdate || '',
      sex: snapshot.sex || ''
    })
    setBirthdateInput(formatBirthdateDisplay(snapshot.birthdate || ''))
    setIsEditing(false)
    showToast('Edits discarded.', 'info')
    if (pendingAction === 'password') {
      resetPasswordForm()
      setShowPasswordModal(true)
    }
    setPendingAction(null)
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
    if (passwordError) setPasswordError('')
  }

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordSaving(true)
    try {
      await api.patch('/api/users/me/password', passwordForm)
      setShowPasswordModal(false)
      resetPasswordForm()
      showToast('Password updated successfully.', 'success')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password.'
      setPasswordError(message)
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">My Profile</h1>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-white">{user?.name || 'Faculty Name'}</h3>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-akodemy-purple/20 text-akodemy-purple text-xs rounded">Faculty</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                readOnly={!isEditing}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                readOnly
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Password</label>
              <input
                type="password"
                value="********"
                readOnly
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => {
                  if (isEditing && hasUnsavedChanges()) {
                    setPendingAction('password')
                    setShowUnsavedConfirm(true)
                    return
                  }
                  exitEditIfPristine()
                  resetPasswordForm()
                  setShowPasswordModal(true)
                }}
                className="mt-2 text-sm text-akodemy-purple hover:text-purple-400 transition"
              >
                Change Password
              </button>
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
                readOnly={!isEditing}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Contact Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                readOnly={!isEditing}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Birthdate</label>
              <div className="relative">
                <input
                  type="text"
                  name="birthdate"
                  value={birthdateInput}
                  onChange={handleBirthdateInput}
                  placeholder="MM/DD/YYYY"
                  inputMode="numeric"
                  disabled={!isEditing}
                  className="w-full px-4 py-3 pr-10 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={openBirthdatePicker}
                  disabled={!isEditing}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition ${
                    isEditing ? 'text-white hover:text-gray-200' : 'text-gray-500 cursor-not-allowed'
                  }`}
                  aria-label="Open date picker"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <input
                  ref={birthdatePickerRef}
                  type="date"
                  value={formData.birthdate}
                  onChange={handleBirthdatePicker}
                  max={todayISO}
                  disabled={!isEditing}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRequest}
                  disabled={saving}
                  className="flex items-center gap-2 bg-akodemy-purple text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-akodemy-purple text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.tone === 'error'
              ? 'bg-red-500/90 text-white'
              : toast.tone === 'info'
                ? 'bg-gray-700 text-white'
                : 'bg-green-500/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-page-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          ></div>
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-modal-in">
            <h3 className="text-xl font-bold text-white mb-2">Change Password</h3>
            <p className="text-gray-400 mb-6">Update your password to keep your account secure.</p>

            {passwordError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  resetPasswordForm()
                }}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordSave}
                disabled={passwordSaving}
                className="px-4 py-2 rounded-lg bg-akodemy-purple text-white hover:bg-purple-700 transition disabled:opacity-50"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showSaveConfirm}
        title="Confirm Save"
        message="Confirm save changes?"
        onConfirm={handleSaveConfirm}
        onCancel={() => {
          setShowSaveConfirm(false)
          showToast('Save cancelled.', 'info')
        }}
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Changes"
        message="Discard changes?"
        confirmLabel="Yes, discard"
        cancelLabel="No, continue editing"
        onConfirm={handleCancelEditConfirm}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showUnsavedConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Continue editing or discard changes?"
        confirmLabel="Discard changes"
        cancelLabel="Continue editing"
        onConfirm={handleDiscardAndProceed}
        onCancel={() => {
          setShowUnsavedConfirm(false)
          setPendingAction(null)
        }}
      />
    </Layout>
  )
}



