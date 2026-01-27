// Student page: Challenge List.
import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Clock, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import Layout from '../../components/Layout'
import ChallengeEntryModal from '../../components/ChallengeEntryModal'
import InstructionsModal from '../../components/InstructionsModal'
import api from '../../services/api'

// Student page logic for Challenge List.
const ITEMS_PER_PAGE_MOBILE = 6
const ITEMS_PER_PAGE_DESKTOP = 12

export default function ChallengeList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { language, difficulty } = useParams()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchChallenges()
  }, [language, difficulty])

  useEffect(() => {
    if (location.state?.retryChallengeId && challenges.length > 0) {
      const retryChallenge = challenges.find(c => c._id === location.state.retryChallengeId)
      if (retryChallenge) {
        setSelectedChallenge(retryChallenge)
        setShowInstructionsModal(true)
        navigate(location.pathname, { replace: true, state: {} })
      }
    }
  }, [challenges, location.state])

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

  const itemsPerPage = isMobile ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP
  const totalPages = Math.ceil(challenges.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedChallenges = challenges.slice(startIndex, startIndex + itemsPerPage)

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

  const getTitleHoverColor = (level) => {
    switch (level) {
      case 'beginner': return 'group-hover:text-green-400'
      case 'intermediate': return 'group-hover:text-yellow-400'
      case 'advanced': return 'group-hover:text-red-400'
      default: return ''
    }
  }

  const getLanguageDisplay = () => {
    switch (language) {
      case 'javascript': return { icon: '/images/js-logo.png', name: 'JavaScript' }
      case 'python': return { icon: '/images/python-logo.png', name: 'Python' }
      case 'java': return { icon: '/images/java-logo.png', name: 'Java' }
      default: return { icon: '💻', name: language }
    }
  }

  const langInfo = getLanguageDisplay()

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-12">
        <button
          onClick={() => navigate(`/challenges/${language}/difficulty`)}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Back to Difficulty</span>
        </button>

        <div className="flex items-center justify-center text-gray-400 mb-4">
          <div className="flex items-center text-gray-400">
              <div className="w-10 h-10 sm:w-14 sm:h-14 p-1 sm:p-2 rounded-lg flex items-center justify-center">
                <img
                  src={langInfo.icon}
                  alt={langInfo.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-medium text-base sm:text-lg">{langInfo.name}</span>
            </div>
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-bold text-white text-center mb-2">
          <span className={getDifficultyColor()}>{getDifficultyLabel()}</span>
        </h1>
        <p className="text-gray-400 text-center mb-8 sm:mb-12 text-sm sm:text-base">Select a challenge to start coding</p>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {paginatedChallenges.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-400 text-lg">No challenges available yet.</p>
                  <p className="text-gray-500">Check back later!</p>
                </div>
              ) : (
                paginatedChallenges.map((challenge) => (
                  <button
                    key={challenge._id}
                    onClick={() => {
                      setSelectedChallenge(challenge)
                      setShowEntryModal(true)
                    }}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 text-left hover:border-akodemy-purple transition hover:-translate-y-1 group"
                  >
                    <h3 className={`text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 transition-colors duration-200 line-clamp-2 ${getTitleHoverColor(challenge?.difficulty)}`}>
                      {challenge.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-400">
                      <div className="flex items-center gap-2 sm:gap-4">
                        {challenge.userProgress?.bestTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{challenge.userProgress.bestTime}</span>
                          </div>
                        )}
                        {challenge.userProgress?.runs > 0 && (
                          <div className="flex items-center gap-1">
                            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{challenge.userProgress.runs}</span>
                          </div>
                        )}
                      </div>
                      {challenge.userProgress?.completed && (
                        <span className="text-green-400 text-xs font-medium">Done</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-akodemy-purple transition"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        currentPage === page
                          ? 'bg-akodemy-purple text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-akodemy-purple transition"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ChallengeEntryModal
        isOpen={showEntryModal}
        challenge={selectedChallenge}
        onClose={() => {
          setShowEntryModal(false)
          setSelectedChallenge(null)
        }}
        onStartAttempt={(challenge) => {
          setShowEntryModal(false)
          setShowInstructionsModal(true)
        }}
      />

      <InstructionsModal
        isOpen={showInstructionsModal}
        challenge={selectedChallenge}
        onClose={() => {
          setShowInstructionsModal(false)
          setSelectedChallenge(null)
        }}
        onStartCoding={() => {
          setShowInstructionsModal(false)
          navigate(`/challenge/${selectedChallenge._id}`)
        }}
      />
    </Layout>
  )
}



