import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { Users, Trophy, Code, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../services/api'

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalStudents: 0,
    completionists: 0,
    languagesActive: 3
  })
  const [languageData, setLanguageData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/api/faculty/analytics')
      setStats(response.data.stats || stats)
      setLanguageData(response.data.languageEngagement || [
        { name: 'Python', students: 45 },
        { name: 'JavaScript', students: 38 }
      ])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setLanguageData([
        { name: 'Python', students: 45 },
        { name: 'JavaScript', students: 38 }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl text-akodemy-purple italic mb-2">Welcome to</h2>
          <h1 className="text-5xl font-bold text-akodemy-purple mb-2">AKODEMY</h1>
          <h3 className="text-2xl font-bold text-akodemy-purple">Practice. Learn. Master Coding!</h3>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => navigate('/faculty/students')}
            className="bg-purple-100 p-6 rounded-xl flex flex-col items-center cursor-pointer hover:shadow-lg transition"
          >
            <Users className="w-12 h-12 text-akodemy-purple mb-2" />
            <p className="text-gray-600">Total Students</p>
            <p className="text-4xl font-bold text-akodemy-purple">{stats.totalStudents}</p>
          </div>
          <div className="bg-purple-100 p-6 rounded-xl flex flex-col items-center">
            <Trophy className="w-12 h-12 text-yellow-500 mb-2" />
            <p className="text-gray-600">Completionist</p>
            <p className="text-4xl font-bold text-akodemy-purple">{stats.completionists}</p>
          </div>
          <div className="bg-purple-100 p-6 rounded-xl flex flex-col items-center">
            <Code className="w-12 h-12 text-akodemy-purple mb-2" />
            <p className="text-gray-600">Languages</p>
            <p className="text-4xl font-bold text-akodemy-purple">{stats.languagesActive}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-purple-100 p-6 rounded-xl h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={languageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#6B46C1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-purple-100 p-6 rounded-xl">
            <h3 className="text-2xl font-bold mb-4">Language Engagement</h3>
            <div className="text-sm text-gray-600 mb-4">
              <p>AXIS:</p>
              <p>x = Programming Languages</p>
              <p>y = Number of Students</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold mb-2">LEGENS:</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-purple-300"></div>
                <span>Python</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500"></div>
                <span>JavaScript</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
