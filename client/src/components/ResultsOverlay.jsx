import { X, Check, ArrowRight, ArrowLeft, RotateCcw, Play, Clock, Hash } from 'lucide-react'

export default function ResultsOverlay({ 
  isOpen, 
  challenge, 
  testResults, 
  timeTaken,
  runCount,
  attemptNumber,
  onBackToChallenges, 
  onRetry,
  onNextChallenge 
}) {
  if (!isOpen) return null

  const passedTests = testResults?.filter(t => t.passed)?.length || 0
  const totalTests = testResults?.length || 0
  const scorePercent = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
  const allPassed = passedTests === totalTests && totalTests > 0

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400'
      case 'advanced': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="w-full max-w-lg max-h-[95vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex flex-col items-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${allPassed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {allPassed ? (
              <Check className="w-8 h-8 text-green-500" />
            ) : (
              <X className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {allPassed ? 'Well Done!' : 'Keep Trying!'}
          </h2>
          <p className="text-gray-400 text-sm text-center">
            {allPassed 
              ? 'You passed all test cases. Great job!' 
              : "You didn't pass all test cases, but don't give up!"}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-4">
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke={allPassed ? '#22c55e' : scorePercent > 0 ? '#eab308' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${scorePercent * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{scorePercent}%</span>
                <span className="text-xs text-gray-400">Score</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <Hash className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{attemptNumber || 1}</p>
              <p className="text-xs text-gray-400">Attempt</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{formatTime(timeTaken)}</p>
              <p className="text-xs text-gray-400">Time Spent</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <Play className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{runCount || 0}</p>
              <p className="text-xs text-gray-400">Runs</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              {allPassed ? (
                <Check className="w-4 h-4 text-green-400 mx-auto mb-1" />
              ) : (
                <X className="w-4 h-4 text-red-400 mx-auto mb-1" />
              )}
              <p className={`text-lg font-bold ${allPassed ? 'text-green-400' : 'text-red-400'}`}>
                {allPassed ? 'Passed' : 'Failed'}
              </p>
              <p className="text-xs text-gray-400">Status</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
          <h3 className="text-white font-semibold mb-3">Test Results</h3>
          <div className="space-y-2">
            {testResults && testResults.length > 0 ? (
              testResults.map((test, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${test.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {test.passed ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    <span className="text-gray-300 text-sm">Test Case {index + 1}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${test.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {test.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-red-500/20">
                    <X className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-gray-300 text-sm">No tests run</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-red-500/20 text-red-400">
                  Failed
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Challenge</p>
              <p className="text-white font-medium">{challenge?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 capitalize">{challenge?.language}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyStyle(challenge?.difficulty)}`}>
                {challenge?.difficulty}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={onBackToChallenges}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-gray-800 text-white px-2 sm:px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition border border-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs sm:text-base">Back</span>
          </button>
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-yellow-600 text-white px-2 sm:px-4 py-3 rounded-lg font-medium hover:bg-yellow-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs sm:text-base">Retry</span>
          </button>
          <button
            onClick={onNextChallenge}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-akodemy-purple text-white px-2 sm:px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            <span className="text-xs sm:text-base">Next</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
