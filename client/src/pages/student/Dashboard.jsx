import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <Layout>
      <div className="container mx-auto px-8 py-12 flex items-center justify-between min-h-[calc(100vh-160px)]">
        <div className="max-w-xl">
          <h2 className="text-2xl text-akodemy-purple italic mb-2">Welcome to</h2>
          <h1 className="text-6xl font-bold text-akodemy-purple mb-2">AKODEMY</h1>
          <h3 className="text-3xl font-bold text-akodemy-purple mb-6">Practice. Learn. Master Coding!</h3>
          <p className="text-gray-600 mb-8">
            Choose your language, test your skills, and<br />
            earn mastery badges by solving challenges!
          </p>
          <button
            onClick={() => navigate('/languages')}
            className="border-2 border-akodemy-purple text-akodemy-purple px-8 py-3 rounded-lg font-semibold hover:bg-akodemy-purple hover:text-white transition"
          >
            Start Coding
          </button>
        </div>
        <div className="hidden lg:block">
          <div className="w-80 h-80 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </Layout>
  )
}
