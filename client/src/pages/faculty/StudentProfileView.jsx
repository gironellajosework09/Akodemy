import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronUp, User, Award, Trophy, Star, Lock } from 'lucide-react'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

const DIFFICULTY_CHIPS = {
  beginner: { label: 'Easy', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
  intermediate: { label: 'Intermediate', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
  advanced: { label: 'Advanced', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/30' }
}

const LANGUAGE_DISPLAY = {
  javascript: { name: 'JavaScript', icon: 'JS', bgColor: 'bg-yellow-500' },
  python: { name: 'Python', icon: '🐍', bgColor: 'bg-blue-500' },
  java: { name: 'Java', icon: '☕', bgColor: 'bg-orange-500' }
}

export default function StudentProfileView() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const [student, setStudent] = useState(null)
  const [competencyData, setCompetencyData] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('badges')
  const [expandedBadgeLang, setExpandedBadgeLang] = useState(null)
  const [expandedCompLang, setExpandedCompLang] = useState(null)

  useEffect(() => {
    fetchStudentData()
  }, [studentId])

  const fetchStudentData = async () => {
    try {
      const [competencyRes, profileRes] = await Promise.all([
        api.get(`/api/faculty/student/${studentId}/competencies`),
        api.get(`/api/faculty/students/${studentId}/profile`)
      ])
      setStudent(profileRes.data.student)
      setCompetencyData(competencyRes.data)
      setProfileData(profileRes.data)
    } catch (error) {
      console.error('Failed to fetch student:', error)
    } finally {
      setLoading(false)
    }
  }

  const languages = ['javascript', 'python', 'java']
  const difficulties = ['beginner', 'intermediate', 'advanced']

  const getMasteryLevel = (percentage, hasActivity) => {
    if (!hasActivity || percentage === 0) {
      return { label: '', color: 'bg-gray-600', textColor: 'text-gray-500' }
    }
    if (percentage >= 80) return { label: 'Mastered', color: 'bg-green-500', textColor: 'text-green-400' }
    if (percentage >= 40) return { label: 'Developing', color: 'bg-yellow-500', textColor: 'text-yellow-400' }
    return { label: 'Needs Practice', color: 'bg-red-500', textColor: 'text-red-400' }
  }

  const getLanguageIcon = (lang) => {
    switch (lang) {
      case 'javascript': return '/images/js-logo.png'
      case 'python': return '/images/python-logo.png'
      case 'java': return '/images/java-logo.png'
      default: return null
    }
  }

  const DEFAULT_BADGE_NAMES = {
    javascript: { beginner: 'Script Starter', intermediate: 'Script Engineer', advanced: 'Script Architect' },
    python: { beginner: 'Python Catcher', intermediate: 'Python Handler', advanced: 'Python Expert' },
    java: { beginner: 'Java Barista', intermediate: 'Java Brewer', advanced: 'Java Roast Master' }
  }

  const getBadgesForLanguage = (lang) => {
    return difficulties.map(difficulty => {
      const progress = profileData?.badgeProgress?.[lang]?.[difficulty]
      return {
        key: `${lang}-${difficulty}`,
        language: lang,
        difficulty,
        badgeName: progress?.badgeName || DEFAULT_BADGE_NAMES[lang]?.[difficulty] || `${lang} ${difficulty}`,
        status: progress?.status || 'locked',
        equipped: progress?.equipped || false,
        completed: progress?.completed || 0,
        total: progress?.total || 0
      }
    })
  }

  const getBadgeCounts = () => {
    let claimed = 0, claimable = 0, locked = 0
    const total = languages.length * difficulties.length
    
    for (const lang of languages) {
      for (const diff of difficulties) {
        const progress = profileData?.badgeProgress?.[lang]?.[diff]
        if (progress?.status === 'claimed') claimed++
        else if (progress?.status === 'claimable') claimable++
        else locked++
      }
    }
    
    return { total, claimed, claimable, locked }
  }

  const getLanguageBadgeSummary = (lang) => {
    const badges = getBadgesForLanguage(lang)
    const claimed = badges.filter(b => b.status === 'claimed').length
    const claimable = badges.filter(b => b.status === 'claimable').length
    return { total: badges.length, claimed, claimable }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    )
  }

  const badgeCounts = getBadgeCounts()

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <button
          onClick={() => navigate('/faculty/students')}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-4 sm:mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Back to Students</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          <div className="w-full lg:w-72 space-y-4 sm:space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Student Profile</h2>
              <div className="flex flex-col items-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <User className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg text-white text-center">{student?.name || 'Student Name'}</h3>
                <p className="text-gray-500 text-xs sm:text-sm text-center break-all">{student?.email}</p>
                
                {profileData?.equippedTitle ? (
                  <div className="mt-2 sm:mt-3 flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-akodemy-purple/30 to-akodemy-gold/30 rounded-full border border-akodemy-gold/50">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-akodemy-gold flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-akodemy-gold truncate max-w-[150px] sm:max-w-none">
                      {profileData.equippedTitle.displayName}
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 sm:mt-3 text-gray-500 text-xs sm:text-sm italic">No title equipped</p>
                )}
              </div>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact</span>
                  <span className="text-gray-300">{student?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sex</span>
                  <span className="text-gray-300">{student?.sex || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Birthdate</span>
                  <span className="text-gray-300">{student?.birthdate || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-akodemy-gold" />
                <h3 className="font-semibold text-sm sm:text-base text-white">Badge Summary</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Badges</span>
                  <span className="text-white font-semibold">{badgeCounts.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Claimed</span>
                  <span className="text-green-400 font-semibold">{badgeCounts.claimed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ready to Claim</span>
                  <span className="text-yellow-400 font-semibold">{badgeCounts.claimable}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Locked</span>
                  <span className="text-gray-400">{badgeCounts.locked}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="flex gap-2 sm:hidden">
              <button
                onClick={() => setActiveTab('badges')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  activeTab === 'badges' 
                    ? 'bg-akodemy-purple text-white' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                Badges
              </button>
              <button
                onClick={() => setActiveTab('competencies')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  activeTab === 'competencies' 
                    ? 'bg-akodemy-purple text-white' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                Competencies
              </button>
            </div>

            <div className={`space-y-3 sm:space-y-4 ${activeTab !== 'badges' ? 'hidden sm:block' : ''}`}>
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-akodemy-gold" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Badges & Achievements</h2>
              </div>

              {languages.map((lang) => {
                const langInfo = LANGUAGE_DISPLAY[lang]
                const badges = getBadgesForLanguage(lang)
                const summary = getLanguageBadgeSummary(lang)
                const isExpanded = expandedBadgeLang === lang

                return (
                  <div key={lang} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedBadgeLang(isExpanded ? null : lang)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-700/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
                          <img
                            src={getLanguageIcon(lang)}
                            alt={lang}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base sm:text-lg font-bold text-white">{langInfo.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {summary.claimed}/{summary.total} claimed
                            {summary.claimable > 0 && (
                              <span className="text-yellow-400 ml-2">({summary.claimable} ready)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    <div className={`${isExpanded ? 'block' : 'hidden'}`}>
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2 sm:space-y-3">
                        {badges.map((badge) => {
                          const diffChip = DIFFICULTY_CHIPS[badge.difficulty]
                          const isLocked = badge.status === 'locked'
                          const isClaimed = badge.status === 'claimed'
                          const isClaimable = badge.status === 'claimable'

                          return (
                            <div
                              key={badge.key}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border ${
                                badge.equipped
                                  ? 'bg-akodemy-gold/10 border-akodemy-gold/50'
                                  : isClaimed
                                    ? 'bg-green-500/5 border-green-500/30'
                                    : isClaimable
                                      ? 'bg-yellow-500/5 border-yellow-500/30'
                                      : 'bg-gray-700/30 border-gray-600/50'
                              } ${isLocked ? 'opacity-70' : ''}`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isLocked ? 'bg-gray-600' : langInfo.bgColor
                                }`}>
                                  {isLocked ? (
                                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                  ) : (
                                    <span className="text-sm sm:text-base">{langInfo.icon}</span>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-medium text-sm sm:text-base ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                                      {badge.badgeName}
                                    </span>
                                    {badge.equipped && (
                                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-akodemy-gold text-black font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        EQUIPPED
                                      </span>
                                    )}
                                  </div>
                                  
                                  {isLocked && badge.total > 0 && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <div className="flex-1 max-w-[120px] sm:max-w-[150px] bg-gray-600 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="h-full bg-akodemy-purple rounded-full"
                                          style={{ width: `${(badge.completed / badge.total) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] sm:text-xs text-gray-500">
                                        {badge.completed}/{badge.total}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap pl-11 sm:pl-0">
                                <span className={`inline-flex items-center text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full border ${diffChip.bgColor} ${diffChip.textColor} ${diffChip.borderColor}`}>
                                  {diffChip.label}
                                </span>

                                {isClaimed ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-2 py-0.5 sm:py-1 rounded-full">
                                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    Claimed
                                  </span>
                                ) : isClaimable ? (
                                  <span className="inline-flex items-center text-[10px] sm:text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 sm:py-1 rounded-full">
                                    Claimable
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 sm:py-1 rounded-full">
                                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    Locked
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={`space-y-3 sm:space-y-4 ${activeTab !== 'competencies' ? 'hidden sm:block' : ''}`}>
              <div className="flex items-center gap-2 mb-2 sm:mb-4 sm:hidden">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-akodemy-purple" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Competencies</h2>
              </div>

              {languages.map((lang) => {
                const langData = competencyData?.[lang] || []
                const isExpanded = expandedCompLang === lang
                
                return (
                  <div key={lang} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedCompLang(isExpanded ? null : lang)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-700/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
                          <img
                            src={getLanguageIcon(lang)}
                            alt={lang}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base sm:text-lg font-bold text-white uppercase">{lang}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {langData.length > 0 ? `${langData.length} competencies` : 'No activity yet'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    <div className={`${isExpanded ? 'block' : 'hidden'}`}>
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <h4 className="font-semibold mb-3 text-gray-300 text-sm">Competencies</h4>
                        
                        <div className="space-y-2 sm:space-y-3">
                          {langData.length > 0 ? langData.map((comp) => {
                            const mastery = getMasteryLevel(comp.percentage, comp.hasActivity)
                            return (
                              <div key={comp.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                <span className="text-xs sm:text-sm text-gray-300 sm:w-48 sm:flex-shrink-0">{comp.name}</span>
                                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                                  <div className="flex-1 bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
                                    {comp.percentage > 0 && (
                                      <div
                                        className={`h-full rounded-full ${mastery.color} transition-all duration-500`}
                                        style={{ width: `${comp.percentage}%` }}
                                      />
                                    )}
                                  </div>
                                  <span className="text-[10px] sm:text-xs text-gray-400 w-10 sm:w-12 text-right">
                                    {comp.completed}/{comp.total}
                                  </span>
                                </div>
                              </div>
                            )
                          }) : (
                            <p className="text-gray-500 text-xs sm:text-sm">No activity yet</p>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700 justify-center">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-600"></div>
                            <span className="text-[10px] sm:text-xs text-gray-500">Not Started</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                            <span className="text-[10px] sm:text-xs text-gray-400">Needs Practice</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-[10px] sm:text-xs text-gray-400">Developing</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                            <span className="text-[10px] sm:text-xs text-gray-400">Mastered</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
