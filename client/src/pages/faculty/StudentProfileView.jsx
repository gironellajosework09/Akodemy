import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronUp, User, Award, Trophy, Star, Lock, Download } from 'lucide-react'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
  const [downloading, setDownloading] = useState(false)
  const pdfRef = useRef(null)

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

  const downloadPDF = async () => {
    if (!pdfRef.current) return
    setDownloading(true)

    try {
      const canvas = await html2canvas(pdfRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const imgWidth = pdfWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pageHeight = pdfHeight - margin * 2

      if (imgHeight <= pageHeight) {
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
      } else {
        const pageHeightPx = Math.floor(canvas.width * pageHeight / imgWidth)
        let offsetY = 0
        let pageIndex = 0

        while (offsetY < canvas.height) {
          const pageCanvas = document.createElement('canvas')
          const pageHeightPxActual = Math.min(pageHeightPx, canvas.height - offsetY)
          pageCanvas.width = canvas.width
          pageCanvas.height = pageHeightPxActual

          const ctx = pageCanvas.getContext('2d')
          if (!ctx) break
          ctx.drawImage(
            canvas,
            0,
            offsetY,
            canvas.width,
            pageHeightPxActual,
            0,
            0,
            canvas.width,
            pageHeightPxActual
          )

          const pageImgData = pageCanvas.toDataURL('image/png')
          const pageImgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width

          if (pageIndex > 0) pdf.addPage()
          pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight)
          offsetY += pageHeightPx
          pageIndex++
        }
      }

      pdf.save(`${student?.name || 'Student'} - Akodemy Competency Report.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    )
  }

  const pdfProgress = competencyData ? {
    competencies: {
      javascript: competencyData.javascript || [],
      python: competencyData.python || [],
      java: competencyData.java || []
    },
    summary: competencyData.summary || {}
  } : null
  const pdfDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
  const badgeCounts = getBadgeCounts()
  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate('/faculty/students')}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Students
          </button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
          <div className="w-full space-y-4 lg:w-72 lg:space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 lg:p-6">
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

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 lg:p-6 mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-akodemy-gold" />
                <h3 className="font-semibold text-white">Badge Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-1 lg:gap-0 lg:space-y-3">
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

          <div className="flex-1 space-y-4 lg:space-y-8">
            <div className="flex justify-end">
              <button
                onClick={downloadPDF}
                disabled={downloading || !pdfProgress}
                className="flex w-full items-center justify-center gap-2 bg-akodemy-purple text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition text-sm sm:w-auto"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
            <div className="flex gap-2 lg:hidden">
              <button
                onClick={() => setActiveTab('badges')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                  activeTab === 'badges' 
                    ? 'bg-akodemy-purple text-white' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                Badges
              </button>
              <button
                onClick={() => setActiveTab('competencies')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                  activeTab === 'competencies' 
                    ? 'bg-akodemy-purple text-white' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                Competencies
              </button>
            </div>

            <div className={`space-y-4 ${activeTab !== 'badges' ? 'hidden lg:block' : ''}`}>
              <div className="flex items-center gap-2 mb-4 hidden lg:flex">
                <Award className="w-6 h-6 text-akodemy-gold" />
                <h2 className="text-xl font-bold text-white">Badges</h2>
              </div>

              {languages.map((lang) => {
                const langInfo = LANGUAGE_DISPLAY[lang]
                const badges = getBadgesForLanguage(lang)
                const summary = getLanguageBadgeSummary(lang)
                const isExpanded = expandedBadgeLang === lang

                return (
                  <div key={lang} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 lg:p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center">
                          <img
                            src={getLanguageIcon(lang)}
                            alt={lang}
                            className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg lg:text-xl font-bold text-white">{langInfo.name}</h3>
                          <p className="text-sm text-gray-500">
                            {summary.claimed}/{summary.total} claimed
                            {summary.claimable > 0 && (
                              <span className="text-yellow-400 ml-2">({summary.claimable} ready)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedBadgeLang(isExpanded ? null : lang)}
                        className="flex items-center gap-2 lg:hidden"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div className={`px-4 pb-4 lg:px-5 lg:pb-5 space-y-3 ${isExpanded ? '' : 'hidden lg:block'}`}>
                      {badges.map((badge) => {
                        const diffChip = DIFFICULTY_CHIPS[badge.difficulty]
                        const isLocked = badge.status === 'locked'
                        const isClaimed = badge.status === 'claimed'
                        const isClaimable = badge.status === 'claimable'

                        return (
                          <div
                            key={badge.key}
                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border ${
                              badge.equipped
                                ? 'bg-akodemy-gold/10 border-akodemy-gold/50'
                                : isClaimed
                                  ? 'bg-green-500/5 border-green-500/30'
                                  : isClaimable
                                    ? 'bg-yellow-500/5 border-yellow-500/30'
                                    : 'bg-gray-700/30 border-gray-600/50'
                            } ${isLocked ? 'opacity-70' : ''}`}
                          >
                            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 w-full">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isLocked ? 'bg-gray-600' : langInfo.bgColor
                              }`}>
                                {isLocked ? (
                                  <Lock className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <span className="text-base">{langInfo.icon}</span>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-medium ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                                    {badge.badgeName}
                                  </span>
                                  {badge.equipped && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-akodemy-gold text-black font-bold px-2 py-0.5 rounded-full">
                                      <Star className="w-3 h-3" />
                                      EQUIPPED
                                    </span>
                                  )}
                                </div>
                                
                                {isLocked && badge.total > 0 && (
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex-1 max-w-full sm:max-w-[150px] bg-gray-600 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="h-full bg-akodemy-purple rounded-full"
                                        style={{ width: `${(badge.completed / badge.total) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {badge.completed}/{badge.total}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                              <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${diffChip.bgColor} ${diffChip.textColor} ${diffChip.borderColor}`}>
                                {diffChip.label}
                              </span>

                              {isClaimed ? (
                                <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                  <Award className="w-3 h-3" />
                                  Claimed
                                </span>
                              ) : isClaimable ? (
                                <span className="inline-flex items-center text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                                  Claimable
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
                                  <Lock className="w-3 h-3" />
                                  Locked
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={`space-y-4 ${activeTab !== 'competencies' ? 'hidden lg:block' : ''}`}>
              <div className="flex items-center gap-2 mb-4 hidden lg:flex">
                <Award className="w-6 h-6 text-akodemy-purple" />
                <h2 className="text-xl font-bold text-white">Competencies</h2>
              </div>

              {languages.map((lang) => {
                const langInfo = LANGUAGE_DISPLAY[lang]
                const langData = competencyData?.[lang] || []
                const isExpanded = expandedCompLang === lang
                
                return (
                  <div key={lang} className="bg-gray-800 border border-gray-700 rounded-xl p-4 lg:p-6">
                    <div className="flex items-center justify-between lg:mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center">
                          <img
                            src={getLanguageIcon(lang)}
                            alt={lang}
                            className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg lg:text-xl font-bold text-white">{langInfo.name}</h3>
                          <p className="text-sm text-gray-500 lg:hidden">
                            {langData.length > 0 ? `${langData.length} competencies` : 'No activity yet'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedCompLang(isExpanded ? null : lang)}
                        className="flex items-center gap-2 lg:hidden"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    <div className={`${isExpanded ? 'mt-4' : 'hidden lg:block'}`}>
                      <h4 className="font-semibold mb-4 text-gray-300">Competencies</h4>
                      
                      <div className="space-y-3">
                        {langData.length > 0 ? langData.map((comp) => {
                          const mastery = getMasteryLevel(comp.percentage, comp.hasActivity)
                          return (
                            <div key={comp.name} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <span className="text-sm text-gray-300 sm:w-48 sm:flex-shrink-0">{comp.name}</span>
                              <div className="w-full sm:flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                                {comp.percentage > 0 && (
                                  <div
                                    className={`h-4 rounded-full ${mastery.color} transition-all duration-500`}
                                    style={{ width: `${comp.percentage}%` }}
                                  />
                                )}
                              </div>
                              <span className="text-xs text-gray-400 sm:w-12 sm:text-right self-end sm:self-auto">
                                {comp.completed}/{comp.total}
                              </span>
                            </div>
                          )
                        }) : (
                          <p className="text-gray-500 text-sm">No activity yet</p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-gray-700 justify-center">
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
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div
          ref={pdfRef}
          className="fixed left-[-9999px] top-0 w-[794px] bg-white text-gray-900 p-10"
        >
          <div className="flex items-start justify-between border-b border-gray-200 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Akodemy</p>
              <h1 className="text-2xl font-bold text-gray-900">Competency Report</h1>
              <p className="text-xs text-gray-500">Generated {pdfDate}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{student?.name || 'Student'}</p>
              <p className="text-xs text-gray-500">{student?.email || ''}</p>
              <p className="text-xs text-gray-500">Student ID: {student?.student_id || 'N/A'}</p>
              <p className="text-xs text-gray-500">Badge: {profileData?.equippedTitle?.displayName || 'None'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {languages.map((lang) => {
              const summary = pdfProgress?.summary?.[lang] || { completed: 0, total: 0 }
              return (
                <div key={`${lang}-summary`} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-gray-700">{lang}</span>
                    <span className="text-xs text-gray-500">{summary.completed}/{summary.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-akodemy-purple"
                      style={{ width: summary.total > 0 ? `${Math.round((summary.completed / summary.total) * 100)}%` : '0%' }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">Completed challenges</p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-6">
            {pdfProgress ? (
              languages.map((lang) => {
                const langProgress = pdfProgress?.competencies?.[lang] || []
                const summary = pdfProgress?.summary?.[lang] || { completed: 0, total: 0 }

                return (
                  <div key={`${lang}-details`} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6">
                          <img
                            src={getLanguageIcon(lang)}
                            alt={lang}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h2 className="text-sm font-semibold uppercase text-gray-800">{lang}</h2>
                      </div>
                      <span className="text-xs text-gray-500">{summary.completed} / {summary.total} completed</span>
                    </div>

                    {langProgress.length === 0 ? (
                      <p className="text-xs text-gray-500">No activity yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {langProgress.map((comp) => {
                          const mastery = getMasteryLevel(comp.percentage, comp.hasActivity)

                          return (
                            <div key={`${lang}-${comp.index}`} className="flex items-center gap-3">
                              <span className="text-xs text-gray-700 w-44">{comp.name}</span>
                              <div className="flex-1">
                                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                  {comp.percentage > 0 && (
                                    <div
                                      className={`h-full ${mastery.color}`}
                                      style={{ width: `${comp.percentage}%` }}
                                    ></div>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-500 w-14 text-right">
                                {comp.completed}/{comp.total}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-500">Loading achievement data...</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
