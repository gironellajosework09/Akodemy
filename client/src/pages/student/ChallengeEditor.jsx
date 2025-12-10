import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import api from '../../services/api'
import { Play, ChevronLeft } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'

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
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    fetchChallenge()
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

  const finishChallenge = async () => {
    try {
      await api.post(`/api/progress/save`, {
        challengeId,
        code,
        time,
        runCount,
        completed: true
      })
      navigate(-1)
    } catch (error) {
      console.error('Failed to finish challenge:', error)
    }
  }

  const goBack = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = async () => {
    await api.post(`/api/progress/save`, {
      challengeId,
      code,
      time,
      runCount,
      completed: false
    }).catch(() => {})
    navigate(-1)
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
      </div>
    )
  }


  return (
    <>
      <div ref={containerRef} className="h-screen bg-gray-900 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 text-white px-6 py-3 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <div className="text-center">
            <h1 className="font-bold text-lg text-white">{challenge?.title}</h1>
            <p className="text-2xl font-bold text-akodemy-purple">{formatTime(time)}</p>
          </div>
          <button
            onClick={finishChallenge}
            className="bg-akodemy-purple text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Finish Challenge
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 bg-gray-800 p-4 border-r border-gray-700 overflow-auto">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${
              challenge?.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
              challenge?.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {challenge?.difficulty}
            </span>
            <h3 className="font-bold text-white mb-3">Instructions</h3>
            <p className="text-sm text-gray-400">{challenge?.description || 'Complete the coding challenge.'}</p>
          </div>

          <div className="flex-1 flex flex-col">
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
                <div className="flex-1 p-4 overflow-auto">
                  {testResults && (
                    <div className={`mb-4 p-3 rounded-lg ${testResults.passed ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                      <p className={`font-bold ${testResults.passed ? 'text-green-400' : 'text-red-400'}`}>
                        {testResults.passed ? '✓ All Tests Passed!' : '✗ Test Failed'}
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
                      <p className="text-yellow-300">{hint}</p>
                    </div>
                  )}
                  <pre className={`text-sm whitespace-pre-wrap ${output.includes('Error') || output.includes('error') ? 'text-red-400' : 'text-gray-300'}`}>
                    {output || 'Run your code to see output...'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 p-4 flex items-center justify-between bg-gray-800">
              <p className="text-sm text-gray-400">Runs: {runCount}</p>
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
        </div>
      </div>

      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Exit Challenge"
        message="Are you sure you want to exit? Your progress will be saved."
        onConfirm={confirmExit}
        onCancel={() => setShowExitConfirm(false)}
      />
    </>
  )
}
