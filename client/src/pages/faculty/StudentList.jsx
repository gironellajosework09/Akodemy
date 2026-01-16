// Faculty page: Student List.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User } from 'lucide-react'
import Layout from '../../components/Layout'
import api from '../../services/api'

// Faculty page logic for Student List.
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
    student.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="container mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Student List</h1>

        <div className="relative mb-6 max-w-md">
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg pr-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-300">Student</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-300">JavaScript</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-300">Python</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-300">Java</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      onClick={() => navigate(`/faculty/student/${student._id}`)}
                      className="cursor-pointer hover:bg-gray-700/50 border-t border-gray-700 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                          <span className="text-white">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${(student.progress?.javascript || 0) >= 50 ? 'text-green-400' : 'text-gray-400'}`}>
                          {student.progress?.javascript || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${(student.progress?.python || 0) >= 50 ? 'text-green-400' : 'text-gray-400'}`}>
                          {student.progress?.python || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${(student.progress?.java || 0) >= 50 ? 'text-green-400' : 'text-gray-400'}`}>
                          {student.progress?.java || 0}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}



