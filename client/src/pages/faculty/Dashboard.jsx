import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { Users, Trophy, Code, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import api from '../../services/api'

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalStudents: 0,
    completionists: 0,
    languagesActive: 3
  })
  const [languageData, setLanguageData] = useState([])
  const [competencyDistribution, setCompetencyDistribution] = useState(null)
  const [perCompetencyDistribution, setPerCompetencyDistribution] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    fetchCompetencyDistribution()
    fetchPerCompetencyDistribution()
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

  const fetchCompetencyDistribution = async () => {
    try {
      const response = await api.get('/api/faculty/competency-distribution')
      setCompetencyDistribution(response.data)
    } catch (error) {
      console.error('Failed to fetch competency distribution:', error)
    }
  }

  const fetchPerCompetencyDistribution = async () => {
    try {
      const response = await api.get('/api/faculty/competency-student-distribution')
      setPerCompetencyDistribution(response.data)
    } catch (error) {
      console.error('Failed to fetch per-competency distribution:', error)
    }
  }

  const getCompetencyChartData = () => {
    if (!competencyDistribution) return []
    
    return [
      {
        name: 'JavaScript',
        'Not Started': competencyDistribution.javascript?.notStarted || 0,
        'Needs Practice': competencyDistribution.javascript?.needsPractice || 0,
        'Developing': competencyDistribution.javascript?.developing || 0,
        'Mastered': competencyDistribution.javascript?.mastered || 0
      },
      {
        name: 'Python',
        'Not Started': competencyDistribution.python?.notStarted || 0,
        'Needs Practice': competencyDistribution.python?.needsPractice || 0,
        'Developing': competencyDistribution.python?.developing || 0,
        'Mastered': competencyDistribution.python?.mastered || 0
      },
      {
        name: 'Java',
        'Not Started': competencyDistribution.java?.notStarted || 0,
        'Needs Practice': competencyDistribution.java?.needsPractice || 0,
        'Developing': competencyDistribution.java?.developing || 0,
        'Mastered': competencyDistribution.java?.mastered || 0
      }
    ]
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <p className="text-akodemy-purple text-base sm:text-lg mb-2">Faculty Dashboard</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Welcome to <span className="text-akodemy-purple">Akodemy</span></h1>
          <p className="text-gray-400 text-sm sm:text-base">Monitor student progress and track engagement</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <button 
            onClick={() => navigate('/faculty/students')}
            className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl flex flex-col items-center cursor-pointer hover:border-akodemy-purple transition group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-akodemy-purple/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-akodemy-purple" />
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Total Students</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{stats.totalStudents}</p>
            <p className="text-xs text-akodemy-purple mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              View All <ArrowRight className="w-3 h-3" />
            </p>
          </button>
          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Completionists</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{stats.completionists}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
              <Code className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Languages</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{stats.languagesActive}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Language Engagement</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
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
          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-900 rounded-lg">
                <span className="text-gray-400 text-sm">Active Languages</span>
                <span className="text-white font-semibold text-sm">JavaScript, Python, Java</span>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-900 rounded-lg">
                <span className="text-gray-400 text-sm">Completion Rate</span>
                <span className="text-green-400 font-semibold">
                  {stats.totalStudents > 0 
                    ? Math.round((stats.completionists / stats.totalStudents) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-900 rounded-lg">
                <span className="text-gray-400 text-sm">Most Popular</span>
                <span className="text-akodemy-purple font-semibold">
                  {languageData.length > 0 
                    ? languageData.reduce((a, b) => a.students > b.students ? a : b).name 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl">
          <h3 className="text-base sm:text-lg font-bold text-white mb-4">Student Competency Distribution by Language</h3>
          <p className="text-gray-400 text-sm mb-4">Percentage of students at each mastery level</p>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getCompetencyChartData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Not Started" stackId="a" fill="#4b5563" />
                <Bar dataKey="Needs Practice" stackId="a" fill="#ef4444" />
                <Bar dataKey="Developing" stackId="a" fill="#eab308" />
                <Bar dataKey="Mastered" stackId="a" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl mt-6">
          <h3 className="text-base sm:text-lg font-bold text-white mb-4">Student Distribution per Competency</h3>
          <p className="text-gray-400 text-sm mb-4">Percentage of students at each mastery level per competency category</p>
          <div className="h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perCompetencyDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} width={120} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="notStarted" name="Not Started" stackId="a" fill="#4b5563" />
                <Bar dataKey="needsPractice" name="Needs Practice" stackId="a" fill="#ef4444" />
                <Bar dataKey="developing" name="Developing" stackId="a" fill="#eab308" />
                <Bar dataKey="mastered" name="Mastered" stackId="a" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  )
}
