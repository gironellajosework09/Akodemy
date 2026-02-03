// UI component: Challenge Entry Modal.
import { useState, useEffect } from 'react'
import { X, Clock, Play, Code, ArrowRight, ArrowLeft } from 'lucide-react'
import api from '../services/api'

// Component logic for Challenge Entry Modal.
export default function ChallengeEntryModal({ isOpen, challenge, onClose, onStartAttempt }) {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const COMPETENCY_LABELS = [
    'Variables & Data Types',
    'Control Structures',
    'Functions',
    'Arrays & Collections',
    'Object-Oriented Programming',
    'Error Handling'
  ]

  useEffect(() => {
    if (isOpen && challenge?._id) {
      fetchSummary()
    }
  }, [isOpen, challenge?._id])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/api/progress/challenge/${challenge._id}/summary`)
      setSummary(response.data)
    } catch (error) {
      console.error('Failed to fetch summary:', error)
      setSummary({ hasAttempted: false })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const resolveCompetencies = (challengeData) => {
    if (Array.isArray(challengeData?.competencies) && challengeData.competencies.length > 0) {
      return challengeData.competencies
    }
    if (challengeData?.competencyIndex !== undefined && challengeData?.competencyIndex !== null) {
      return [COMPETENCY_LABELS[challengeData.competencyIndex] || '(Missing)']
    }
    return []
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-page-in">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl animate-modal-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white truncate pr-4">{challenge?.title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-akodemy-purple"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  challenge?.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                  challenge?.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {challenge?.difficulty}
                </span>
                <span className="text-gray-400 text-sm capitalize">{challenge?.language}</span>
              </div>
              {resolveCompetencies(challenge).length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-6">
                  {resolveCompetencies(challenge).map((competency) => (
                    <span
                      key={`${challenge?._id}-${competency}`}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300"
                    >
                      {competency}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-yellow-500 mb-6">(Missing - admin must set)</p>
              )}

              {summary?.hasAttempted ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Best Time</span>
                      </div>
                      <p className="text-2xl font-bold text-akodemy-purple">
                        {formatTime(summary.bestTime)}
                      </p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
                        <Play className="w-4 h-4" />
                        <span className="text-xs">Runs (Latest)</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {summary.runs}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Code className="w-4 h-4" />
                      <span className="text-sm">Latest Submission</span>
                      {summary.lastCorrect && (
                        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          Passed
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 max-h-32 overflow-auto">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {summary.latestCode?.substring(0, 500) || 'No code submitted yet'}
                        {summary.latestCode?.length > 500 && '...'}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                    <span>Total Attempts: {summary.attemptCount}</span>
                    {summary.lastScore > 0 && (
                      <span>Last Score: {summary.lastScore}%</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 mb-6">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400">No previous attempts</p>
                  <p className="text-gray-500 text-sm mt-1">This will be your first try!</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Challenges
                </button>
                <button
                  onClick={() => onStartAttempt(challenge)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-akodemy-purple text-white rounded-xl hover:bg-purple-700 transition font-medium"
                >
                  Start New Attempt
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}



