import { Award, Lock, CheckCircle } from 'lucide-react'

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

function BadgeCard({ language, difficulty, earned, progress }) {
  const info = BADGE_INFO[language]?.[difficulty]
  if (!info) return null
  
  const { completed = 0, total = 0 } = progress || {}
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return (
    <div 
      className={`relative bg-gray-800 border rounded-xl p-4 transition-all duration-300 ${
        earned 
          ? 'border-akodemy-purple shadow-lg shadow-akodemy-purple/20' 
          : 'border-gray-700 opacity-75 hover:opacity-100'
      }`}
    >
      {earned && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle className="w-6 h-6 text-green-400 bg-gray-800 rounded-full" />
        </div>
      )}
      
      <div className="flex flex-col items-center text-center">
        <div 
          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 ${
            earned 
              ? `bg-gradient-to-br ${info.color}` 
              : 'bg-gray-700'
          }`}
        >
          {earned ? info.icon : <Lock className="w-6 h-6 text-gray-500" />}
        </div>
        
        <h4 className={`font-semibold mb-1 ${earned ? 'text-white' : 'text-gray-400'}`}>
          {info.name}
        </h4>
        
        <p className="text-xs text-gray-500 mb-2">
          {DIFFICULTY_LABELS[difficulty]}
        </p>
        
        {!earned && total > 0 && (
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{completed}/{total}</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-akodemy-purple h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
        
        {earned && (
          <span className="text-xs text-green-400 font-medium">Earned</span>
        )}
      </div>
    </div>
  )
}

function LanguageBadgeSection({ language, badges, progress }) {
  const difficulties = ['beginner', 'intermediate', 'advanced']
  const earnedBadges = badges.filter(b => b.language === language)
  const earnedSet = new Set(earnedBadges.map(b => b.difficulty))
  
  const languageLabels = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java'
  }
  
  const languageIcons = {
    javascript: '/images/js-logo.png',
    python: '/images/python-logo.png',
    java: '/images/java-logo.png'
  }
  
  const totalEarned = earnedSet.size
  
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={languageIcons[language]} 
          alt={languageLabels[language]}
          className="w-8 h-8 object-contain"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div>
          <h3 className="text-lg font-semibold text-white">{languageLabels[language]}</h3>
          <p className="text-xs text-gray-500">{totalEarned}/3 badges earned</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {difficulties.map(difficulty => (
          <BadgeCard
            key={`${language}-${difficulty}`}
            language={language}
            difficulty={difficulty}
            earned={earnedSet.has(difficulty)}
            progress={progress?.[language]?.[difficulty]}
          />
        ))}
      </div>
    </div>
  )
}

export default function BadgeDisplay({ badges = [], progress = {} }) {
  const languages = ['javascript', 'python', 'java']
  const totalBadges = badges.length
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-akodemy-purple/20 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-akodemy-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Badges</h2>
            <p className="text-sm text-gray-500">{totalBadges}/9 earned</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {languages.map(language => (
          <LanguageBadgeSection
            key={language}
            language={language}
            badges={badges}
            progress={progress}
          />
        ))}
      </div>
    </div>
  )
}

export { BadgeCard, LanguageBadgeSection, BADGE_INFO }
