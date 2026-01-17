// Faculty page: Student List.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, Trophy, Award, Eye } from 'lucide-react'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

export default function StudentList() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase())
  )

  const getProgressColor = (value) => {
    if (value >= 80) return 'text-green-400'
    if (value >= 50) return 'text-yellow-400'
    if (value > 0) return 'text-orange-400'
    return 'text-gray-500'
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Student List</h1>

        <div className="relative mb-4 sm:mb-6 w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
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
                filteredStudents.map((student) => (
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-akodemy-purple/20 text-akodemy-purple rounded-lg hover:bg-akodemy-purple/30 transition text-sm"
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
                filteredStudents.map((student) => {
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
                          className="p-2 bg-akodemy-purple/20 text-akodemy-purple rounded-lg hover:bg-akodemy-purple/30 transition"
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

        <div className="sm:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center text-gray-500">
              No students found
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student._id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold">{student.name}</p>
                      <p className="text-gray-500 text-sm truncate">{student.email}</p>
                    </div>
                  </div>
                  {student.badgeCount > 0 && (
                    <div className="flex items-center gap-1 bg-akodemy-purple/20 px-2 py-1 rounded-full">
                      <Award className="w-3 h-3 text-akodemy-purple" />
                      <span className="text-akodemy-purple text-xs">{student.badgeCount}</span>
                    </div>
                  )}
                </div>

                {student.equippedTitle && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-akodemy-gold/10 rounded-lg">
                    <Trophy className="w-4 h-4 text-akodemy-gold" />
                    <span className="text-akodemy-gold text-sm font-medium">
                      {student.equippedTitle.badgeName}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-900 rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-xs mb-1">JS</p>
                    <p className={`font-semibold ${getProgressColor(student.progress?.javascript || 0)}`}>
                      {student.progress?.javascript || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-xs mb-1">Python</p>
                    <p className={`font-semibold ${getProgressColor(student.progress?.python || 0)}`}>
                      {student.progress?.python || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-2 text-center">
                    <p className="text-gray-500 text-xs mb-1">Java</p>
                    <p className={`font-semibold ${getProgressColor(student.progress?.java || 0)}`}>
                      {student.progress?.java || 0}%
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/faculty/student/${student._id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-akodemy-purple text-white rounded-lg hover:bg-akodemy-purple/80 transition"
                >
                  <Eye className="w-4 h-4" />
                  View Profile
                </button>
              </div>
            ))
          )}
        </div>

        {filteredStudents.length > 0 && (
          <p className="text-gray-500 text-sm mt-4 text-center sm:text-left">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        )}
      </div>
    </Layout>
  )
}
