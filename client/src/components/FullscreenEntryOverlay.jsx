// UI component: Fullscreen Entry CTA overlay.
import { Maximize2 } from 'lucide-react'

// Component logic for Fullscreen Entry CTA overlay.
export default function FullscreenEntryOverlay({
  isOpen,
  onRequestFullscreen,
  message = 'Fullscreen is required to begin this challenge.'
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-page-in">
      <div
        className="w-full max-w-sm mx-4 rounded-2xl border border-gray-700 bg-gray-800 p-6 text-center shadow-2xl animate-modal-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fullscreen-entry-title"
        aria-describedby="fullscreen-entry-body"
        data-testid="fullscreen-entry-overlay"
      >
        <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-akodemy-purple/20 flex items-center justify-center">
          <Maximize2 className="h-6 w-6 text-akodemy-purple" />
        </div>
        <h2 id="fullscreen-entry-title" className="text-xl font-bold text-white">
          Enter Fullscreen to Start
        </h2>
        <p id="fullscreen-entry-body" className="text-gray-400 text-sm mt-2">
          {message}
        </p>
        <button
          onClick={onRequestFullscreen}
          className="mt-5 w-full px-4 py-2 rounded-lg bg-akodemy-purple text-white hover:bg-purple-700 transition font-semibold"
          autoFocus
          data-testid="fullscreen-entry-button"
        >
          Enter Fullscreen
        </button>
      </div>
    </div>
  )
}
