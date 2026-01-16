// UI component: Latest Submission Modal.
import { X, Clock, Play, CheckCircle, XCircle } from 'lucide-react'

// Component logic for Latest Submission Modal.
export default function LatestSubmissionModal({ isOpen, onClose, submission }) {
  if (!isOpen || !submission) return null

  const formatTime = (seconds) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date) => {
    if (!date) return '--'
    return new Date(date).toLocaleString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Latest Submission</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Clock className="w-3 h-3" />
                <span className="text-xs">Time</span>
              </div>
              <p className="text-lg font-bold text-white">{formatTime(submission.bestTime)}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Play className="w-3 h-3" />
                <span className="text-xs">Runs</span>
              </div>
              <p className="text-lg font-bold text-white">{submission.runs}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                {submission.isCorrect ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400" />
                )}
                <span className="text-xs">Score</span>
              </div>
              <p className={`text-lg font-bold ${submission.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {submission.score}%
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            Submitted: {formatDate(submission.submittedAt)}
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-80">
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {submission.answer || 'No code available'}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            This is read-only. Your current code is safe.
          </p>
        </div>
      </div>
    </div>
  )
}



