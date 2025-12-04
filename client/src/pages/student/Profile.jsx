import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { User, Trophy } from 'lucide-react'
import api from '../../services/api'

export default function Profile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('info')
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

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

  const languages = ['javascript', 'python', 'java']

  const getMasteryInfo = (percentage, hasActivity) => {
    if (!hasActivity || percentage === 0) {
      return { label: '', color: 'bg-gray-300', textColor: 'text-gray-400' }
    }
    if (percentage >= 80) {
      return { label: 'Mastered', color: 'bg-green-500', textColor: 'text-green-600' }
    }
    if (percentage >= 40) {
      return { label: 'Developing', color: 'bg-yellow-500', textColor: 'text-yellow-600' }
    }
    return { label: 'Needs Practice', color: 'bg-red-500', textColor: 'text-red-600' }
  }

  const getLanguageIcon = (lang) => {
    switch (lang) {
      case 'javascript': return '📜'
      case 'python': return '🐍'
      case 'java': return '☕'
      default: return '💻'
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-8 py-8 flex gap-8">
        <div className="w-64 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-akodemy-purple mb-6">My Profile</h2>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('info')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'info' 
                  ? 'bg-akodemy-purple text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              User Information
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                activeTab === 'achievements' 
                  ? 'bg-akodemy-purple text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Trophy className="w-5 h-5" />
              My Achievements
            </button>
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow p-8">
          {activeTab === 'info' ? (
            <div>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-akodemy-purple">{user?.name || 'Student Name'}</h3>
                  <p className="text-gray-500">UID: {user?._id?.slice(-10) || 'XXXXXXXXXX'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-600 mb-2">Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Email</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Address</label>
                  <input
                    type="text"
                    value={user?.address || 'Not provided'}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={user?.phone || 'Not provided'}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Birthdate</label>
                  <input
                    type="text"
                    value={user?.birthdate || 'Not provided'}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Sex</label>
                  <input
                    type="text"
                    value={user?.sex || 'Not provided'}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
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
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getLanguageIcon(lang)}</span>
                          <h3 className="text-xl font-bold text-akodemy-purple uppercase">{lang}</h3>
                        </div>
                        <div className="text-sm text-gray-500">
                          {summary.completed} / {summary.total} challenges completed
                        </div>
                      </div>
                      
                      <h4 className="font-semibold mb-4">Competencies</h4>
                      
                      <div className="space-y-3">
                        {langProgress.map((comp) => {
                          const mastery = getMasteryInfo(comp.percentage, comp.hasActivity)
                          
                          return (
                            <div key={comp.index} className="flex items-center gap-4">
                              <span className="w-48 text-sm flex-shrink-0">{comp.name}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                                {comp.percentage > 0 && (
                                  <div
                                    className={`h-4 rounded-full ${mastery.color} transition-all duration-500`}
                                    style={{ width: `${comp.percentage}%` }}
                                  ></div>
                                )}
                              </div>
                              <div className="w-32 flex items-center justify-end gap-2">
                                <span className="text-xs text-gray-500">
                                  {comp.completed}/{comp.total}
                                </span>
                                {mastery.label && (
                                  <span className={`text-xs font-medium ${mastery.textColor}`}>
                                    {mastery.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      
                      <div className="flex items-center gap-6 mt-4 pt-4 border-t justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                          <span className="text-xs text-gray-500">Not Started</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-xs text-gray-600">Needs Practice (1-39%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-xs text-gray-600">Developing (40-79%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-600">Mastered (80-100%)</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
