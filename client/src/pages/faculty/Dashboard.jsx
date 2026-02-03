// Faculty page: Enhanced Dashboard with Analytics.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { 
  Users, Trophy, TrendingUp, Award, BarChart3, Target
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts'
import api from '../../services/api'

const COLORS = ['#8b5cf6', '#eab308', '#22c55e', '#ef4444', '#3b82f6', '#f97316']

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30)
  const [languageFilter, setLanguageFilter] = useState('')
  
  const [overview, setOverview] = useState({})
  const [trends, setTrends] = useState({ dailySubmissions: [], badgesClaimed: [] })
  const [students, setStudents] = useState({ topPerformers: [], needsAttention: [], recentActivity: [], recentBadges: [] })
  const [badges, setBadges] = useState({ distribution: {} })
  const [competencyDistribution, setCompetencyDistribution] = useState(null)

  useEffect(() => {
    fetchAllData()
  }, [dateRange, languageFilter])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const params = `?days=${dateRange}${languageFilter ? `&language=${languageFilter}` : ''}`
      
      const [overviewRes, trendsRes, studentsRes, badgesRes, competencyRes] = await Promise.all([
        api.get(`/api/faculty/analytics/overview${params}`),
        api.get(`/api/faculty/analytics/trends${params}`),
        api.get(`/api/faculty/analytics/students${params}`),
        api.get('/api/faculty/analytics/badges'),
        api.get('/api/faculty/competency-distribution')
      ])

      setOverview(overviewRes.data)
      setTrends(trendsRes.data)
      setStudents(studentsRes.data)
      setBadges(badgesRes.data)
      setCompetencyDistribution(competencyRes.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  const getBadgeDistributionData = () => {
    const data = []
    const dist = badges.distribution || {}
    Object.entries(dist).forEach(([lang, difficulties]) => {
      Object.entries(difficulties).forEach(([diff, count]) => {
        if (count > 0) {
          data.push({
            name: `${lang.charAt(0).toUpperCase() + lang.slice(1)} ${diff.charAt(0).toUpperCase() + diff.slice(1)}`,
            value: count
          })
        }
      })
    })
    return data
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-akodemy-purple text-sm sm:text-base mb-1">Faculty Dashboard</p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              Welcome to <span className="text-akodemy-purple">Akodemy</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-akodemy-purple"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-akodemy-purple"
            >
              <option value="">All Languages</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <button 
            onClick={() => navigate('/faculty/students')}
            className="bg-gray-800 border border-gray-700 p-3 sm:p-4 rounded-xl flex flex-col items-center cursor-pointer hover:border-akodemy-purple transition group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-akodemy-purple/20 rounded-xl flex items-center justify-center mb-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-akodemy-purple" />
            </div>
            <p className="text-gray-400 text-xs mb-1">Total Students</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{overview.totalStudents || 0}</p>
          </button>

          <div className="bg-gray-800 border border-gray-700 p-3 sm:p-4 rounded-xl flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            </div>
            <p className="text-gray-400 text-xs mb-1">Pass Rate</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{overview.passRate || 0}%</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-3 sm:p-4 rounded-xl flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
            <p className="text-gray-400 text-xs mb-1">Top Language</p>
            <p className="text-lg sm:text-xl font-bold text-white capitalize truncate w-full text-center">
              {overview.topLanguage || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl">
            <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-akodemy-purple" />
              Submission Trends
            </h3>
            <div className="h-48 sm:h-64">
              {trends.dailySubmissions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends.dailySubmissions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatDate}
                    />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      labelFormatter={formatDate}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="passed" name="Passed" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="failed" name="Failed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No submission data available
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl">
            <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-akodemy-gold" />
              Badge Distribution
            </h3>
            <div className="h-48 sm:h-64">
              {getBadgeDistributionData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getBadgeDistributionData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {getBadgeDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No badges claimed yet
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl">
            <h3 className="text-sm sm:text-base font-bold text-white mb-4">Student Competency Distribution</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getCompetencyChartData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="Not Started" stackId="a" fill="#4b5563" />
                  <Bar dataKey="Needs Practice" stackId="a" fill="#ef4444" />
                  <Bar dataKey="Developing" stackId="a" fill="#eab308" />
                  <Bar dataKey="Mastered" stackId="a" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl">
            <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              Needs Attention
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students.needsAttention.length > 0 ? (
                students.needsAttention.slice(0, 6).map((student) => (
                  <div 
                    key={student._id} 
                    className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-700/50 transition"
                    onClick={() => navigate(`/faculty/student/${student._id}`)}
                  >
                    <span className="text-white text-sm truncate flex-1 min-w-0">{student.name}</span>
                    <span className="text-red-400 font-semibold text-sm ml-2">{student.failRate}% fail</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">All students on track!</p>
              )}
            </div>
          </div>
        </div>

        {students.recentBadges.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 p-4 sm:p-6 rounded-xl">
            <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-akodemy-gold" />
              Recent Badge Claims
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {students.recentBadges.slice(0, 8).map((badge, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                  <div className="w-10 h-10 bg-akodemy-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-akodemy-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{badge.studentName}</p>
                    <p className="text-akodemy-gold text-xs truncate">{badge.badgeName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
