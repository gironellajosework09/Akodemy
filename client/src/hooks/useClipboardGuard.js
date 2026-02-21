import { useCallback, useEffect, useRef } from 'react'

const CLIPBOARD_KEYS = new Set(['c', 'v', 'x'])
const PASTE_INPUT_TYPES = new Set(['insertfrompaste', 'insertfromdrop'])

const CAPTURE_OPTIONS = { capture: true }

export default function useClipboardGuard({
  enabled = false,
  workspaceRef,
  editorRef,
  value = '',
  onRestoreValue,
  onBlocked
} = {}) {
  const lastKnownValueRef = useRef(value || '')
  const restoreLockRef = useRef(false)
  const pasteIntentUntilRef = useRef(0)
  const elementCleanupMapRef = useRef(new Map())

  useEffect(() => {
    if (restoreLockRef.current) return
    lastKnownValueRef.current = value || ''
  }, [value])

  const isWorkspaceTarget = useCallback((target) => {
    const workspace = workspaceRef?.current
    if (!workspace || typeof Node === 'undefined') return false

    if (target instanceof Node && workspace.contains(target)) {
      return true
    }

    const active = document.activeElement
    return active instanceof Node && workspace.contains(active)
  }, [workspaceRef])

  const isEditorTarget = useCallback((target) => {
    if (!(target instanceof Element)) return false
    return Boolean(target.closest('.monaco-editor'))
  }, [])

  const notifyBlocked = useCallback((action) => {
    if (typeof onBlocked === 'function') {
      onBlocked(action)
    }
  }, [onBlocked])

  const restoreEditorValue = useCallback(() => {
    const safeValue = lastKnownValueRef.current || ''
    const editor = editorRef?.current

    restoreLockRef.current = true
    try {
      if (editor && typeof editor.getValue === 'function' && typeof editor.setValue === 'function') {
        const currentValue = editor.getValue()
        if (currentValue !== safeValue) {
          editor.setValue(safeValue)
        }
      }

      if (typeof onRestoreValue === 'function') {
        onRestoreValue(safeValue)
      }
    } finally {
      setTimeout(() => {
        restoreLockRef.current = false
      }, 0)
    }
  }, [editorRef, onRestoreValue])

  const blockEvent = useCallback((event, action, { markPasteIntent = false } = {}) => {
    if (!enabled || !isWorkspaceTarget(event.target)) return false

    if (markPasteIntent) {
      pasteIntentUntilRef.current = Date.now() + 1000
    }

    event.preventDefault?.()
    event.stopPropagation?.()
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation()
    }

    notifyBlocked(action)
    return true
  }, [enabled, isWorkspaceTarget, notifyBlocked])

  const handleCopy = useCallback((event) => {
    blockEvent(event, 'copy')
  }, [blockEvent])

  const handleCut = useCallback((event) => {
    blockEvent(event, 'cut')
  }, [blockEvent])

  const handlePaste = useCallback((event) => {
    const blocked = blockEvent(event, 'paste', { markPasteIntent: true })
    if (blocked) {
      queueMicrotask(() => {
        restoreEditorValue()
      })
    }
  }, [blockEvent, restoreEditorValue])

  const handleContextMenu = useCallback((event) => {
    blockEvent(event, 'contextmenu')
  }, [blockEvent])

  const handleSelectStart = useCallback((event) => {
    if (!enabled || !isWorkspaceTarget(event.target)) return
    if (isEditorTarget(event.target)) return
    event.preventDefault?.()
  }, [enabled, isEditorTarget, isWorkspaceTarget])

  const handleBeforeInput = useCallback((event) => {
    const inputType = String(event.inputType || '').toLowerCase()
    if (!PASTE_INPUT_TYPES.has(inputType)) return

    const blocked = blockEvent(event, 'beforeinput', { markPasteIntent: true })
    if (blocked) {
      queueMicrotask(() => {
        restoreEditorValue()
      })
    }
  }, [blockEvent, restoreEditorValue])

  const handleInput = useCallback((event) => {
    if (!enabled || !isWorkspaceTarget(event.target)) return

    const inputType = String(event.inputType || '').toLowerCase()
    const looksLikePaste = PASTE_INPUT_TYPES.has(inputType)
    const pendingPasteIntent = Date.now() <= pasteIntentUntilRef.current
    if (!looksLikePaste && !pendingPasteIntent) return

    event.preventDefault?.()
    event.stopPropagation?.()
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation()
    }
    restoreEditorValue()
    notifyBlocked('input')
  }, [enabled, isWorkspaceTarget, restoreEditorValue, notifyBlocked])

  const handleKeyDown = useCallback((event) => {
    if (!enabled || !isWorkspaceTarget(event.target)) return

    const key = String(event.key || '').toLowerCase()
    const ctrlOrMeta = event.ctrlKey || event.metaKey
    const isClipboardShortcut = ctrlOrMeta && CLIPBOARD_KEYS.has(key)
    const isShiftInsert = event.shiftKey && key === 'insert'
    const isCtrlInsert = event.ctrlKey && key === 'insert'
    if (!isClipboardShortcut && !isShiftInsert && !isCtrlInsert) return

    const isPasteIntent = (ctrlOrMeta && key === 'v') || isShiftInsert
    const blocked = blockEvent(event, 'keydown', { markPasteIntent: isPasteIntent })
    if (blocked && isPasteIntent) {
      queueMicrotask(() => {
        restoreEditorValue()
      })
    }
  }, [enabled, isWorkspaceTarget, blockEvent, restoreEditorValue])

  const attachElementListeners = useCallback((element) => {
    if (!element || elementCleanupMapRef.current.has(element)) return

    const listeners = [
      ['copy', handleCopy],
      ['cut', handleCut],
      ['paste', handlePaste],
      ['contextmenu', handleContextMenu],
      ['keydown', handleKeyDown],
      ['beforeinput', handleBeforeInput],
      ['input', handleInput],
      ['selectstart', handleSelectStart]
    ]

    listeners.forEach(([type, listener]) => {
      element.addEventListener(type, listener, CAPTURE_OPTIONS)
    })

    elementCleanupMapRef.current.set(element, () => {
      listeners.forEach(([type, listener]) => {
        element.removeEventListener(type, listener, CAPTURE_OPTIONS)
      })
    })
  }, [
    handleBeforeInput,
    handleContextMenu,
    handleCopy,
    handleCut,
    handleInput,
    handleKeyDown,
    handlePaste,
    handleSelectStart
  ])

  const detachElementListeners = useCallback(() => {
    elementCleanupMapRef.current.forEach((cleanup) => cleanup())
    elementCleanupMapRef.current.clear()
  }, [])

  const pruneDetachedElementListeners = useCallback(() => {
    elementCleanupMapRef.current.forEach((cleanup, element) => {
      if (element.isConnected) return
      cleanup()
      elementCleanupMapRef.current.delete(element)
    })
  }, [])

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      detachElementListeners()
      return undefined
    }

    const documentListeners = [
      ['copy', handleCopy],
      ['cut', handleCut],
      ['paste', handlePaste],
      ['contextmenu', handleContextMenu],
      ['keydown', handleKeyDown],
      ['beforeinput', handleBeforeInput],
      ['input', handleInput],
      ['selectstart', handleSelectStart]
    ]

    documentListeners.forEach(([type, listener]) => {
      document.addEventListener(type, listener, CAPTURE_OPTIONS)
    })

    const attachTargets = () => {
      pruneDetachedElementListeners()

      const workspace = workspaceRef?.current
      if (!workspace) return

      attachElementListeners(workspace)

      const editorRoot = editorRef?.current?.getDomNode?.()
      if (!editorRoot) return

      attachElementListeners(editorRoot)
      editorRoot
        .querySelectorAll('textarea, input, [contenteditable="true"]')
        .forEach((node) => attachElementListeners(node))
    }

    attachTargets()

    const workspace = workspaceRef?.current
    const observerTarget = workspace || document.body
    const observer = new MutationObserver(() => {
      attachTargets()
    })
    observer.observe(observerTarget, { childList: true, subtree: true })

    const intervalId = window.setInterval(attachTargets, 800)

    return () => {
      documentListeners.forEach(([type, listener]) => {
        document.removeEventListener(type, listener, CAPTURE_OPTIONS)
      })
      observer.disconnect()
      window.clearInterval(intervalId)
      detachElementListeners()
    }
  }, [
    attachElementListeners,
    detachElementListeners,
    editorRef,
    enabled,
    handleBeforeInput,
    handleContextMenu,
    handleCopy,
    handleCut,
    handleInput,
    handleKeyDown,
    handlePaste,
    handleSelectStart,
    pruneDetachedElementListeners,
    workspaceRef
  ])
}
