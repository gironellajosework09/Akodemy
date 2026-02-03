import { useEffect, useState } from 'react'
import { Award, Lock, CheckCircle, Star, Loader2 } from 'lucide-react'
import api from '../services/api'

const BADGE_INFO = {
  java: {
    beginner: { name: 'Java Barista', image: '/images/Barista.png', color: 'from-orange-500 to-red-600' },
    intermediate: { name: 'Java Brewer', image: '/images/Brewer.png', color: 'from-red-500 to-orange-600' },
    advanced: { name: 'Java Roastmaster', image: '/images/Roastmaster.png', color: 'from-amber-500 to-red-700' }
  },
  python: {
    beginner: { name: 'Python Hatcher', image: '/images/hatcher.png', color: 'from-green-500 to-emerald-600' },
    intermediate: { name: 'Python Handler', image: '/images/handler.png', color: 'from-emerald-500 to-green-600' },
    advanced: { name: 'Python Expert', image: '/images/Expert.png', color: 'from-teal-500 to-green-700' }
  },
  javascript: {
    beginner: { name: 'JavaScript Starter', image: '/images/Starter.png', color: 'from-yellow-500 to-amber-600' },
    intermediate: { name: 'JavaScript Engineer', image: '/images/Engineer.png', color: 'from-amber-500 to-yellow-600' },
    advanced: { name: 'JavaScript Architect', image: '/images/Architect.png', color: 'from-orange-500 to-yellow-700' }
  }
}

const BADGE_PLACEHOLDER_SRC = '/images/akodemy-logo.png'

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
}

