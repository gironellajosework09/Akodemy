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
  const competencies = [
    'Variables & Data Types',
    'Control Structures',
    'Functions',
    'Arrays & Collections',
    'Object-Oriented Programming',
    'Error Handling'
  ]

  const getMasteryLevel = (percentage) => {
    if (percentage >= 80) return { label: 'Mastered', color: 'bg-green-500' }
    if (percentage >= 40) return { label: 'Developing', color: 'bg-yellow-500' }
    return { label: 'Needs Practice', color: 'bg-red-500' }
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
              {languages.map((lang) => (
                <div key={lang}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {lang === 'javascript' && (
                        <span className="text-2xl">📜</span>
                      )}
                      {lang === 'python' && (
                        <span className="text-2xl">🐍</span>
                      )}
                      {lang === 'java' && (
                        <span className="text-2xl">☕</span>
                      )}
                      <h3 className="text-xl font-bold text-akodemy-purple uppercase">{lang}</h3>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                  <h4 className="font-semibold mb-4">Competencies</h4>
                  <div className="space-y-3">
                    {competencies.map((comp, idx) => {
                      const userCompetencies = user?.competencies?.[lang] || [0, 0, 0, 0, 0, 0]
                      const percentage = userCompetencies[idx] || 0
                      const mastery = getMasteryLevel(percentage)
                      return (
                        <div key={comp} className="flex items-center gap-4">
                          <span className="w-40 text-sm">{comp}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full ${mastery.color} mastery-bar`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>Needs Practice</span>
                    <span>Developing</span>
                    <span>Mastered</span>
                  </div>
                  <p className="text-center text-gray-600 mt-2 font-semibold">Mastery</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
