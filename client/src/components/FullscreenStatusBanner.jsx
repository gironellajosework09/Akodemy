// UI component: Fullscreen status banner (warning/info).
import { AlertTriangle, Info } from 'lucide-react'

const VARIANT_STYLES = {
  warning: {
    container: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    icon: AlertTriangle
  },
  info: {
    container: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
    icon: Info
  }
}

// Component logic for Fullscreen status banner.
export default function FullscreenStatusBanner({ variant = 'warning', message, actionLabel, onAction }) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.warning
  const Icon = styles.icon

  return (
    <div
      className={`w-full border-b px-4 py-2 text-xs sm:text-sm flex items-center gap-2 ${styles.container}`}
      role="status"
      aria-live="polite"
      data-testid={`fullscreen-banner-${variant}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="px-3 py-1 rounded-md bg-transparent border border-current text-xs font-semibold hover:bg-white/5 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
