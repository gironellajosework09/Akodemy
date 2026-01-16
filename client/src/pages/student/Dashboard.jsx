// Student page: Dashboard.
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { ArrowRight, Code2, Target, Trophy } from 'lucide-react'

// Student page logic for Dashboard.
export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <Layout>
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-akodemy-purple text-lg mb-2">
            Welcome back, {user?.name || 'Student'}!
          </p>
          <h1 className="text-5xl font-bold text-white mb-4">
            Ready to <span className="text-akodemy-purple">Level Up</span> Your Skills?
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Choose your language, test your skills, and earn mastery badges by solving challenges!
          </p>
          <button
            onClick={() => navigate('/languages')}
            className="bg-akodemy-purple text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2 mx-auto"
          >
            Start Coding
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Code2 className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">3 Languages</h3>
            <p className="text-gray-400 text-sm">JavaScript, Python, and Java</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">3 Difficulty Levels</h3>
            <p className="text-gray-400 text-sm">Beginner to Advanced</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-400 text-sm">6 competency categories</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}