function BadgeCard({ language, difficulty, badgeData, progress, onClaim, onEquip, onUnequip }) {
  const [claiming, setClaiming] = useState(false)
  const [equipping, setEquipping] = useState(false)
  
  const info = BADGE_INFO[language]?.[difficulty]
  if (!info) return null
  const badgeImage = info.image || BADGE_PLACEHOLDER_SRC
  
  const { completed = 0, total = 0, status = 'locked', equipped = false } = progress || {}
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  
  const isClaimable = status === 'claimable'
  const isClaimed = status === 'claimed'
  const isLocked = status === 'locked'
  
  const handleClaim = async () => {
    setClaiming(true)
    try {
      await onClaim(language, difficulty)
    } finally {
      setClaiming(false)
    }
  }
  
  const handleEquip = async () => {
    setEquipping(true)
    try {
      if (equipped) {
        await onUnequip()
      } else {
        await onEquip(language, difficulty)
      }
    } finally {
      setEquipping(false)
    }
  }
  
  return (
    <div 
      className={`relative bg-gray-800 border rounded-xl p-4 transition-all duration-300 ${
        isClaimed 
          ? equipped 
            ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-500/50' 
            : 'border-akodemy-purple shadow-lg shadow-akodemy-purple/20'
          : isClaimable
            ? 'border-green-500 shadow-lg shadow-green-500/20 animate-pulse'
            : 'border-gray-700 opacity-75 hover:opacity-100'
      }`}
    >
      {equipped && (
        <div className="absolute -top-2 -right-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 bg-gray-800 rounded-full" />
        </div>
      )}
      
      {isClaimed && !equipped && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle className="w-6 h-6 text-green-400 bg-gray-800 rounded-full" />
        </div>
      )}
      
      <div className="flex flex-col items-center text-center">
        <div 
          className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl mb-3 ${
            isClaimable || isClaimed
              ? `bg-gradient-to-br ${info.color}` 
              : 'bg-gray-700'
          }`}
        >
        {isClaimable || isClaimed ? (
          <img
            src={badgeImage}
            alt={info.name}
            className="w-16 h-16 object-cover"
          />
        ) : (
          <Lock className="w-6 h-6 text-gray-500" />
        )}
      </div>
        
        <h4 className={`font-semibold mb-1 ${isClaimable || isClaimed ? 'text-white' : 'text-gray-400'}`}>
          {info.name}
        </h4>
        
        <p className="text-xs text-gray-500 mb-2">
          {DIFFICULTY_LABELS[difficulty]}
        </p>
        
        {isLocked && total > 0 && (
          <div className="w-full mb-2">
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
        
        {isClaimable && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1"
          >
            {claiming ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Award className="w-3 h-3" />
                Claim Badge
              </>
            )}
          </button>
        )}
        
        {isClaimed && (
          <div className="w-full mt-2 space-y-1">
            <span className="block text-xs text-green-400 font-medium">Claimed</span>
            <button
              onClick={handleEquip}
              disabled={equipping}
              className={`w-full text-xs py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1 min-w-0 whitespace-nowrap ${
                equipped
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {equipping ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : equipped ? (
                <>
                  <Star className="w-3 h-3 fill-current hidden sm:inline" />
                  <span className="truncate">Equipped</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Equip</span>
                  <span className="hidden sm:inline">Equip as Title</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function LanguageBadgeSection({ language, badges, progress, onClaim, onEquip, onUnequip }) {
  const difficulties = ['beginner', 'intermediate', 'advanced']
  const claimedBadges = badges.filter(b => b.language === language && b.status === 'claimed')
  
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
  
  const totalClaimed = claimedBadges.length
  
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
          <p className="text-xs text-gray-500">{totalClaimed}/3 badges claimed</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {difficulties.map(difficulty => {
          const badgeData = badges.find(
            b => b.language === language && b.difficulty === difficulty
          )
          return (
            <BadgeCard
              key={`${language}-${difficulty}`}
              language={language}
              difficulty={difficulty}
              badgeData={badgeData}
              progress={progress?.[language]?.[difficulty]}
              onClaim={onClaim}
              onEquip={onEquip}
              onUnequip={onUnequip}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function BadgeDisplay({ badges = [], progress = {}, onRefresh }) {
  const [showClaimModal, setShowClaimModal] = useState(null)
  const [displayBadges, setDisplayBadges] = useState(badges)
  const languages = ['javascript', 'python', 'java']
  const claimedBadges = displayBadges.filter(b => b.status === 'claimed')
  const equippedBadge = displayBadges.find(b => b.equipped)

  useEffect(() => {
    setDisplayBadges(badges)
  }, [badges])
  
  const handleClaim = async (language, difficulty) => {
    try {
      const response = await api.post('/api/badges/claim', { language, difficulty })
      if (response.data.success) {
        setShowClaimModal({ language, difficulty, badgeName: response.data.badge.badgeName })
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error('Failed to claim badge:', error)
    }
  }
  
  const handleEquip = async (language, difficulty) => {
    const snapshot = displayBadges
    setDisplayBadges(prev => prev.map(badge => ({
      ...badge,
      equipped: badge.language === language && badge.difficulty === difficulty
    })))
    try {
      await api.post('/api/badges/equip', { language, difficulty })
      if (onRefresh) onRefresh()
    } catch (error) {
      setDisplayBadges(snapshot)
      console.error('Failed to equip badge:', error)
    }
  }
  
  const handleUnequip = async () => {
    const snapshot = displayBadges
    setDisplayBadges(prev => prev.map(badge => ({ ...badge, equipped: false })))
    try {
      await api.post('/api/badges/unequip')
      if (onRefresh) onRefresh()
    } catch (error) {
      setDisplayBadges(snapshot)
      console.error('Failed to unequip badge:', error)
    }
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-akodemy-purple/20 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-akodemy-purple" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Badges</h2>
            <p className="text-sm text-gray-500">{claimedBadges.length}/9 claimed</p>
          </div>
        </div>
        
        {equippedBadge && (
          <div className="flex items-center gap-2 bg-yellow-600/20 border border-yellow-500/30 rounded-lg px-3 py-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-yellow-400 font-medium">
              {equippedBadge.badgeName}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {languages.map(language => (
          <LanguageBadgeSection
            key={language}
            language={language}
            badges={displayBadges}
            progress={progress}
            onClaim={handleClaim}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
          />
        ))}
      </div>
      
      {showClaimModal && (
        <ClaimSuccessModal 
          badge={showClaimModal} 
          onClose={() => setShowClaimModal(null)} 
        />
      )}
    </div>
  )
}

function ClaimSuccessModal({ badge, onClose }) {
  const info = BADGE_INFO[badge.language]?.[badge.difficulty]
  if (!info) return null
  const badgeImage = info.image || BADGE_PLACEHOLDER_SRC
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-page-in">
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center animate-modal-in">
        <div className="mb-6">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Badge Claimed!</h2>
          <p className="text-gray-400">You've earned a new title</p>
        </div>
        
        <div className="mb-6">
          <div
            className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 bg-gradient-to-br ${info.color} shadow-lg`}
          >
            <img
              src={badgeImage}
              alt={info.name}
              className="w-20 h-20 object-cover"
            />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{info.name}</h3>
          <p className="text-sm text-gray-400">
            You can now equip this as your profile title!
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-akodemy-purple text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Awesome!
        </button>
      </div>
    </div>
  )
}

export { BadgeCard, LanguageBadgeSection, BADGE_INFO }
