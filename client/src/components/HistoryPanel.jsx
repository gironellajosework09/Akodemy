import { useState, useEffect } from 'react'
import { Clock, Play, CheckCircle, XCircle, History, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../services/api'

export default function HistoryPanel({ challengeId, isOpen, onToggle }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (isOpen && challengeId) {
      fetchHistory()
    }
  }, [isOpen, challengeId])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/api/progress/challenge/${challengeId}/history`)
      setHistory(response.data.history)
      setTotal(response.data.total)
    } catch (error) {
      console.error('Failed to fetch history:', error)
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

  const formatDate = (date) => {
    if (!date) return '--'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-gray-800 border-t border-gray-700">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 transition"
      >
        <div className="flex items-center gap-2 text-white">
          <History className="w-4 h-4" />
          <span className="font-medium text-sm">Attempt History</span>
          {total > 0 && (
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-400">
              {total} attempts
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="max-h-48 overflow-auto border-t border-gray-700">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-akodemy-purple"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No previous attempts
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {history.map((attempt) => (
                <div
                  key={attempt._id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-750"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {attempt.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-white font-medium text-sm">
                        Attempt #{attempt.attemptNumber}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {formatDate(attempt.submittedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(attempt.bestTime)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Play className="w-3 h-3" />
                      <span>{attempt.runs}</span>
                    </div>
                    <span className={`font-medium ${attempt.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {attempt.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
