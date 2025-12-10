import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { Users, Trophy, Code, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
      const engagement = response.data.languageEngagement || []
      setLanguageData(engagement.length > 0 ? engagement : [
        { name: 'JavaScript', students: 0 },
        { name: 'Python', students: 0 },
        { name: 'Java', students: 0 }
      ])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setLanguageData([
        { name: 'JavaScript', students: 0 },
        { name: 'Python', students: 0 },
        { name: 'Java', students: 0 }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-8 py-8">
        <div className="mb-8">
          <p className="text-akodemy-purple text-lg mb-2">Faculty Dashboard</p>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to <span className="text-akodemy-purple">Akodemy</span></h1>
          <p className="text-gray-400">Monitor student progress and track engagement</p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => navigate('/faculty/students')}
            className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex flex-col items-center cursor-pointer hover:border-akodemy-purple transition group"
          >
            <div className="w-14 h-14 bg-akodemy-purple/20 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-7 h-7 text-akodemy-purple" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Students</p>
            <p className="text-4xl font-bold text-white">{stats.totalStudents}</p>
            <p className="text-xs text-akodemy-purple mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              View All <ArrowRight className="w-3 h-3" />
            </p>
          </button>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex flex-col items-center">
            <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-3">
              <Trophy className="w-7 h-7 text-yellow-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Completionists</p>
            <p className="text-4xl font-bold text-white">{stats.completionists}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex flex-col items-center">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
              <Code className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Languages</p>
            <p className="text-4xl font-bold text-white">{stats.languagesActive}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">Language Engagement</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="students" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <span className="text-gray-400">Active Languages</span>
                <span className="text-white font-semibold">JavaScript, Python, Java</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <span className="text-gray-400">Completion Rate</span>
                <span className="text-green-400 font-semibold">
                  {stats.totalStudents > 0 
                    ? Math.round((stats.completionists / stats.totalStudents) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                <span className="text-gray-400">Most Popular</span>
                <span className="text-akodemy-purple font-semibold">
                  {languageData.length > 0 
                    ? languageData.reduce((a, b) => a.students > b.students ? a : b).name 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
