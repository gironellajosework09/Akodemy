import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import api from '../../services/api'
import { Play, ChevronLeft, ChevronDown, ChevronUp, Eye, History } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import ResultsOverlay from '../../components/ResultsOverlay'
import LatestSubmissionModal from '../../components/LatestSubmissionModal'
import HistoryPanel from '../../components/HistoryPanel'

export default function ChallengeEditor() {
  const navigate = useNavigate()
  const { challengeId } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [testResults, setTestResults] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [finalTestResults, setFinalTestResults] = useState([])
  const [finalTime, setFinalTime] = useState(0)
  const [showLatestModal, setShowLatestModal] = useState(false)
  const [latestSubmission, setLatestSubmission] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [startedAt] = useState(new Date())
  const [attemptNumber, setAttemptNumber] = useState(1)
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchChallenge()
    fetchLatestSubmission()
  }, [challengeId])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const fetchChallenge = async () => {
    try {
      const response = await api.get(`/api/challenges/${challengeId}`)
      setChallenge(response.data)
      setCode(response.data.starterCode || getDefaultCode(response.data.language))
    } catch (error) {
      console.error('Failed to fetch challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestSubmission = async () => {
    try {
      const response = await api.get(`/api/progress/challenge/${challengeId}/latest`)
      if (response.data) {
        setLatestSubmission(response.data)
      }
      const summaryResponse = await api.get(`/api/progress/challenge/${challengeId}/summary`)
      if (summaryResponse.data?.attemptCount) {
        setAttemptNumber(summaryResponse.data.attemptCount + 1)
      }
    } catch (error) {
      console.error('Failed to fetch latest submission:', error)
    }
  }

  const getDefaultCode = (language) => {
    switch (language) {
      case 'javascript':
        return '// Write your JavaScript code here\nconsole.log("Hello World!");'
      case 'python':
        return '# Write your Python code here\nprint("Hello World!")'
      case 'java':
        return 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}'
      default:
        return ''
    }
  }

  const parseInstructions = (description) => {
    if (!description) return []
    const lines = description.split('\n').filter(line => line.trim())
    return lines.map((line, index) => ({
      id: index,
      text: line.trim()
    }))
  }

  const finishChallenge = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current)
      setFinalTime(time)
      
      let testsForOverlay = []
      let isCorrect = false
      let score = 0

      if (testResults) {
        testsForOverlay = [{ passed: testResults.passed, expected: testResults.expected, actual: testResults.actual }]
        isCorrect = testResults.passed
        score = isCorrect ? 100 : 0
      }
      setFinalTestResults(testsForOverlay)
      
      await api.post(`/api/progress/challenge/${challengeId}/submit`, {
        answer: code,
        language: challenge.language,
        isCorrect,
        score,
        runs: runCount,
        startedAt: startedAt.toISOString()
      })

      await api.post(`/api/progress/save`, {
        challengeId,
        code,
        time,
        runCount,
        completed: true
      })
      
      setShowResults(true)
    } catch (error) {
      console.error('Failed to finish challenge:', error)
    }
  }

  const goBack = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setFinalTime(time)
    
    let testsForOverlay = []
    if (testResults) {
      testsForOverlay = [{ passed: testResults.passed, expected: testResults.expected, actual: testResults.actual }]
    }
    setFinalTestResults(testsForOverlay)
    
    await api.post(`/api/progress/save`, {
      challengeId,
      code,
      time,
      runCount,
      completed: false
    }).catch(() => {})
    
    setShowExitConfirm(false)
    setShowResults(true)
  }

  const handleBackToChallenges = () => {
    navigate(`/challenges/${challenge?.language}/${challenge?.difficulty}`)
  }

  const handleNextChallenge = async () => {
    try {
      const response = await api.get('/api/challenges', {
        params: {
          language: challenge?.language,
          difficulty: challenge?.difficulty
        }
      })
      const challenges = response.data
      const currentIndex = challenges.findIndex(c => c._id === challengeId)
      if (currentIndex >= 0 && currentIndex < challenges.length - 1) {
        navigate(`/challenge/${challenges[currentIndex + 1]._id}`)
        window.location.reload()
      } else {
        navigate(`/challenges/${challenge?.language}/${challenge?.difficulty}`)
      }
    } catch (error) {
      navigate(`/challenges/${challenge?.language}/${challenge?.difficulty}`)
    }
  }

  const handleRetry = () => {
    navigate(`/challenges/${challenge?.language}/${challenge?.difficulty}`, {
      state: { retryChallengeId: challengeId }
    })
  }

  const runCode = async () => {
    setRunning(true)
    setOutput('')
    setHint('')
    setTestResults(null)
    setRunCount((prev) => prev + 1)

    try {
      const response = await api.post('/api/execute', {
        code,
        language: challenge.language,
        challengeId
      })

      setOutput(response.data.output || response.data.error || 'No output')

      if (response.data.error && response.data.hint) {
        setHint(response.data.hint)
      }

      if (response.data.testResults) {
        setTestResults(response.data.testResults)
      }

      if (isMobile) {
        setActiveTab('output')
      }
    } catch (error) {
      setOutput(error.response?.data?.message || 'Execution failed')
      if (isMobile) {
        setActiveTab('output')
      }
    } finally {
      setRunning(false)
    }
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getEditorLanguage = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript'
      case 'python': return 'python'
      case 'java': return 'java'
      default: return 'javascript'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
      </div>
    )
  }

  const instructions = parseInstructions(challenge?.description)

  const renderOutput = () => (
    <div className="flex-1 p-4 overflow-auto">
      {testResults && (
        <div className={`mb-4 p-3 rounded-lg ${testResults.passed ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
          <p className={`font-bold ${testResults.passed ? 'text-green-400' : 'text-red-400'}`}>
            {testResults.passed ? 'All Tests Passed!' : 'Test Failed'}
          </p>
          {!testResults.passed && (
            <div className="mt-2 text-sm">
              <p className="text-gray-300"><strong>Expected:</strong> {testResults.expected}</p>
              <p className="text-gray-300"><strong>Got:</strong> {testResults.actual}</p>
            </div>
          )}
        </div>
      )}
      {hint && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <p className="font-medium text-yellow-400">Hint:</p>
          <p className="text-yellow-300 text-sm">{hint}</p>
        </div>
      )}
      <pre className={`text-sm whitespace-pre-wrap ${output.includes('Error') || output.includes('error') ? 'text-red-400' : 'text-gray-300'}`}>
        {output || 'Run your code to see output...'}
      </pre>
    </div>
  )

  return (
    <>
      <div ref={containerRef} className="h-screen bg-gray-900 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 text-white px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="text-center flex-1 mx-2">
            <h1 className="font-bold text-sm sm:text-lg text-white truncate">{challenge?.title}</h1>
            <p className="text-lg sm:text-2xl font-bold text-akodemy-purple">{formatTime(time)}</p>
          </div>
          <button
            onClick={finishChallenge}
            disabled={runCount === 0}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition text-xs sm:text-base ${
              runCount === 0 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-akodemy-purple text-white hover:bg-purple-700'
            }`}
            title={runCount === 0 ? 'Run your code at least once before finishing' : ''}
          >
            <span className="hidden sm:inline">Finish Challenge</span>
            <span className="sm:hidden">Finish</span>
          </button>
        </div>

        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 hover:bg-gray-750 transition"
        >
          <div className="flex items-center gap-2">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              challenge?.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
              challenge?.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {challenge?.difficulty}
            </span>
            <span className="text-white font-medium text-sm">
              {showInstructions ? 'Hide Instructions' : 'View Instructions'}
            </span>
          </div>
          {showInstructions ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showInstructions && (
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 max-h-48 overflow-auto">
            {instructions.length > 0 ? (
              <ol className="space-y-2">
                {instructions.map((step, index) => (
                  <li key={step.id} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-akodemy-purple/20 text-akodemy-purple rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-300 pt-0.5">{step.text}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-400">Complete the coding challenge.</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-850 border-b border-gray-700">
          {latestSubmission && (
            <button
              onClick={() => setShowLatestModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              View Latest Submission
            </button>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition text-xs"
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
          <div className="ml-auto text-xs text-gray-500">
            Runs: {runCount}
          </div>
        </div>

        {isMobile ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-gray-700 bg-gray-800">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  activeTab === 'editor' 
                    ? 'text-akodemy-purple border-b-2 border-akodemy-purple' 
                    : 'text-gray-400'
                }`}
              >
                Code Editor
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  activeTab === 'output' 
                    ? 'text-akodemy-purple border-b-2 border-akodemy-purple' 
                    : 'text-gray-400'
                }`}
              >
                Output
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {activeTab === 'editor' ? (
                <Editor
                  height="100%"
                  language={getEditorLanguage(challenge?.language)}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                  }}
                />
              ) : (
                <div className="flex-1 bg-gray-900 overflow-auto">
                  {renderOutput()}
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 p-3 flex items-center justify-end bg-gray-800">
              <button
                onClick={runCode}
                disabled={running}
                className="flex items-center gap-2 bg-akodemy-purple text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition text-sm"
              >
                <Play className="w-4 h-4" />
                {running ? 'Running...' : 'Run Code'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex">
              <div className="flex-1 flex flex-col border-r border-gray-700">
                <p className="px-4 py-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-700">Code Editor</p>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={getEditorLanguage(challenge?.language)}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-gray-900">
                <p className="px-4 py-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-700">Output</p>
                {renderOutput()}
              </div>
            </div>

            <div className="border-t border-gray-700 p-4 flex items-center justify-end bg-gray-800">
              <button
                onClick={runCode}
                disabled={running}
                className="flex items-center gap-2 bg-akodemy-purple text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <Play className="w-4 h-4" />
                {running ? 'Running...' : 'Run Code'}
              </button>
            </div>
          </div>
        )}

        {showHistory && (
          <HistoryPanel
            challengeId={challengeId}
            isOpen={showHistory}
            onToggle={() => setShowHistory(!showHistory)}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Exit Challenge"
        message="Are you sure you want to exit? Your progress will be saved."
        onConfirm={confirmExit}
        onCancel={() => setShowExitConfirm(false)}
      />

      <ResultsOverlay
        isOpen={showResults}
        challenge={challenge}
        testResults={finalTestResults}
        timeTaken={finalTime}
        runCount={runCount}
        attemptNumber={attemptNumber}
        onBackToChallenges={handleBackToChallenges}
        onRetry={handleRetry}
        onNextChallenge={handleNextChallenge}
      />

      <LatestSubmissionModal
        isOpen={showLatestModal}
        onClose={() => setShowLatestModal(false)}
        submission={latestSubmission}
      />
    </>
  )
}
