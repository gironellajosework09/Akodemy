import { X, Award, Sparkles } from 'lucide-react'

const BADGE_INFO = {
  java: {
    beginner: { name: 'Java Barista', icon: '☕', color: 'from-orange-500 to-red-600' },
    intermediate: { name: 'Java Brewer', icon: '🫖', color: 'from-red-500 to-orange-600' },
    advanced: { name: 'Java Roast Master', icon: '🔥', color: 'from-amber-500 to-red-700' }
  },
  python: {
    beginner: { name: 'Python Catcher', icon: '🐍', color: 'from-green-500 to-emerald-600' },
    intermediate: { name: 'Python Handler', icon: '🎯', color: 'from-emerald-500 to-green-600' },
    advanced: { name: 'Python Expert', icon: '🏆', color: 'from-teal-500 to-green-700' }
  },
  javascript: {
    beginner: { name: 'Script Starter', icon: '⚡', color: 'from-yellow-500 to-amber-600' },
    intermediate: { name: 'Script Engineer', icon: '🛠️', color: 'from-amber-500 to-yellow-600' },
    advanced: { name: 'Script Architect', icon: '🏗️', color: 'from-orange-500 to-yellow-700' }
  }
}

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
}

const LANGUAGE_LABELS = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java'
}

export default function BadgeUnlockedModal({ badge, onClose, onClaim }) {
  if (!badge) return null
  
  const info = BADGE_INFO[badge.language]?.[badge.difficulty]
  if (!info) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-page-in">
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center animate-modal-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Congratulations!</h2>
          <p className="text-gray-400">You have completed all challenges with correct answers.</p>
          <p className="text-green-400 font-medium mt-2">Your badge is now ready to be claimed.</p>
        </div>
        
        <div className="mb-6">
          <div 
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl mb-4 bg-gradient-to-br ${info.color} shadow-lg shadow-akodemy-purple/30`}
          >
            {info.icon}
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{info.name}</h3>
          <p className="text-sm text-gray-400">
            {LANGUAGE_LABELS[badge.language]} - {DIFFICULTY_LABELS[badge.difficulty]}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-400">
          <Award className="w-4 h-4 text-akodemy-purple" />
          <span>You completed all {DIFFICULTY_LABELS[badge.difficulty].toLowerCase()} challenges!</span>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onClaim}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <Award className="w-5 h-5" />
            Claim Badge
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
          >
            Claim Later
          </button>
        </div>
      </div>
    </div>
  )
}
