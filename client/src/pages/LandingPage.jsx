// Marketing landing page UI.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, Target, Trophy, Zap, Users, BarChart3, BookOpen, ArrowRight } from 'lucide-react'

// Page logic for Landing Page.
export default function LandingPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalChallenges: 0,
    totalStudents: 0,
    totalCompletions: 0,
    avgScore: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/public/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: Code2,
      title: '3 Languages',
      description: 'Practice JavaScript, Python, and Java with syntax highlighting',
      color: 'text-blue-400'
    },
    {
      icon: Target,
      title: '3 Difficulty Levels',
      description: 'Progress from Beginner to Intermediate to Advanced as you improve',
      color: 'text-green-400'
    },
    {
      icon: Trophy,
      title: 'Achievements',
      description: 'Track your competency progress across 6 skill categories',
      color: 'text-yellow-400'
    },
    {
      icon: Zap,
      title: 'Instant Feedback',
      description: 'Get real-time test results and AI-powered hints',
      color: 'text-purple-400'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img
                  src="/images/akodemy-logo.png"
                  alt="Akodemy Logo"
                  className="w-8 h-8 sm:w-8 sm:h-8 object-contain"
                />
            </div>
            <span className="text-xl font-bold">Akodemy</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-300 hover:text-white transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-akodemy-purple text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm mb-8">
            <Users className="w-4 h-4 text-yellow-400" />
            <span>Join {loading ? '...' : stats.totalStudents.toLocaleString()}+ students leveling up their skills</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Master Programming Through{' '}
            <span className="text-akodemy-purple">Interactive Challenges</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Level up your coding skills with gamified programming challenges. Practice JavaScript, Python, and Java with real-time feedback and track your progress.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-akodemy-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2"
            >
              Start Coding Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition border border-gray-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Excel</h2>
            <p className="text-gray-400 text-lg">A complete platform designed for learning and growth</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition">
                <div className={`w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-akodemy-purple mb-2">
                {loading ? '...' : `${stats.totalChallenges}+`}
              </p>
              <p className="text-gray-400">Coding Challenges</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-akodemy-purple mb-2">
                {loading ? '...' : `${stats.totalCompletions}+`}
              </p>
              <p className="text-gray-400">Challenges Completed</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-akodemy-purple mb-2">
                {loading ? '...' : `${stats.totalStudents}+`}
              </p>
              <p className="text-gray-400">Active Students</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-akodemy-purple/20 text-akodemy-purple px-3 py-1 rounded-full text-sm mb-6">
                <Users className="w-4 h-4" />
                For Educators
              </div>
              
              <h2 className="text-4xl font-bold mb-6">Track Student Progress</h2>
              <p className="text-gray-400 text-lg mb-8">
                Monitor your students' learning journey with comprehensive dashboards, detailed analytics, and performance insights.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-akodemy-purple" />
                  <span>Real-time student activity monitoring</span>
                </li>
                <li className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-akodemy-purple" />
                  <span>Detailed performance analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-akodemy-purple" />
                  <span>Individual progress tracking</span>
                </li>
              </ul>
              
              <button
                onClick={() => navigate('/login')}
                className="bg-akodemy-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2"
              >
                Register as Faculty
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-400">Student Performance</p>
                  <span className="text-green-400 text-sm">+{loading ? '...' : Math.round(stats.completionRate)}%</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-2xl font-bold">{loading ? '...' : stats.totalStudents}</p>
                    <p className="text-gray-400 text-sm">Students</p>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-2xl font-bold">{loading ? '...' : `${stats.avgScore}%`}</p>
                    <p className="text-gray-400 text-sm">Avg Score</p>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-2xl font-bold">{loading ? '...' : `${stats.completionRate}%`}</p>
                    <p className="text-gray-400 text-sm">Completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-akodemy-purple to-purple-600 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Your Coding Journey?</h2>
            <p className="text-purple-100 text-lg mb-8 max-w-xl mx-auto">
              Join {loading ? 'hundreds of' : `${stats.totalStudents}+`} students who are improving their skills every day. Start with our free tier and level up as you grow.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-akodemy-purple px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2 mx-auto"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center">
              {/* emeee */}
                  <img
                    src="/images/akodemy-logo.png"
                    alt="Akodemy Logo"
                    className="w-8 h-8 sm:w-8 sm:h-8 object-contain"
                  />
            </div>
            <span className="font-semibold">Akodemy</span>
          </div>
          <p className="text-gray-500 text-sm">2025 Akodemy. Built for learning.</p>
        </div>
      </footer>
    </div>
  )
}



