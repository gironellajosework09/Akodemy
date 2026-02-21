// UI component: Fullscreen Exit Warning Modal (blocking).
import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

const FOCUSABLE_SELECTOR = [
  'button',
  '[href]',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

// Component logic for Fullscreen Exit Warning Modal.
export default function FullscreenExitModal({ isOpen, onReenter, onExitChallenge }) {
  const modalRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    previouslyFocusedRef.current = document.activeElement

    const node = modalRef.current
    const focusable = node ? Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)) : []
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (first) {
      first.focus()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (event.key !== 'Tab' || focusable.length === 0) return

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const handleGlobalKeyDown = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
    }

    node?.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleGlobalKeyDown, true)

    return () => {
      node?.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleGlobalKeyDown, true)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-page-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fullscreen-exit-title"
        aria-describedby="fullscreen-exit-body"
        tabIndex={-1}
        className="w-full max-w-md mx-4 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-2xl animate-modal-in"
        data-testid="fullscreen-exit-modal"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <h2 id="fullscreen-exit-title" className="text-xl font-bold text-white">
            You exited fullscreen
          </h2>
        </div>
        <p id="fullscreen-exit-body" className="text-gray-300 mb-6">
          If you exit fullscreen, your progress won&apos;t be saved and you will exit the challenge.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onExitChallenge}
            className="px-4 py-2 rounded-lg border border-red-500/50 text-red-200 hover:bg-red-500/10 transition font-semibold"
            data-testid="fullscreen-exit-challenge"
          >
            Exit Challenge
          </button>
          <button
            onClick={onReenter}
            className="px-4 py-2 rounded-lg bg-akodemy-purple text-white hover:bg-purple-700 transition font-semibold"
            data-testid="fullscreen-reenter"
          >
            Re-enter Fullscreen
          </button>
        </div>
      </div>
    </div>
  )
}
