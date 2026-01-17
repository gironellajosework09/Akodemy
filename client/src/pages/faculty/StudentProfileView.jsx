// Faculty page: Student Profile View.
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, User, Award, Trophy, Star, Lock } from 'lucide-react'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

const BADGE_ICONS = {
  java: { icon: '☕', color: 'bg-orange-500' },
  python: { icon: '🐍', color: 'bg-blue-500' },
  javascript: { icon: 'JS', color: 'bg-yellow-500' }
}

const DIFFICULTY_LABELS = {
  beginner: { label: 'Beginner', color: 'text-green-400' },
  intermediate: { label: 'Intermediate', color: 'text-yellow-400' },
  advanced: { label: 'Advanced', color: 'text-red-400' }
}

export default function StudentProfileView() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const [student, setStudent] = useState(null)
  const [competencyData, setCompetencyData] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [languageFilter, setLanguageFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getAllBadges = () => {
    if (!profileData?.badgeProgress) return []
    
    const allBadges = []
    for (const language of languages) {
      for (const difficulty of difficulties) {
        const progress = profileData.badgeProgress[language]?.[difficulty]
        if (progress) {
          allBadges.push({
            key: `${language}-${difficulty}`,
            language,
            difficulty,
            badgeName: progress.badgeName,
            status: progress.status,
            equipped: progress.equipped,
            completed: progress.completed,
            total: progress.total,
            unlockedAt: progress.unlockedAt,
            claimedAt: progress.claimedAt
          })
        }
      }
    }
    return allBadges
  }

  const getFilteredBadges = () => {
    const allBadges = getAllBadges()
    
    return allBadges.filter(badge => {
      if (languageFilter !== 'all' && badge.language !== languageFilter) return false
      if (difficultyFilter !== 'all' && badge.difficulty !== difficultyFilter) return false
      if (statusFilter !== 'all' && badge.status !== statusFilter) return false
      return true
    })
  }

  const getBadgeCounts = () => {
    const allBadges = getAllBadges()
    return {
      total: allBadges.length,
      claimed: allBadges.filter(b => b.status === 'claimed').length,
      claimable: allBadges.filter(b => b.status === 'claimable').length,
      locked: allBadges.filter(b => b.status === 'locked').length
    }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    )
  }

  const filteredBadges = getFilteredBadges()
  const badgeCounts = getBadgeCounts()

  return (
    <Layout>
      <div className="container mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/faculty/students')}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Students
        </button>

        <div className="flex gap-8">
          <div className="w-72 space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Student Profile</h2>
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-lg text-white">{student?.name || 'Student Name'}</h3>
                <p className="text-gray-500 text-sm">{student?.email}</p>
                
                {profileData?.equippedTitle ? (
                  <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-akodemy-purple/30 to-akodemy-gold/30 rounded-full border border-akodemy-gold/50">
                    <Trophy className="w-4 h-4 text-akodemy-gold" />
                    <span className="text-sm font-medium text-akodemy-gold">
                      {profileData.equippedTitle.displayName}
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 text-gray-500 text-sm italic">No title equipped</p>
                )}
              </div>
              <div className="space-y-3 text-sm">
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

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-akodemy-gold" />
                <h3 className="font-semibold text-white">Badge Summary</h3>
              </div>
              <div className="space-y-3 text-sm">
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

          <div className="flex-1 space-y-8">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-akodemy-gold" />
                  <h2 className="text-xl font-bold text-white">Badges & Achievements</h2>
                </div>
                
                <div className="flex gap-3">
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-akodemy-purple"
                  >
                    <option value="all">All Languages</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                  
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-akodemy-purple"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-akodemy-purple"
                  >
                    <option value="all">All Status</option>
                    <option value="claimed">Claimed</option>
                    <option value="claimable">Ready to Claim</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBadges.map((badge) => {
                  const langInfo = BADGE_ICONS[badge.language] || { icon: '?', color: 'bg-gray-500' }
                  const diffInfo = DIFFICULTY_LABELS[badge.difficulty] || { label: '', color: 'text-gray-400' }
                  const isLocked = badge.status === 'locked'
                  const isClaimed = badge.status === 'claimed'
                  const isClaimable = badge.status === 'claimable'
                  
                  return (
                    <div
                      key={badge.key}
                      className={`relative bg-gray-700/50 border rounded-xl p-4 ${
                        badge.equipped 
                          ? 'border-akodemy-gold shadow-lg shadow-akodemy-gold/20' 
                          : isClaimed 
                            ? 'border-green-500/50' 
                            : isClaimable 
                              ? 'border-yellow-500/50'
                              : 'border-gray-600/50'
                      } ${isLocked ? 'opacity-60' : ''}`}
                    >
                      {badge.equipped && (
                        <div className="absolute -top-2 -right-2 bg-akodemy-gold text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          EQUIPPED
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 ${isLocked ? 'bg-gray-600' : langInfo.color} rounded-lg flex items-center justify-center text-xl font-bold text-white`}>
                          {isLocked ? <Lock className="w-6 h-6 text-gray-400" /> : langInfo.icon}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className={`font-semibold ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                            {badge.badgeName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 capitalize">{badge.language}</span>
                            <span className="text-gray-600">•</span>
                            <span className={`text-xs ${isLocked ? 'text-gray-500' : diffInfo.color}`}>{diffInfo.label}</span>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-2">
                            {isClaimed ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                <Award className="w-3 h-3" />
                                Claimed
                              </span>
                            ) : isClaimable ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                Ready to Claim
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" />
                                Locked
                              </span>
                            )}
                          </div>
                          
                          {isLocked && badge.total > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-600 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-1.5 bg-akodemy-purple rounded-full"
                                    style={{ width: `${(badge.completed / badge.total) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{badge.completed}/{badge.total}</span>
                              </div>
                            </div>
                          )}
                          
                          {badge.claimedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Claimed: {formatDate(badge.claimedAt)}
                            </p>
                          )}
                          {!badge.claimedAt && badge.unlockedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Unlocked: {formatDate(badge.unlockedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredBadges.length === 0 && (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No badges match the selected filters</p>
                </div>
              )}
            </div>

            {languages.map((lang) => {
              const langData = competencyData?.[lang] || []
              const summary = competencyData?.summary?.[lang] || { completed: 0, total: 0 }
              
              return (
                <div key={lang} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                      <img
                        src={getLanguageIcon(lang)}
                        alt={lang}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white uppercase">{lang}</h3>
                  </div>
                  
                  <h4 className="font-semibold mb-4 text-gray-300">Competencies</h4>
                  
                  <div className="space-y-3">
                    {langData.length > 0 ? langData.map((comp) => {
                      const mastery = getMasteryLevel(comp.percentage, comp.hasActivity)
                      return (
                        <div key={comp.name} className="flex items-center gap-4">
                          <span className="w-48 text-sm text-gray-300 flex-shrink-0">{comp.name}</span>
                          <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                            {comp.percentage > 0 && (
                              <div
                                className={`h-4 rounded-full ${mastery.color} transition-all duration-500`}
                                style={{ width: `${comp.percentage}%` }}
                              ></div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">
                            {comp.completed}/{comp.total}
                          </span>
                        </div>
                      )
                    }) : (
                      <p className="text-gray-500 text-sm">No activity yet</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700 justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                      <span className="text-xs text-gray-500">Not Started</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-400">Needs Practice</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-gray-400">Developing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-400">Mastered</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
