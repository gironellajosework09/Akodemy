import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, User } from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../services/api'

export default function StudentProfileView() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const [student, setStudent] = useState(null)
  const [competencyData, setCompetencyData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudentData()
  }, [studentId])

  const fetchStudentData = async () => {
    try {
      const [studentRes, competencyRes] = await Promise.all([
        api.get(`/api/faculty/student/${studentId}`),
        api.get(`/api/faculty/student/${studentId}/competencies`)
      ])
      setStudent(studentRes.data)
      setCompetencyData(competencyRes.data)
    } catch (error) {
      console.error('Failed to fetch student:', error)
    } finally {
      setLoading(false)
    }
  }

  const languages = ['javascript', 'python', 'java']

  const getMasteryLevel = (percentage, hasActivity) => {
    if (!hasActivity || percentage === 0) {
      return { label: '', color: 'bg-gray-600', textColor: 'text-gray-500' }
    }
    if (percentage >= 80) return { label: 'Mastered', color: 'bg-green-500', textColor: 'text-green-400' }
    if (percentage >= 40) return { label: 'Developing', color: 'bg-yellow-500', textColor: 'text-yellow-400' }
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

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/faculty/students')}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Students
        </button>

        <div className="flex gap-8">
          <div className="w-72 bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Student Profile</h2>
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg text-white">{student?.name || 'Student Name'}</h3>
              <p className="text-gray-500 text-sm">{student?.email}</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Contact</span>
                <span className="text-gray-300">{student?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sex</span>
                <span className="text-gray-300">{student?.sex || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Birthdate</span>
                <span className="text-gray-300">{student?.birthdate || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-8">
            {languages.map((lang) => {
              const langData = competencyData?.[lang] || []
              const summary = competencyData?.summary?.[lang] || { completed: 0, total: 0 }
              
              return (
                <div key={lang} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                      <img
                        src={getLanguageIcon(lang)}
                        alt={lang}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white uppercase">{lang}</h3>
                  </div>
                  
                  <h4 className="font-semibold mb-4 text-gray-300">Competencies</h4>
                  
                  <div className="space-y-3">
                    {langData.length > 0 ? langData.map((comp) => {
                      const mastery = getMasteryLevel(comp.percentage, comp.hasActivity)
                      return (
                        <div key={comp.name} className="flex items-center gap-4">
                          <span className="w-48 text-sm text-gray-300 flex-shrink-0">{comp.name}</span>
                          <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                            {comp.percentage > 0 && (
                              <div
                                className={`h-4 rounded-full ${mastery.color} transition-all duration-500`}
                                style={{ width: `${comp.percentage}%` }}
                              ></div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">
                            {comp.completed}/{comp.total}
                          </span>
                        </div>
                      )
                    }) : (
                      <p className="text-gray-500 text-sm">No activity yet</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700 justify-center">
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
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
