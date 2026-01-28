// Student page: Profile.
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { User, Trophy, Save, Download, Award } from 'lucide-react'
import api from '../../services/api'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import BadgeDisplay from '../../components/BadgeDisplay'
import ConfirmDialog from '../../components/ConfirmDialog'

// Student page logic for Profile.
export default function Profile() {
  const { user, updateUser } = useAuth()
  const userId = user?._id
  const [activeTab, setActiveTab] = useState('info')
  const [progress, setProgress] = useState(null)
  const [competencyScores, setCompetencyScores] = useState(null)
  const [badges, setBadges] = useState([])
  const [badgeProgress, setBadgeProgress] = useState({})
  const [equippedBadge, setEquippedBadge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    phone: user?.phone || '',
    birthdate: user?.birthdate || '',
    sex: user?.sex || '',
    yearSection: user?.yearSection || ''
  })
  const [profileSnapshot, setProfileSnapshot] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false)
  const [pendingTab, setPendingTab] = useState(null)
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
  const [downloading, setDownloading] = useState(false)
  const pdfRef = useRef(null)
  const studentId = profileSnapshot?.student_id
    || user?.student_id
    || profileSnapshot?.portalUsername
    || user?.portalUsername
    || profileSnapshot?.username
    || user?.username
    || ''

  useEffect(() => {
    fetchProgress()
    fetchCompetencyScores()
    fetchBadges()
  }, [])

  useEffect(() => {
    if (user && !profileSnapshot) {
      setFormData({
        name: user.name || '',
        address: user.address || '',
        phone: user.phone || '',
        birthdate: user.birthdate || '',
        sex: user.sex || '',
        yearSection: user.yearSection || ''
      })
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
        sex: profile.sex || '',
        yearSection: profile.yearSection || ''
      })
      updateUser(profile)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      showToast('Failed to load profile.', 'error')
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await api.get('/api/progress/my-progress')
      setProgress(response.data)
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetencyScores = async () => {
    try {
      const response = await api.get('/api/progress/competency-scores')
      setCompetencyScores(response.data)
    } catch (error) {
      console.error('Failed to fetch competency scores:', error)
    }
  }

  const fetchBadges = async () => {
    try {
      const badgesPromise = api.get('/api/badges/my-badges')
      const progressPromise = api.get('/api/badges/progress')

      const badgesRes = await badgesPromise
      const nextBadges = badgesRes.data.badges || []
      setBadges(nextBadges)
      setEquippedBadge(nextBadges.find(badge => badge.equipped) || null)

      const progressRes = await progressPromise
      setBadgeProgress(progressRes.data.progress || {})
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'yearSection') {
      const normalized = value.toUpperCase().replace(/[^1-9A-Z]/g, '').slice(0, 2)
      setFormData(prev => ({ ...prev, [name]: normalized }))
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
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
        sex: response.data.sex || '',
        yearSection: response.data.yearSection || ''
      })
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
      sex: snapshot.sex || '',
      yearSection: snapshot.yearSection || ''
    })
    setIsEditing(false)
    showToast('Edits discarded.', 'info')
  }

  const isYearSectionValid = () => {
    if (!formData.yearSection) return true
    return /^[1-9][A-Z]$/.test(formData.yearSection)
  }

  const handleSaveRequest = () => {
    if (!isYearSectionValid()) {
      showToast('Year must be a number and section must be an uppercase letter.', 'error')
      return
    }
    setShowSaveConfirm(true)
  }

  function hasUnsavedChanges() {
    const snapshot = profileSnapshot || {}
    return ['name', 'address', 'phone', 'birthdate', 'sex', 'yearSection'].some((field) => {
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

  const requestTabChange = (nextTab) => {
    if (nextTab === activeTab) return
    if (isEditing && hasUnsavedChanges()) {
      setPendingTab(nextTab)
      setShowUnsavedConfirm(true)
      return
    }
    exitEditIfPristine()
    setActiveTab(nextTab)
  }

  const handleDiscardAndSwitch = () => {
    setShowUnsavedConfirm(false)
    const snapshot = profileSnapshot || user || {}
    setFormData({
      name: snapshot.name || '',
      address: snapshot.address || '',
      phone: snapshot.phone || '',
      birthdate: snapshot.birthdate || '',
      sex: snapshot.sex || '',
      yearSection: snapshot.yearSection || ''
    })
    setIsEditing(false)
    showToast('Edits discarded.', 'info')
    if (pendingTab === 'password') {
      resetPasswordForm()
      setShowPasswordModal(true)
    } else if (pendingTab) {
      setActiveTab(pendingTab)
    }
    setPendingTab(null)
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

  const downloadPDF = async () => {
    if (!pdfRef.current) return
    setDownloading(true)
    
    try {
      const canvas = await html2canvas(pdfRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const imgWidth = pdfWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pageHeight = pdfHeight - margin * 2

      if (imgHeight <= pageHeight) {
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
      } else {
        const pageHeightPx = Math.floor(canvas.width * pageHeight / imgWidth)
        let offsetY = 0
        let pageIndex = 0

        while (offsetY < canvas.height) {
          const pageCanvas = document.createElement('canvas')
          const pageHeightPxActual = Math.min(pageHeightPx, canvas.height - offsetY)
          pageCanvas.width = canvas.width
          pageCanvas.height = pageHeightPxActual

          const ctx = pageCanvas.getContext('2d')
          if (!ctx) break
          ctx.drawImage(
            canvas,
            0,
            offsetY,
            canvas.width,
            pageHeightPxActual,
            0,
            0,
            canvas.width,
            pageHeightPxActual
          )

          const pageImgData = pageCanvas.toDataURL('image/png')
          const pageImgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width

          if (pageIndex > 0) pdf.addPage()
          pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight)
          offsetY += pageHeightPx
          pageIndex++
        }
      }

      pdf.save(`${user?.name || 'Student'} - Akodemy Competency Report.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  const languages = ['javascript', 'python', 'java']
  const pdfDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })

  const getMasteryInfo = (percentage, hasActivity) => {
    if (!hasActivity || percentage === 0) {
      return { label: '', color: 'bg-gray-600', textColor: 'text-gray-500' }
    }
    if (percentage >= 80) {
      return { label: 'Mastered', color: 'bg-green-500', textColor: 'text-green-400' }
    }
    if (percentage >= 40) {
      return { label: 'Developing', color: 'bg-yellow-500', textColor: 'text-yellow-400' }
    }
    return { label: 'Needs Practice', color: 'bg-red-500', textColor: 'text-red-400' }
  }

  const getCompetencyScoreMastery = (score) => {
    if (score === 0) {
      return { label: 'Not Started', color: 'bg-gray-600', textColor: 'text-gray-500' }
    }
    if (score >= 80) {
      return { label: 'Mastered', color: 'bg-green-500', textColor: 'text-green-400' }
    }
    if (score >= 50) {
      return { label: 'Developing', color: 'bg-yellow-500', textColor: 'text-yellow-400' }
    }
    if (score >= 20) {
      return { label: 'Needs Practice', color: 'bg-orange-500', textColor: 'text-orange-400' }
    }
    return { label: 'Beginning', color: 'bg-red-500', textColor: 'text-red-400' }
  }

  const COMPETENCY_INDEX_TO_KEY = {
    0: 'variables',
    1: 'controlStructures',
    2: 'functions',
    3: 'arrays',
    4: 'oop',
    5: 'errorHandling'
  }

  const getLanguageIcon = (lang) => {
    switch (lang) {
      case 'javascript': return '/images/js-logo.png'
      case 'python': return '/images/python-logo.png'
      case 'java': return '/images/java-logo.png'
      default: return '💻'
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <div className="w-full lg:w-64 bg-gray-800 border border-gray-700 rounded-xl p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6">My Profile</h2>
            <nav className="flex lg:flex-col gap-2">
              <button
                onClick={() => requestTabChange('info')}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-lg transition text-sm lg:text-base ${
                  activeTab === 'info' 
                    ? 'bg-akodemy-purple text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline lg:inline">User Info</span>
              </button>
              <button
                onClick={() => requestTabChange('achievements')}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-lg transition text-sm lg:text-base ${
                  activeTab === 'achievements' 
                    ? 'bg-akodemy-purple text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline lg:inline">Competencies</span>
              </button>
              <button
                onClick={() => requestTabChange('badges')}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-lg transition text-sm lg:text-base ${
                  activeTab === 'badges' 
                    ? 'bg-akodemy-purple text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline lg:inline">Badges</span>
              </button>
            </nav>
          </div>

          <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 lg:p-8">
            {activeTab === 'info' && (
              <div>
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">{user?.name || 'Student Name'}</h3>
                    <p className="text-gray-500 text-sm">Student ID: {studentId || 'N/A'}</p>
                    {equippedBadge && (
                      <p className="text-yellow-400 text-sm font-medium flex items-center justify-center sm:justify-start gap-1">
                        <Award className="w-3 h-3" />
                        {equippedBadge.badgeName}
                      </p>
                    )}
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
                          setPendingTab('password')
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
                    <label className="block text-gray-400 mb-2 text-sm">Year & Section</label>
                    <input
                      type="text"
                      name="yearSection"
                      value={formData.yearSection}
                      onChange={handleChange}
                      placeholder="e.g., 2A"
                      maxLength={2}
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
                    <input
                      type="date"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
                    />
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

                <div className="mt-6 sm:mt-8 flex flex-wrap justify-end gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRequest}
                        disabled={saving}
                        className="flex items-center gap-2 bg-akodemy-purple text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition text-sm sm:text-base"
                      >
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-akodemy-purple text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition text-sm sm:text-base"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'achievements' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">My Competencies</h3>
                  <button
                    onClick={downloadPDF}
                    disabled={downloading || loading}
                    className="flex items-center gap-2 bg-akodemy-purple text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition text-sm"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>

                <div className="space-y-8 sm:space-y-12">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
                    </div>
                  ) : (
                    languages.map((lang) => {
                      const langProgress = progress?.competencies?.[lang] || []
                      const summary = progress?.summary?.[lang] || { completed: 0, total: 0 }
                      
                      return (
                        <div key={lang}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                                <img
                                  src={getLanguageIcon(lang)}
                                  alt={lang}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <h3 className="text-lg sm:text-xl font-bold text-white uppercase">{lang}</h3>
                            </div>

                            <div className="text-xs sm:text-sm text-gray-400">
                              {summary.completed} / {summary.total} challenges completed
                            </div>
                          </div>
                          
                          <h4 className="font-semibold mb-4 text-gray-300 text-sm sm:text-base">Competency Scores</h4>
                          
                          <div className="space-y-3">
                            {langProgress.map((comp) => {
                              const competencyKey = COMPETENCY_INDEX_TO_KEY[comp.index]
                              const scoreData = competencyScores?.scores?.[lang]?.[competencyKey]
                              const score = scoreData?.score || 0
                              const mastery = getCompetencyScoreMastery(score)
                              
                              return (
                                <div key={comp.index} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                  <span className="text-xs sm:text-sm text-gray-300 sm:w-48 sm:flex-shrink-0">{comp.name}</span>
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="flex-1 bg-gray-700 rounded-full h-3 sm:h-4 relative overflow-hidden">
                                      {score > 0 && (
                                        <div
                                          className={`h-full rounded-full ${mastery.color} transition-all duration-500`}
                                          style={{ width: `${Math.min(score, 100)}%` }}
                                        ></div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-medium ${mastery.textColor} w-10 text-right`}>
                                        {Math.round(score)}%
                                      </span>
                                      <span className="text-xs text-gray-500 w-12 text-right" title="Challenges completed">
                                        ({comp.completed}/{comp.total})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-gray-700 justify-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                              <span className="text-xs text-gray-500">0%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-xs text-gray-400">1-19%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              <span className="text-xs text-gray-400">20-49%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="text-xs text-gray-400">50-79%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-xs text-gray-400">80-100%</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-4 text-center">
                            Competency scores update based on your performance. Correct submissions increase your score, while incorrect attempts decrease it.
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>

                <div
                  ref={pdfRef}
                  className="fixed left-[-9999px] top-0 w-[794px] bg-white text-gray-900 p-10"
                >
                  <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Akodemy</p>
                      <h1 className="text-2xl font-bold text-gray-900">Competency Report</h1>
                      <p className="text-xs text-gray-500">Generated {pdfDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{user?.name || 'Student'}</p>
                      <p className="text-xs text-gray-500">{user?.email || ''}</p>
                      <p className="text-xs text-gray-500">Student ID: {studentId || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Badge: {equippedBadge?.badgeName || 'None'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {languages.map((lang) => {
                      const summary = progress?.summary?.[lang] || { completed: 0, total: 0 }
                      return (
                        <div key={`${lang}-summary`} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase text-gray-700">{lang}</span>
                            <span className="text-xs text-gray-500">{summary.completed}/{summary.total}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-akodemy-purple"
                              style={{ width: summary.total > 0 ? `${Math.round((summary.completed / summary.total) * 100)}%` : '0%' }}
                            ></div>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-2">Completed challenges</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 space-y-6">
                    {loading ? (
                      <p className="text-sm text-gray-500">Loading achievement data...</p>
                    ) : (
                      languages.map((lang) => {
                        const langProgress = progress?.competencies?.[lang] || []
                        const summary = progress?.summary?.[lang] || { completed: 0, total: 0 }

                        return (
                          <div key={`${lang}-details`} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6">
                                  <img
                                    src={getLanguageIcon(lang)}
                                    alt={lang}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <h2 className="text-sm font-semibold uppercase text-gray-800">{lang}</h2>
                              </div>
                              <span className="text-xs text-gray-500">{summary.completed} / {summary.total} completed</span>
                            </div>

                            {langProgress.length === 0 ? (
                              <p className="text-xs text-gray-500">No activity yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {langProgress.map((comp) => {
                                  const mastery = getMasteryInfo(comp.percentage, comp.hasActivity)

                                  return (
                                    <div key={`${lang}-${comp.index}`} className="flex items-center gap-3">
                                      <span className="text-xs text-gray-700 w-44">{comp.name}</span>
                                      <div className="flex-1">
                                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                          {comp.percentage > 0 && (
                                            <div
                                              className={`h-full ${mastery.color}`}
                                              style={{ width: `${comp.percentage}%` }}
                                            ></div>
                                          )}
                                        </div>
                                      </div>
                                      <span className="text-xs text-gray-500 w-14 text-right">
                                        {comp.completed}/{comp.total}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'badges' && (
              <div>
                <BadgeDisplay badges={badges} progress={badgeProgress} onRefresh={fetchBadges} />
              </div>
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
        onConfirm={handleDiscardAndSwitch}
        onCancel={() => {
          setShowUnsavedConfirm(false)
          setPendingTab(null)
        }}
      />
    </Layout>
  )
}
