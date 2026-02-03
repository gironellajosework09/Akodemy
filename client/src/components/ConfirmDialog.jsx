// UI component: Confirm Dialog.
import { X } from 'lucide-react'

// Component logic for Confirm Dialog.
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmClassName,
  cancelClassName,
  reverseButtons = false
}) {
  if (!isOpen) return null
  const defaultCancelClass =
    'px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition'
  const defaultConfirmClass =
    'px-4 py-2 rounded-lg bg-akodemy-purple text-white hover:bg-purple-700 transition'

  const cancelButton = (
    <button
      onClick={onCancel}
      className={cancelClassName || defaultCancelClass}
    >
      {cancelLabel}
    </button>
  )

  const confirmButton = (
    <button
      onClick={onConfirm}
      className={confirmClassName || defaultConfirmClass}
    >
      {confirmLabel}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-page-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-modal-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          {reverseButtons ? confirmButton : cancelButton}
          {reverseButtons ? cancelButton : confirmButton}
        </div>
      </div>
    </div>
  )
}



