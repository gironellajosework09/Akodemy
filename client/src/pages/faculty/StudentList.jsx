// Faculty page: Student List.
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, Trophy, Award, Eye, Download } from 'lucide-react'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function StudentList() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [yearSectionFilter, setYearSectionFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const pdfRef = useRef(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, yearSectionFilter])

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/faculty/students')
      setStudents(response.data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const yearSectionOptions = [...new Set(
    students
      .map(student => (student.yearSection || '').trim())
      .filter(Boolean)
      .map(value => value.toUpperCase())
  )].sort()

  const filteredStudents = students.filter(student => {
    const query = search.toLowerCase()
    const matchesSearch = student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    const matchesYearSection = yearSectionFilter
      ? (student.yearSection || '').toUpperCase() === yearSectionFilter
      : true
    return matchesSearch && matchesYearSection
  })

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageStartIndex = (safePage - 1) * pageSize
  const pageEndIndex = pageStartIndex + pageSize
  const pagedStudents = filteredStudents.slice(pageStartIndex, pageEndIndex)

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage)
    }
  }, [currentPage, safePage])

  const pageNumbers = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages = [1]
    if (safePage > 3) pages.push('ellipsis-start')
    const start = Math.max(2, safePage - 1)
    const end = Math.min(totalPages - 1, safePage + 1)
    for (let i = start; i <= end; i += 1) {
      pages.push(i)
    }
    if (safePage < totalPages - 2) pages.push('ellipsis-end')
    pages.push(totalPages)
    return pages
  })()

  const getProgressColor = (value) => {
    if (value >= 80) return 'text-green-400'
    if (value >= 50) return 'text-yellow-400'
    if (value > 0) return 'text-orange-400'
    return 'text-gray-500'
  }

  const getProgressBadgeColor = (value) => {
    if (value >= 80) return 'bg-green-100 text-green-700'
    if (value >= 50) return 'bg-yellow-100 text-yellow-700'
    if (value > 0) return 'bg-orange-100 text-orange-700'
    return 'bg-gray-100 text-gray-600'
  }

  const getAverageProgress = (student) => {
    const js = Number(student.progress?.javascript || 0)
    const py = Number(student.progress?.python || 0)
    const java = Number(student.progress?.java || 0)
    return Math.round((js + py + java) / 3)
  }

  const downloadPDF = async () => {
    if (!pdfRef.current) return
    setDownloading(true)

    try {
      const pages = Array.from(pdfRef.current.querySelectorAll('[data-pdf-page]'))
      if (pages.length === 0) return

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const imgWidth = pdfWidth - margin * 2
      const maxHeight = pdfHeight - margin * 2

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true
        })

        const imgHeight = (canvas.height * imgWidth) / canvas.width
        const imgData = canvas.toDataURL('image/png')
        const finalHeight = Math.min(imgHeight, maxHeight)

        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, finalHeight)
      }

      pdf.save('student-analytics-summary.pdf')
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

  const languages = ['javascript', 'python', 'java']
  const pdfDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })
  const totalStudents = students.length
  const averageProgress = totalStudents
    ? Math.round(students.reduce((sum, student) => sum + getAverageProgress(student), 0) / totalStudents)
    : 0
  const averageBadges = totalStudents
    ? (students.reduce((sum, student) => sum + (student.badgeCount || 0), 0) / totalStudents).toFixed(1)
    : '0.0'
  const languageStats = languages.map((lang) => {
    const values = students.map(student => Number(student.progress?.[lang] || 0))
    const avg = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0
    const mastered = values.filter(value => value >= 80).length
    const developing = values.filter(value => value >= 50 && value < 80).length
    const needsPractice = values.filter(value => value > 0 && value < 50).length
    const notStarted = values.filter(value => value === 0).length

    return { lang, avg, mastered, developing, needsPractice, notStarted }
  })
  const topPerformers = [...students]
    .sort((a, b) => getAverageProgress(b) - getAverageProgress(a))
    .slice(0, 3)
  const rowsPerPage = 20
  const studentChunks = []
  for (let i = 0; i < students.length; i += rowsPerPage) {
    studentChunks.push(students.slice(i, i + rowsPerPage))
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Student List</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-2xl">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
            <select
              value={yearSectionFilter}
              onChange={(e) => setYearSectionFilter(e.target.value)}
              className="w-full sm:w-44 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
            >
              <option value="">Year & Section</option>
              {yearSectionOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <button
            onClick={downloadPDF}
            disabled={downloading || students.length === 0}
            className="flex items-center justify-center gap-2 bg-akodemy-purple text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition text-sm"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>

        <div className="hidden lg:block bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-300">Student</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-300">Title</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-300">JS</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-300">Python</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-300">Java</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-300">Badges</th>
                <th className="text-center px-4 py-4 font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                pagedStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="border-t border-gray-700 hover:bg-gray-700/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{student.name}</p>
                          <p className="text-gray-500 text-sm truncate">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.equippedTitle ? (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-akodemy-gold flex-shrink-0" />
                          <span className="text-akodemy-gold text-sm font-medium truncate">
                            {student.equippedTitle.badgeName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${getProgressColor(student.progress?.javascript || 0)}`}>
                        {student.progress?.javascript || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${getProgressColor(student.progress?.python || 0)}`}>
                        {student.progress?.python || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${getProgressColor(student.progress?.java || 0)}`}>
                        {student.progress?.java || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="w-4 h-4 text-akodemy-purple" />
                        <span className="text-white">{student.badgeCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => navigate(`/faculty/student/${student._id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-akodemy-purple/20 text-white rounded-lg hover:bg-akodemy-purple/30 transition text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="hidden sm:block lg:hidden bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-300">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-300">Title</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-300">Progress</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                pagedStudents.map((student) => {
                  const avgProgress = Math.round(
                    ((student.progress?.javascript || 0) + 
                     (student.progress?.python || 0) + 
                     (student.progress?.java || 0)) / 3
                  )
                  return (
                    <tr
                      key={student._id}
                      className="border-t border-gray-700 hover:bg-gray-700/50 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate text-sm">{student.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {student.equippedTitle ? (
                          <div className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-akodemy-gold flex-shrink-0" />
                            <span className="text-akodemy-gold text-xs truncate max-w-[100px]">
                              {student.equippedTitle.badgeName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-medium ${getProgressColor(avgProgress)}`}>
                          {avgProgress}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => navigate(`/faculty/student/${student._id}`)}
                          className="p-2 bg-akodemy-purple/20 text-white rounded-lg hover:bg-akodemy-purple/30 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden space-y-2.5">
          {filteredStudents.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center text-gray-500">
              No students found
            </div>
          ) : (
            pagedStudents.map((student) => (
              <button
                key={student._id}
                type="button"
                onClick={() => navigate(`/faculty/student/${student._id}`)}
                className="w-full text-left bg-gray-800 border border-gray-700 rounded-xl p-3 hover:bg-gray-700/40 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm">{student.name}</p>
                      <p className="text-gray-500 text-xs truncate">{student.email}</p>
                    </div>
                  </div>
                  {student.badgeCount > 0 && (
                    <div className="flex items-center gap-1 bg-akodemy-purple/20 px-2 py-0.5 rounded-full">
                      <Award className="w-3 h-3 text-akodemy-purple" />
                      <span className="text-akodemy-purple text-xs">{student.badgeCount}</span>
                    </div>
                  )}
                </div>

                {student.equippedTitle && (
                  <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-akodemy-gold/10 rounded-lg">
                    <Trophy className="w-3.5 h-3.5 text-akodemy-gold" />
                    <span className="text-akodemy-gold text-xs font-medium">
                      {student.equippedTitle.badgeName}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-900 rounded-lg p-1.5 text-center">
                    <p className="text-gray-500 text-[11px] mb-0.5">JS</p>
                    <p className={`text-sm font-semibold ${getProgressColor(student.progress?.javascript || 0)}`}>
                      {student.progress?.javascript || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-1.5 text-center">
                    <p className="text-gray-500 text-[11px] mb-0.5">Python</p>
                    <p className={`text-sm font-semibold ${getProgressColor(student.progress?.python || 0)}`}>
                      {student.progress?.python || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-1.5 text-center">
                    <p className="text-gray-500 text-[11px] mb-0.5">Java</p>
                    <p className={`text-sm font-semibold ${getProgressColor(student.progress?.java || 0)}`}>
                      {student.progress?.java || 0}%
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {filteredStudents.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-500 text-sm text-center sm:text-left">
              Showing {pageStartIndex + 1}-{Math.min(pageEndIndex, filteredStudents.length)} of {filteredStudents.length} students
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <div className="flex items-center gap-1">
                {pageNumbers.map((page) => {
                  if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                    return (
                      <span key={page} className="px-2 text-gray-500 text-sm">…</span>
                    )
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        page === safePage
                          ? 'bg-akodemy-purple text-white border-akodemy-purple'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div
          ref={pdfRef}
          className="fixed left-[-9999px] top-0 w-[794px] bg-white text-gray-900 p-10"
        >
          <div data-pdf-page>
            <div className="flex items-start justify-between border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Akodemy</p>
                <h1 className="text-2xl font-bold text-gray-900">Student Analytics Summary</h1>
                <p className="text-xs text-gray-500">Generated {pdfDate}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Students</p>
                <p className="text-lg font-semibold text-gray-900">{totalStudents}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Average Progress</p>
                <p className="text-lg font-semibold text-gray-900">{averageProgress}%</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Average Badges</p>
                <p className="text-lg font-semibold text-gray-900">{averageBadges}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Top Performer</p>
                <p className="text-sm font-semibold text-gray-900">{topPerformers[0]?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">{topPerformers[0] ? `${getAverageProgress(topPerformers[0])}% avg` : ''}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">Language Performance</h2>
              <div className="grid grid-cols-3 gap-4">
                {languageStats.map((stat) => (
                  <div key={stat.lang} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase text-gray-700">{stat.lang}</span>
                      <span className="text-xs text-gray-500">{stat.avg}% avg</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-akodemy-purple"
                        style={{ width: `${stat.avg}%` }}
                      ></div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                      <span>Mastered: {stat.mastered}</span>
                      <span>Developing: {stat.developing}</span>
                      <span>Needs practice: {stat.needsPractice}</span>
                      <span>Not started: {stat.notStarted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3">Top Performers</h2>
              <div className="grid grid-cols-3 gap-3">
                {topPerformers.map((student, index) => (
                  <div key={`${student._id}-top`} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase text-gray-400">Rank {index + 1}</span>
                      <span className="text-[10px] text-gray-500">{getAverageProgress(student)}% avg</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900">{student.name}</p>
                    <p className="text-[10px] text-gray-500">{student.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {studentChunks.length === 0 ? (
            <div data-pdf-page className="mt-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3">Student Breakdown</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-600">Student</th>
                      <th className="text-center px-2 py-2 text-gray-600">JS</th>
                      <th className="text-center px-2 py-2 text-gray-600">Python</th>
                      <th className="text-center px-2 py-2 text-gray-600">Java</th>
                      <th className="text-center px-2 py-2 text-gray-600">Avg</th>
                      <th className="text-center px-2 py-2 text-gray-600">Badges</th>
                      <th className="text-left px-3 py-2 text-gray-600">Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            studentChunks.map((chunk, chunkIndex) => (
              <div key={`chunk-${chunkIndex}`} data-pdf-page className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase">Student Breakdown</h2>
                  <span className="text-xs text-gray-400">Page {chunkIndex + 1} of {studentChunks.length}</span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-600">Student</th>
                        <th className="text-center px-2 py-2 text-gray-600">JS</th>
                        <th className="text-center px-2 py-2 text-gray-600">Python</th>
                        <th className="text-center px-2 py-2 text-gray-600">Java</th>
                        <th className="text-center px-2 py-2 text-gray-600">Avg</th>
                        <th className="text-center px-2 py-2 text-gray-600">Badges</th>
                        <th className="text-left px-3 py-2 text-gray-600">Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((student, index) => {
                        const js = Number(student.progress?.javascript || 0)
                        const py = Number(student.progress?.python || 0)
                        const java = Number(student.progress?.java || 0)
                        const avg = getAverageProgress(student)
                        return (
                          <tr key={`${student._id}-pdf-${chunkIndex}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 text-gray-800">
                              <div className="font-semibold">{student.name}</div>
                              <div className="text-[10px] text-gray-500">{student.email}</div>
                            </td>
                            <td className="text-center px-2 py-2 text-gray-700">{js}%</td>
                            <td className="text-center px-2 py-2 text-gray-700">{py}%</td>
                            <td className="text-center px-2 py-2 text-gray-700">{java}%</td>
                            <td className="text-center px-2 py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${getProgressBadgeColor(avg)}`}>
                                {avg}%
                              </span>
                            </td>
                            <td className="text-center px-2 py-2 text-gray-700">{student.badgeCount || 0}</td>
                            <td className="px-3 py-2 text-gray-700">{student.equippedTitle?.badgeName || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
