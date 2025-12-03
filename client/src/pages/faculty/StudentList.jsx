import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Search } from 'lucide-react'
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
    student.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-akodemy-purple text-white py-4 px-6 flex justify-between items-center">
        <div className="text-lg font-medium">Welcome to Akodemy</div>
        <button className="flex items-center gap-2 bg-white text-akodemy-purple px-4 py-2 rounded-full">
          My Profile
        </button>
      </header>

      <div className="container mx-auto px-8 py-8">
        <button
          onClick={() => navigate('/faculty')}
          className="flex items-center gap-1 text-gray-600 hover:text-akodemy-purple mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h1 className="text-3xl font-bold text-akodemy-purple mb-6">Student List</h1>

        <div className="relative mb-6 max-w-md">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden shadow">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Students</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">JavaScript</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Python</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr
                      key={student._id}
                      onClick={() => navigate(`/faculty/student/${student._id}`)}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        index === 0 ? 'bg-teal-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">{student.name}</td>
                      <td className="px-6 py-4">{student.progress?.javascript || 0}%</td>
                      <td className="px-6 py-4">{student.progress?.python || 0}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <footer className="bg-akodemy-purple text-white py-4 text-center mt-auto">
        <p>&copy; Copyright 2025. All Rights Reserved.</p>
      </footer>
    </div>
  )
}
