// Student page: Profile.
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { User, Trophy, Save, Check, Download, Award } from 'lucide-react'
import api from '../../services/api'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import BadgeDisplay from '../../components/BadgeDisplay'

// Student page logic for Profile.
export default function Profile() {
  const { user, setUser } = useAuth()
  const [activeTab, setActiveTab] = useState('info')
  const [progress, setProgress] = useState(null)
  const [badges, setBadges] = useState([])
  const [badgeProgress, setBadgeProgress] = useState({})
  const [equippedBadge, setEquippedBadge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    phone: user?.phone || '',
    birthdate: user?.birthdate || '',
    sex: user?.sex || ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const achievementsRef = useRef(null)

  useEffect(() => {
    fetchProgress()
    fetchBadges()
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        address: user.address || '',
        phone: user.phone || '',
        birthdate: user.birthdate || '',
        sex: user.sex || ''
      })
    }
  }, [user])

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

  const fetchBadges = async () => {
    try {
      const [badgesRes, progressRes, equippedRes] = await Promise.all([
        api.get('/api/badges/my-badges'),
        api.get('/api/badges/progress'),
        api.get('/api/badges/equipped')
      ])
      setBadges(badgesRes.data.badges || [])
      setBadgeProgress(progressRes.data.progress || {})
      setEquippedBadge(equippedRes.data.badge || null)
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put('/api/auth/profile', formData)
      setUser(response.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const downloadPDF = async () => {
    if (!achievementsRef.current) return
    setDownloading(true)
    
    try {
      const canvas = await html2canvas(achievementsRef.current, {
        backgroundColor: '#111827',
        scale: 2
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.setFillColor(17, 24, 39)
      pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F')
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight)
      pdf.save(`${user?.name || 'student'}-achievements.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  const languages = ['javascript', 'python', 'java']

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
                onClick={() => setActiveTab('info')}
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
                onClick={() => setActiveTab('achievements')}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-lg transition text-sm lg:text-base ${
                  activeTab === 'achievements' 
                    ? 'bg-akodemy-purple text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline lg:inline">Achievements</span>
              </button>
              <button
                onClick={() => setActiveTab('badges')}
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
                    {equippedBadge && (
                      <p className="text-yellow-400 text-sm font-medium flex items-center justify-center sm:justify-start gap-1">
                        <Award className="w-3 h-3" />
                        {equippedBadge.badgeName}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm">UID: {user?._id?.slice(-10) || 'XXXXXXXXXX'}</p>
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
                    <label className="block text-gray-400 mb-2 text-sm">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your address"
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
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2 text-sm">Sex</label>
                    <select
                      name="sex"
                      value={formData.sex}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-akodemy-purple text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition text-sm sm:text-base"
                  >
                    {saved ? (
                      <>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'achievements' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">My Achievements</h3>
                  <button
                    onClick={downloadPDF}
                    disabled={downloading || loading}
                    className="flex items-center gap-2 bg-akodemy-purple text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition text-sm"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>

                <div ref={achievementsRef} className="space-y-8 sm:space-y-12">
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
                          
                          <h4 className="font-semibold mb-4 text-gray-300 text-sm sm:text-base">Competencies</h4>
                          
                          <div className="space-y-3">
                            {langProgress.map((comp) => {
                              const mastery = getMasteryInfo(comp.percentage, comp.hasActivity)
                              
                              return (
                                <div key={comp.index} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                  <span className="text-xs sm:text-sm text-gray-300 sm:w-48 sm:flex-shrink-0">{comp.name}</span>
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="flex-1 bg-gray-700 rounded-full h-3 sm:h-4 relative overflow-hidden">
                                      {comp.percentage > 0 && (
                                        <div
                                          className={`h-full rounded-full ${mastery.color} transition-all duration-500`}
                                          style={{ width: `${comp.percentage}%` }}
                                        ></div>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-400 w-12 text-right">
                                      {comp.completed}/{comp.total}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-gray-700 justify-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                              <span className="text-xs text-gray-500">Not Started</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-xs text-gray-400">Needs Practice</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="text-xs text-gray-400">Developing</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-xs text-gray-400">Mastered</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
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
    </Layout>
  )
}



