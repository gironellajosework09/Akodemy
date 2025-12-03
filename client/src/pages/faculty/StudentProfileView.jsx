import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, User } from 'lucide-react'
import api from '../../services/api'

export default function StudentProfileView() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudent()
  }, [studentId])

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/api/faculty/student/${studentId}`)
      setStudent(response.data)
    } catch (error) {
      console.error('Failed to fetch student:', error)
    } finally {
      setLoading(false)
    }
  }

  const languages = ['javascript', 'python']
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-akodemy-purple text-white py-4 px-6">
        <div className="text-lg font-medium">Welcome to Acodemy</div>
      </header>

      <div className="container mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/faculty/students')}
          className="flex items-center gap-1 text-gray-600 hover:text-akodemy-purple mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-8">
          <div className="w-64">
            <h2 className="text-xl font-bold text-akodemy-purple mb-6">Student Profile</h2>
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="font-semibold text-lg">{student?.name || 'Student Name'}</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Email: {student?.email}</p>
              <p>Contact Number: {student?.phone || 'N/A'}</p>
              <p>Sex: {student?.sex || 'N/A'}</p>
              <p>Address: {student?.address || 'N/A'}</p>
              <p>Birthdate: {student?.birthdate || 'N/A'}</p>
              <p>Info: {student?.info || 'N/A'}</p>
            </div>
          </div>

          <div className="flex-1">
            {languages.map((lang) => (
              <div key={lang} className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {lang === 'javascript' && <span className="text-2xl">📜</span>}
                    {lang === 'python' && <span className="text-2xl">🐍</span>}
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
                    const percentage = student?.competencies?.[lang]?.[idx] || Math.floor(Math.random() * 100)
                    const mastery = getMasteryLevel(percentage)
                    return (
                      <div key={comp} className="flex items-center gap-4">
                        <span className="w-48 text-sm">{comp}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full ${mastery.color} transition-all duration-500`}
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
        </div>
      </div>

      <footer className="bg-akodemy-purple text-white py-4 text-center">
        <p>&copy; Copyright 2025. All Rights Reserved.</p>
      </footer>
    </div>
  )
}
