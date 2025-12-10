import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, Play } from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../services/api'

export default function ChallengeList() {
  const navigate = useNavigate()
  const { language, difficulty } = useParams()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenges()
  }, [language, difficulty])

  const fetchChallenges = async () => {
    try {
      const response = await api.get(`/api/challenges?language=${language}&difficulty=${difficulty}`)
      setChallenges(response.data)
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'beginner': return 'Beginner Level'
      case 'intermediate': return 'Intermediate Level'
      case 'advanced': return 'Advanced Level'
      default: return difficulty
    }
  }

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400'
      case 'intermediate': return 'text-yellow-400'
      case 'advanced': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getLanguageDisplay = () => {
    switch (language) {
      case 'javascript': return { icon: '📜', name: 'JavaScript' }
      case 'python': return { icon: '🐍', name: 'Python' }
      case 'java': return { icon: '☕', name: 'Java' }
      default: return { icon: '💻', name: language }
    }
  }

  const langInfo = getLanguageDisplay()

  return (
    <Layout>
      <div className="container mx-auto px-8 py-12">
        <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
          <span className="text-xl">{langInfo.icon}</span>
          <span className="font-medium">{langInfo.name}</span>
        </div>
        
        <h1 className="text-4xl font-bold text-white text-center mb-2">
          <span className={getDifficultyColor()}>{getDifficultyLabel()}</span>
        </h1>
        <p className="text-gray-400 text-center mb-12">Select a challenge to start coding</p>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {challenges.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg">No challenges available yet.</p>
                <p className="text-gray-500">Check back later!</p>
              </div>
            ) : (
              challenges.map((challenge) => (
                <button
                  key={challenge._id}
                  onClick={() => navigate(`/challenge/${challenge._id}`)}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-left hover:border-akodemy-purple transition hover:-translate-y-1 group"
                >
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-akodemy-purple transition">{challenge.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      {challenge.userProgress?.bestTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{challenge.userProgress.bestTime}</span>
                        </div>
                      )}
                      {challenge.userProgress?.runs > 0 && (
                        <div className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          <span>{challenge.userProgress.runs} runs</span>
                        </div>
                      )}
                    </div>
                    {challenge.userProgress?.completed && (
                      <span className="text-green-400 text-xs font-medium">Completed</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
