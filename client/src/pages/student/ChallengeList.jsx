import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => navigate(`/challenges/${language}/difficulty`)}
          className="flex items-center gap-1 text-gray-600 hover:text-akodemy-purple"
        >
          <ChevronLeft className="w-5 h-5" />
          back
        </button>
        <span className="text-gray-600 uppercase font-medium">PROGRAMMING LANGUAGE</span>
      </div>

      <div className="container mx-auto px-8 py-8">
        <h1 className="text-4xl font-bold text-akodemy-purple text-center mb-12">
          {getDifficultyLabel()}
        </h1>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {challenges.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-gray-500 text-lg">No challenges available yet.</p>
                <p className="text-gray-400">Check back later!</p>
              </div>
            ) : (
              challenges.map((challenge) => (
                <button
                  key={challenge._id}
                  onClick={() => navigate(`/challenge/${challenge._id}`)}
                  className="bg-white border-2 border-akodemy-purple rounded-lg p-6 text-left hover:shadow-lg transition hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold text-akodemy-purple mb-4">{challenge.title}</h3>
                  {challenge.userProgress && (
                    <div className="text-sm text-gray-500">
                      <p>Best Time: {challenge.userProgress.bestTime || '00:00:00'}</p>
                      <p>Runs: {challenge.userProgress.runs || 0}</p>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-akodemy-purple text-white py-4 text-center">
        <p>&copy; Copyright 2025. All Rights Reserved.</p>
      </footer>
    </div>
  )
}
