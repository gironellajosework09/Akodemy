import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import api from '../../services/api'
import { Play, ChevronLeft } from 'lucide-react'

export default function ChallengeEditor() {
  const navigate = useNavigate()
  const { challengeId } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [time, setTime] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    fetchChallenge()
  }, [challengeId])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setShowExitConfirm(true)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isFullscreen])

  useEffect(() => {
    if (isFullscreen) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isFullscreen])

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

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      setIsFullscreen(true)
    }
  }

  const handleExitConfirm = async (confirmExit) => {
    setShowExitConfirm(false)
    if (confirmExit) {
      setIsFullscreen(false)
      await saveProgress()
      navigate(-1)
    } else {
      try {
        await containerRef.current?.requestFullscreen()
      } catch (e) {
        console.log('Could not re-enter fullscreen')
      }
    }
  }

  const saveProgress = async () => {
    try {
      await api.post(`/api/progress/save`, {
        challengeId,
        time,
        runCount,
        completed: false
      })
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const finishChallenge = async () => {
    try {
      await api.post(`/api/progress/save`, {
        challengeId,
        time,
        runCount,
        completed: true
      })
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      setIsFullscreen(false)
      navigate(-1)
    } catch (error) {
      console.error('Failed to finish challenge:', error)
    }
  }

  const [testResults, setTestResults] = useState(null)

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
    } catch (error) {
      setOutput(error.response?.data?.message || 'Execution failed')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
      </div>
    )
  }

  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold text-akodemy-purple mb-4">{challenge?.title}</h2>
          <p className="text-gray-600 mb-6">
            This challenge requires fullscreen mode to prevent cheating.
            Click the button below to start.
          </p>
          <button
            onClick={enterFullscreen}
            className="bg-akodemy-purple text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition"
          >
            Enter Fullscreen & Start Challenge
          </button>
          <button
            onClick={() => navigate(-1)}
            className="block mx-auto mt-4 text-gray-500 hover:text-akodemy-purple"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-screen bg-white flex flex-col">
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md">
            <h3 className="text-xl font-bold text-red-600 mb-4">Exit Challenge?</h3>
            <p className="text-gray-600 mb-6">
              Exiting fullscreen will end your challenge. Your progress will be saved but the challenge will be marked as incomplete.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleExitConfirm(true)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Exit & End Challenge
              </button>
              <button
                onClick={() => handleExitConfirm(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-100"
              >
                Continue Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-akodemy-purple text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-akodemy-purple border border-white px-4 py-2 rounded">
            <span className="font-bold">Instruction</span>
          </div>
          <span className="uppercase text-sm">PROGRAMMING LANGUAGE</span>
        </div>
        <div className="text-center">
          <p className="text-sm">Time</p>
          <p className="text-3xl font-bold">{formatTime(time)}</p>
          <button
            onClick={finishChallenge}
            className="border border-white px-4 py-1 rounded mt-1 hover:bg-white hover:text-akodemy-purple transition text-sm"
          >
            FINISH CHALLENGE
          </button>
        </div>
        <div className="bg-akodemy-purple border border-white w-16 h-16 rounded-full flex flex-col items-center justify-center">
          <span className="text-xs">Challenge</span>
          <span className="text-xs">number</span>
          <span className="text-xl font-bold">{runCount}</span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-48 bg-gray-100 p-4 border-r">
          <h3 className="font-bold text-akodemy-purple mb-4">Instruction</h3>
          <p className="text-sm text-gray-600">{challenge?.description || 'Complete the coding challenge.'}</p>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col border-r">
              <p className="px-4 py-2 bg-gray-100 text-sm font-medium">INPUT:</p>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={getEditorLanguage(challenge?.language)}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-light"
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

            <div className="flex-1 flex flex-col">
              <p className="px-4 py-2 bg-gray-100 text-sm font-medium">OUTPUT:</p>
              <div className="flex-1 p-4 overflow-auto">
                {testResults && (
                  <div className={`mb-4 p-3 rounded-lg ${testResults.passed ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                    <p className={`font-bold ${testResults.passed ? 'text-green-700' : 'text-red-700'}`}>
                      {testResults.passed ? '✓ All Tests Passed!' : '✗ Test Failed'}
                    </p>
                    {!testResults.passed && (
                      <div className="mt-2 text-sm">
                        <p className="text-gray-700"><strong>Expected:</strong> {testResults.expected}</p>
                        <p className="text-gray-700"><strong>Got:</strong> {testResults.actual}</p>
                      </div>
                    )}
                  </div>
                )}
                {hint && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="font-medium text-yellow-800">Hint:</p>
                    <p className="text-yellow-700">{hint}</p>
                  </div>
                )}
                <pre className={`text-sm whitespace-pre-wrap ${output.includes('Error') || output.includes('error') ? 'text-red-500' : 'text-gray-800'}`}>
                  {output || 'Run your code to see output...'}
                </pre>
              </div>
            </div>
          </div>

          <div className="border-t p-4 flex items-center justify-between bg-gray-50">
            <p className="text-sm">Number of Run: {runCount}</p>
            <button
              onClick={runCode}
              disabled={running}
              className="flex items-center gap-2 bg-white border border-gray-300 px-6 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {running ? 'Running...' : 'Run My Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
