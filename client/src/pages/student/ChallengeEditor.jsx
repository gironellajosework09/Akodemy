// Student page: Challenge Editor.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import api from '../../services/api'
import { Play, ChevronLeft, ChevronDown, ChevronUp, Eye, History, ShieldAlert } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import ResultsOverlay from '../../components/ResultsOverlay'
import LatestSubmissionModal from '../../components/LatestSubmissionModal'
import HistoryPanel from '../../components/HistoryPanel'
import BadgeUnlockedModal from '../../components/BadgeEarnedModal'
import useFullscreenGuard from '../../hooks/useFullscreenGuard'
import FullscreenExitModal from '../../components/FullscreenExitModal'
import FullscreenEntryOverlay from '../../components/FullscreenEntryOverlay'
import FullscreenStatusBanner from '../../components/FullscreenStatusBanner'

const AUTOSAVE_INTERVAL_MS = 30000

// Student page logic for Challenge Editor.
export default function ChallengeEditor() {
  const navigate = useNavigate()
  const { challengeId } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [starterCode, setStarterCode] = useState('')
  const [output, setOutput] = useState('')
  const [hint, setHint] = useState('')
  const [friendlyFeedback, setFriendlyFeedback] = useState(null)
  const [technicalDetails, setTechnicalDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
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
  const [clipboardToast, setClipboardToast] = useState(false)
  const [saveDisabledToast, setSaveDisabledToast] = useState(false)
  const [unlockedBadge, setUnlockedBadge] = useState(null)
  const timerRef = useRef(null)
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const autosaveEnabledRef = useRef(true)
  const autosaveDataRef = useRef({ code: '', time: 0, runCount: 0 })
  const lastAutosaveRef = useRef({ code: '', time: 0, runCount: 0 })
  const autosaveInFlightRef = useRef(false)
  const allowClipboard = false //toggle for disabling copy & paste in editor
  const allowFullscreen = true // toggle for disabling fullscreen guard
  const editorKey = allowClipboard ? 'clipboard-on' : 'clipboard-off'

  const {
    isFullscreen,
    isSupported: fullscreenSupported,
    needsUserGesture,
    showExitModal,
    continueWithoutFullscreen,
    autosaveEnabled,
    requestFullscreen,
    exitFullscreen,
    handleContinueWithoutFullscreen
  } = useFullscreenGuard({ targetRef: containerRef })
  // } = useFullscreenGuard({ targetRef: containerRef, enabled: allowFullscreen })

  const showClipboardBlockedToast = useCallback(() => {
    setClipboardToast(true)
    setTimeout(() => setClipboardToast(false), 2000)
  }, [])

  const showSaveDisabledToast = useCallback(() => {
    setSaveDisabledToast(true)
    setTimeout(() => setSaveDisabledToast(false), 2000)
  }, [])

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    if (!allowClipboard) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
        showClipboardBlockedToast()
      })
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
        showClipboardBlockedToast()
      })
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
        showClipboardBlockedToast()
      })

      const editorDom = editor.getDomNode()
      if (editorDom) {
        editorDom.addEventListener('contextmenu', (e) => {
          e.preventDefault()
          showClipboardBlockedToast()
        })
        editorDom.addEventListener('paste', (e) => {
          e.preventDefault()
          showClipboardBlockedToast()
        })
        editorDom.addEventListener('copy', (e) => {
          e.preventDefault()
          showClipboardBlockedToast()
        })
        editorDom.addEventListener('cut', (e) => {
          e.preventDefault()
          showClipboardBlockedToast()
        })
      }
    }
  }, [allowClipboard, showClipboardBlockedToast])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchChallenge()
    fetchLatestSubmission()
    setShowInstructions(true)
  }, [challengeId])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    autosaveEnabledRef.current = autosaveEnabled
  }, [autosaveEnabled])

  useEffect(() => {
    autosaveDataRef.current = { code, time, runCount }
  }, [code, time, runCount])

  useEffect(() => {
    lastAutosaveRef.current = { code: '', time: 0, runCount: 0 }
  }, [challengeId])

  const saveProgress = useCallback(async (payload, { silent = false } = {}) => {
    if (!autosaveEnabledRef.current) {
      if (!silent) {
        showSaveDisabledToast()
      }
      return false
    }

    try {
      await api.post('/api/progress/save', payload)
      return true
    } catch (error) {
      return false
    }
  }, [showSaveDisabledToast])

  const attemptAutosave = useCallback(async () => {
    if (!autosaveEnabledRef.current) return
    if (!challengeId || autosaveInFlightRef.current) return

    const current = autosaveDataRef.current
    const last = lastAutosaveRef.current
    if (
      current.code === last.code &&
      current.time === last.time &&
      current.runCount === last.runCount
    ) {
      return
    }

    autosaveInFlightRef.current = true
    const saved = await saveProgress({
      challengeId,
      code: current.code,
      time: current.time,
      runCount: current.runCount,
      completed: false
    }, { silent: true })

    if (saved) {
      lastAutosaveRef.current = { ...current }
    }
    autosaveInFlightRef.current = false
  }, [challengeId, saveProgress])

  useEffect(() => {
    if (!challengeId || !challenge || showResults) return undefined
    if (!autosaveEnabled) return undefined

    const interval = setInterval(() => {
      attemptAutosave()
    }, AUTOSAVE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [attemptAutosave, autosaveEnabled, challenge, challengeId, showResults])

  const fetchChallenge = async () => {
    try {
      const response = await api.get(`/api/challenges/${challengeId}`)
      const initialCode = response.data.starterCode || getDefaultCode(response.data.language)
      setChallenge(response.data)
      setStarterCode(initialCode)
      setCode(initialCode)
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

  const normalizeCodeForComparison = (value = '') => value.replace(/\r\n/g, '\n').trim()
  const hasValidCodeModification =
    normalizeCodeForComparison(code) !== normalizeCodeForComparison(starterCode)

  const extractMissingFunctions = (results) => {
    if (!results) return null
    const actual = String(results.actual || '')
    if (results.message !== 'Required function(s) not defined' && !/Missing:/i.test(actual)) {
      return null
    }
    const match = actual.match(/Missing:\s*(.+)/i)
    const names = match ? match[1].split(',').map(name => name.trim()).filter(Boolean) : []
    return names.length > 0 ? names : null
  }

  const finishChallenge = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current)
      setFinalTime(time)
      
      let testsForOverlay = []
      let isCorrect = false
      let score = 0

      if (testResults) {
        const missingFunctions = extractMissingFunctions(testResults)
        testsForOverlay = [{
          passed: testResults.passed,
          expected: testResults.expected,
          actual: testResults.actual,
          message: testResults.message,
          missingFunctions
        }]
        isCorrect = testResults.passed
        score = isCorrect ? 100 : 0
      }
      setFinalTestResults(testsForOverlay)
      
      const submitResponse = await api.post(`/api/progress/challenge/${challengeId}/submit`, {
        answer: code,
        language: challenge.language,
        isCorrect,
        score,
        runs: runCount,
        startedAt: startedAt.toISOString()
      })

      await saveProgress({
        challengeId,
        code,
        time,
        runCount,
        completed: true
      })

      if (submitResponse.data?.badgeUnlocked) {
        setUnlockedBadge(submitResponse.data.badgeUnlocked)
      }

      await exitFullscreen({ suppressModal: true })
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
      const missingFunctions = extractMissingFunctions(testResults)
      testsForOverlay = [{
        passed: testResults.passed,
        expected: testResults.expected,
        actual: testResults.actual,
        message: testResults.message,
        missingFunctions
      }]
    }
    setFinalTestResults(testsForOverlay)
    
    await saveProgress({
      challengeId,
      code,
      time,
      runCount,
      completed: false
    })

    await exitFullscreen({ suppressModal: true })
    setShowExitConfirm(false)
    setShowResults(true)
  }

  const handleBackToChallenges = () => {
    exitFullscreen({ suppressModal: true })
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
        const nextChallengeId = challenges[currentIndex + 1]._id
        exitFullscreen({ suppressModal: true })
        navigate(`/challenges/${challenge?.language}/${challenge?.difficulty}`, {
          state: { retryChallengeId: nextChallengeId }
        })
      } else {
        exitFullscreen({ suppressModal: true })
        navigate(`/challenges/${challenge?.language}/${challenge?.difficulty}`)
      }
    } catch (error) {
      exitFullscreen({ suppressModal: true })
      navigate(`/challenges/${challenge?.language}/${challenge?.difficulty}`)
    }
  }

  const handleRetry = () => {
    exitFullscreen({ suppressModal: true })
    navigate(`/challenges/${challenge?.language}/${challenge?.difficulty}`, {
      state: { retryChallengeId: challengeId }
    })
  }

  const runCode = async () => {
    if (running || !hasValidCodeModification) return

    setRunning(true)
    setOutput('')
    setHint('')
    setFriendlyFeedback(null)
    setTechnicalDetails(null)
    setTestResults(null)
    setRunCount((prev) => prev + 1)

    try {
      const response = await api.post('/api/execute', {
        code,
        language: challenge.language,
        challengeId
      })

      setOutput(response.data.output || response.data.error || 'No output')

      if (response.data.hint) {
        setHint(response.data.hint)
      }

      setFriendlyFeedback(response.data.friendlyFeedback || null)
      setTechnicalDetails(response.data.technicalDetails || null)

      if (response.data.testResults) {
        setTestResults(response.data.testResults)
      }

      if (response.data.badgeUnlocked) {
        setUnlockedBadge(response.data.badgeUnlocked)
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

  const COMPETENCY_LABELS = [
    'Variables & Data Types',
    'Control Structures',
    'Functions',
    'Arrays & Collections',
    'Object-Oriented Programming',
    'Error Handling'
  ]

  const resolveCompetencies = () => {
    if (Array.isArray(challenge?.competencies) && challenge.competencies.length > 0) {
      return challenge.competencies
    }
    if (challenge?.competencyIndex !== undefined && challenge?.competencyIndex !== null) {
      return [COMPETENCY_LABELS[challenge.competencyIndex] || '(Missing)']
    }
    return []
  }

  const entryOverlayVisible = needsUserGesture && fullscreenSupported && !isFullscreen
  const showFullscreenWarningBanner = continueWithoutFullscreen
  const showFullscreenUnsupportedBanner = !fullscreenSupported

  // const entryOverlayVisible = allowFullscreen && needsUserGesture && fullscreenSupported && !isFullscreen
  // const showFullscreenWarningBanner = allowFullscreen && continueWithoutFullscreen
  // const showFullscreenUnsupportedBanner = allowFullscreen && !fullscreenSupported

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
      </div>
    )
  }

  const instructions = parseInstructions(challenge?.description)

  const technicalStatus = technicalDetails?.status?.description || ''
  const hasTechnicalDetails = Boolean(
    technicalDetails &&
    (
      technicalDetails.stderr ||
      technicalDetails.compile_output ||
      technicalDetails.message ||
      (technicalStatus && technicalStatus.toLowerCase() !== 'accepted')
    )
  )

  const renderFriendlyFeedback = () => {
    if (!friendlyFeedback) return null
    const likelyCauses = Array.isArray(friendlyFeedback.likely_causes)
      ? friendlyFeedback.likely_causes
      : (friendlyFeedback.likely_cause ? [friendlyFeedback.likely_cause] : [])
    const suggestedFixes = Array.isArray(friendlyFeedback.suggested_fixes)
      ? friendlyFeedback.suggested_fixes
      : (Array.isArray(friendlyFeedback.action_steps) ? friendlyFeedback.action_steps : [])

    return (
      <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/40 rounded-lg">
        <p className="text-blue-300 font-semibold">{friendlyFeedback.title}</p>
        <p className="text-sm text-blue-100 mt-1">{friendlyFeedback.summary}</p>

        {likelyCauses.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-blue-200 font-semibold">Likely causes</p>
            <ul className="mt-1 text-sm text-blue-100 list-disc list-inside space-y-1">
              {likelyCauses.map((cause, index) => (
                <li key={`${cause}-${index}`}>{cause}</li>
              ))}
            </ul>
          </div>
        )}

        {suggestedFixes.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-blue-200 font-semibold">Suggested checks</p>
            <ul className="mt-1 text-sm text-blue-100 list-disc list-inside space-y-1">
              {suggestedFixes.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderTechnicalDetails = () => {
    if (!hasTechnicalDetails) return null
    const statusDescription = technicalDetails?.status?.description || 'Unknown'
    const statusId = technicalDetails?.status?.id
    const statusLabel = statusId !== null && statusId !== undefined
      ? `${statusDescription} (id: ${statusId})`
      : statusDescription

    return (
      <details className="mb-4 rounded-lg border border-gray-700 bg-gray-800/60 p-3">
        <summary className="cursor-pointer text-sm text-gray-300">
          Show technical details
        </summary>
        <div className="mt-3 space-y-3 text-xs text-gray-200">
          <div>
            <p className="text-gray-400">Status</p>
            <p>{statusLabel}</p>
          </div>
          {technicalDetails?.stderr && (
            <div>
              <p className="text-gray-400">stderr</p>
              <pre className="whitespace-pre-wrap text-gray-300">
                {technicalDetails.stderr}
              </pre>
            </div>
          )}
          {technicalDetails?.compile_output && (
            <div>
              <p className="text-gray-400">compile_output</p>
              <pre className="whitespace-pre-wrap text-gray-300">
                {technicalDetails.compile_output}
              </pre>
            </div>
          )}
          {technicalDetails?.message && (
            <div>
              <p className="text-gray-400">message</p>
              <pre className="whitespace-pre-wrap text-gray-300">
                {technicalDetails.message}
              </pre>
            </div>
          )}
        </div>
      </details>
    )
  }

  const renderOutput = () => {
    const missingFunctions = extractMissingFunctions(testResults)
    const showRawTestFailure = Boolean(testResults && (!friendlyFeedback || testResults.passed))
    const hasErrorOutput = output.includes('Error') || output.includes('error')
    const showRawOutput = !(hasTechnicalDetails && hasErrorOutput)
    return (
      <div className="flex-1 min-h-0 p-4 overflow-auto">
        {showRawTestFailure && (
          <div className={`mb-4 p-3 rounded-lg ${testResults.passed ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
            <p className={`font-bold ${testResults.passed ? 'text-green-400' : 'text-red-400'}`}>
              {testResults.passed ? 'All Tests Passed!' : 'Test Failed'}
            </p>
            {!testResults.passed && (
              <div className="mt-2 text-sm">
                {missingFunctions && (
                  <p className="text-red-300 font-medium">
                    Missing required function{missingFunctions.length > 1 ? 's' : ''}: {missingFunctions.join(', ')}
                  </p>
                )}
                <p className="text-gray-300"><strong>Got:</strong> {testResults.actual}</p>
              </div>
            )}
          </div>
        )}
        {renderFriendlyFeedback()}
        {!friendlyFeedback && hint && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="font-medium text-yellow-400">Hint:</p>
            <p className="text-yellow-300 text-sm">{hint}</p>
          </div>
        )}
        {renderTechnicalDetails()}
        {showRawOutput && (
          <pre className={`text-sm whitespace-pre-wrap ${hasErrorOutput ? 'text-red-400' : 'text-gray-300'}`}>
            {output || 'Run your code to see output...'}
          </pre>
        )}
      </div>
    )
  }

  return (
    <>
      <div ref={containerRef} className="h-[100dvh] min-h-screen bg-gray-900 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 text-white px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="text-center flex-1 mx-2">
            <h1 className="font-bold text-base sm:text-xl text-white truncate">{challenge?.title}</h1>
            <p className="text-sm sm:text-lg font-bold text-white">{formatTime(time)}</p>
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

        {showFullscreenWarningBanner && (
          <FullscreenStatusBanner
            variant="warning"
            message="Saving is disabled outside fullscreen. Re-enter fullscreen to resume autosave."
            actionLabel="Re-enter Fullscreen"
            onAction={() => requestFullscreen({ userGesture: true })}
          />
        )}

        {!showFullscreenWarningBanner && showFullscreenUnsupportedBanner && (
          <FullscreenStatusBanner
            variant="info"
            message="Fullscreen is not supported in this browser. You can continue without it."
          />
        )}

        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 hover:bg-gray-750 transition"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              challenge?.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
              challenge?.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {challenge?.difficulty}
            </span>
            {resolveCompetencies().length > 0 ? (
              resolveCompetencies().map((competency) => (
                <span
                  key={competency}
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400"
                >
                  {competency}
                </span>
              ))
            ) : (
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-yellow-500">
                (Missing)
              </span>
            )}
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
              <ul className="space-y-2">
                {instructions.map((step) => (
                  <li key={step.id} className="flex gap-3 text-sm">
                    <span className="mt-2 h-2 w-2 rounded-full bg-akodemy-purple flex-shrink-0" />
                    <span className="text-gray-300">{step.text}</span>
                  </li>
                ))}
              </ul>
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
          <div className="ml-auto flex items-center gap-2">
            <div className="text-xs text-gray-500">
              Runs: {runCount}
            </div>
          </div>
        </div>

        {isMobile ? (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 pb-20">
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

            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {activeTab === 'editor' ? (
                <div className="flex-1 flex flex-col relative min-h-0">
                  {!allowClipboard && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/30 border-b border-yellow-700/50">
                      <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-xs text-yellow-400">Copy & Paste is disabled for this challenge.</span>
                    </div>
                  )}
                  <div className="flex-1 min-h-0 overflow-hidden touch-pan-y">
                  <Editor
                    key={`challenge-editor-${editorKey}`}
                    height="100%"
                    language={getEditorLanguage(challenge?.language)}
                    value={code}
                      onChange={(value) => setCode(value || '')}
                      onMount={handleEditorMount}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                        scrollbar: {
                          vertical: 'auto',
                          horizontal: 'auto',
                          alwaysConsumeMouseWheel: false
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-gray-900 overflow-auto min-h-0">
                  {renderOutput()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col border-r border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-sm font-medium text-gray-300">Code Editor</span>
                  {!allowClipboard && (
                    <div className="flex items-center gap-2 text-xs text-yellow-400">
                      <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
                      Copy & Paste disabled
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Editor
                    key={`challenge-editor-${editorKey}`}
                    height="100%"
                    language={getEditorLanguage(challenge?.language)}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    onMount={handleEditorMount}
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

              <div className="flex-1 flex flex-col bg-gray-900 min-h-0">
                <p className="px-4 py-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-700">Output</p>
                {renderOutput()}
              </div>
            </div>

            <div className="border-t border-gray-700 p-4 flex items-center justify-end bg-gray-800 sticky bottom-0 z-10">
              <button
                onClick={runCode}
                disabled={running || !hasValidCodeModification}
                title={!hasValidCodeModification ? 'Modify the starter code before running.' : ''}
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

      {isMobile && !showResults && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-700 bg-gray-800 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-6px_20px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-end">
            <button
              onClick={runCode}
              disabled={running || !hasValidCodeModification}
              title={!hasValidCodeModification ? 'Modify the starter code before running.' : ''}
              className="flex items-center gap-2 bg-akodemy-purple text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition text-sm"
            >
              <Play className="w-4 h-4" />
              {running ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>
      )}

      <FullscreenExitModal
        isOpen={showExitModal}
        onReenter={() => requestFullscreen({ userGesture: true })}
        onContinue={handleContinueWithoutFullscreen}
      />

      <FullscreenEntryOverlay
        isOpen={entryOverlayVisible}
        onRequestFullscreen={() => requestFullscreen({ userGesture: true })}
      />

      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Exit Challenge"
        message="Are you sure you want to exit? Your progress will be discarded."
        confirmLabel="Exit"
        cancelLabel="Continue Coding"
        confirmClassName="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
        cancelClassName="px-4 py-2 rounded-lg bg-akodemy-purple text-white hover:bg-purple-700 transition"
        reverseButtons
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

      <BadgeUnlockedModal
        badge={unlockedBadge}
        onClose={() => setUnlockedBadge(null)}
        onClaim={async () => {
          try {
            await api.post('/api/badges/claim', {
              language: unlockedBadge.language,
              difficulty: unlockedBadge.difficulty
            })
            setUnlockedBadge(null)
          } catch (error) {
            console.error('Failed to claim badge:', error)
          }
        }}
      />

      {saveDisabledToast && (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 bg-red-900/90 text-red-100 px-4 py-2 rounded-lg shadow-lg border border-red-700">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-sm font-medium">Saving is disabled outside fullscreen.</span>
          </div>
        </div>
      )}

      {!allowClipboard && clipboardToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 bg-red-900/90 text-red-100 px-4 py-2 rounded-lg shadow-lg border border-red-700">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-sm font-medium">Copy & Paste is blocked</span>
          </div>
        </div>
      )}
    </>
  )
}
