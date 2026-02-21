// Hook: manage fullscreen entry and exit warnings for challenge sessions.
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useFullscreenGuard({ targetRef, enabled = true } = {}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [needsUserGesture, setNeedsUserGesture] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [continueWithoutFullscreen, setContinueWithoutFullscreen] = useState(false)

  const hasEnteredFullscreenRef = useRef(false)
  const pendingExitTimerRef = useRef(null)
  const loggedErrorRef = useRef(false)
  const isMountedRef = useRef(false)
  const continueWithoutFullscreenRef = useRef(false)
  const isFullscreenRef = useRef(false)
  const suppressExitModalRef = useRef(false)

  const getTargetElement = useCallback(() => {
    if (targetRef?.current) return targetRef.current
    if (typeof document === 'undefined') return null
    return document.documentElement
  }, [targetRef])

  const detectSupport = useCallback(() => {
    if (typeof document === 'undefined') return false
    const enabledFlag = typeof document.fullscreenEnabled === 'boolean' ? document.fullscreenEnabled : true
    const target = getTargetElement()
    return Boolean(enabledFlag && target?.requestFullscreen)
  }, [getTargetElement])

  const requestFullscreen = useCallback(async ({ userGesture = false } = {}) => {
    if (!enabled || typeof document === 'undefined') return false

    if (document.fullscreenElement) {
      setIsFullscreen(true)
      setNeedsUserGesture(false)
      return true
    }

    const target = getTargetElement()
    if (!target?.requestFullscreen) {
      setIsSupported(false)
      setNeedsUserGesture(false)
      return false
    }

    const enabledFlag = typeof document.fullscreenEnabled === 'boolean' ? document.fullscreenEnabled : true
    if (!enabledFlag) {
      setIsSupported(false)
      setNeedsUserGesture(false)
      return false
    }

    try {
      await target.requestFullscreen()
      setNeedsUserGesture(false)
      setShowExitModal(false)
      return true
    } catch (error) {
      const name = error?.name
      if ((name === 'NotAllowedError' || name === 'SecurityError') && !userGesture) {
        setNeedsUserGesture(true)
      }
      if (!loggedErrorRef.current) {
        loggedErrorRef.current = true
        console.warn('Fullscreen request failed', error)
      }
      return false
    }
  }, [enabled, getTargetElement])

  const exitFullscreen = useCallback(async ({ suppressModal = false } = {}) => {
    if (typeof document === 'undefined') return false

    if (!document.fullscreenElement) {
      if (suppressModal) {
        suppressExitModalRef.current = false
      }
      setIsFullscreen(false)
      return true
    }

    if (suppressModal) {
      suppressExitModalRef.current = true
    }

    try {
      await document.exitFullscreen()
      return true
    } catch (error) {
      if (!loggedErrorRef.current) {
        loggedErrorRef.current = true
        console.warn('Fullscreen exit failed', error)
      }
      suppressExitModalRef.current = false
      return false
    }
  }, [])

  const handleContinueWithoutFullscreen = useCallback(() => {
    setContinueWithoutFullscreen(true)
    setShowExitModal(false)
  }, [])

  const dismissExitModal = useCallback(() => {
    setShowExitModal(false)
  }, [])

  useEffect(() => {
    continueWithoutFullscreenRef.current = continueWithoutFullscreen
  }, [continueWithoutFullscreen])

  useEffect(() => {
    isFullscreenRef.current = isFullscreen
  }, [isFullscreen])

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined
    isMountedRef.current = true

    const supported = detectSupport()
    setIsSupported(supported)
    setNeedsUserGesture(false)
    setIsFullscreen(Boolean(document.fullscreenElement))

    if (supported) {
      requestFullscreen({ userGesture: false })
    }

    const handleFullscreenChange = () => {
      const nowFullscreen = Boolean(document.fullscreenElement)
      setIsFullscreen(nowFullscreen)
      isFullscreenRef.current = nowFullscreen

      if (nowFullscreen) {
        hasEnteredFullscreenRef.current = true
        setNeedsUserGesture(false)
        setShowExitModal(false)
        if (continueWithoutFullscreenRef.current) {
          setContinueWithoutFullscreen(false)
        }
        return
      }

      if (suppressExitModalRef.current) {
        suppressExitModalRef.current = false
        return
      }

      if (!hasEnteredFullscreenRef.current) {
        return
      }

      if (continueWithoutFullscreenRef.current) {
        return
      }

      if (!isMountedRef.current) return
      if (document.fullscreenElement) return
      if (continueWithoutFullscreenRef.current) return
      setShowExitModal(true)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      isMountedRef.current = false
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (pendingExitTimerRef.current) {
        clearTimeout(pendingExitTimerRef.current)
      }
    }
  }, [detectSupport, enabled, requestFullscreen])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined

    const handleKeyDown = (event) => {
      if (!isFullscreenRef.current) return

      const key = event.key
      const isEscape = key === 'Escape'
      const isF11 = key === 'F11'
      const isAltTab = event.altKey && key === 'Tab'
      const isMetaTab = event.metaKey && key === 'Tab'

      if (isEscape || isF11 || isAltTab || isMetaTab) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [enabled])

  useEffect(() => () => {
    exitFullscreen({ suppressModal: true })
  }, [exitFullscreen])

  const autosaveEnabled = (isSupported ? isFullscreen : true) && !continueWithoutFullscreen

  return {
    isFullscreen,
    isSupported,
    needsUserGesture,
    showExitModal,
    continueWithoutFullscreen,
    autosaveEnabled,
    requestFullscreen,
    exitFullscreen,
    handleContinueWithoutFullscreen,
    dismissExitModal
  }
}
