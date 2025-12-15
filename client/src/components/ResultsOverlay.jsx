import { X, Check, ArrowRight, ArrowLeft } from 'lucide-react'

export default function ResultsOverlay({ 
  isOpen, 
  challenge, 
  testResults, 
  timeTaken, 
  onBackToChallenges, 
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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="w-full max-w-lg max-h-[95vh] overflow-y-auto">
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

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Check className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-white">{passedTests}/{totalTests}</p>
              <p className="text-xs text-gray-400">Tests Passed</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-white">{formatTime(timeTaken)}</p>
              <p className="text-xs text-gray-400">Time Taken</p>
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

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onBackToChallenges}
            className="flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition border border-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base">Back to Challenges</span>
          </button>
          <button
            onClick={onNextChallenge}
            className="flex items-center justify-center gap-2 bg-akodemy-purple text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm sm:text-base">Next Challenge</span>
          </button>
        </div>
      </div>
    </div>
  )
}
