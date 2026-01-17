// Reusable centered loading spinner component
export default function LoadingSpinner({ size = 'default', overlay = false }) {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    default: 'h-12 w-12 border-2',
    large: 'h-16 w-16 border-4'
  }

  const spinner = (
    <div 
      className={`animate-spin rounded-full ${sizeClasses[size] || sizeClasses.default} border-akodemy-purple border-t-transparent`}
      role="status"
      aria-label="Loading"
    />
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80">
        {spinner}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      {spinner}
    </div>
  )
}

export function InlineSpinner({ size = 'small' }) {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    default: 'h-6 w-6 border-2',
    large: 'h-8 w-8 border-2'
  }

  return (
    <div 
      className={`inline-block animate-spin rounded-full ${sizeClasses[size] || sizeClasses.small} border-akodemy-purple border-t-transparent`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function ContentSpinner({ size = 'default' }) {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    default: 'h-12 w-12 border-2',
    large: 'h-16 w-16 border-4'
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size] || sizeClasses.default} border-akodemy-purple border-t-transparent`}
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
