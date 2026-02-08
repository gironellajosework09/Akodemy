import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Download, Upload, ChevronLeft, ChevronRight, Users, User, GraduationCap, X, AlertCircle, CheckCircle, UserX, UserCheck, Pencil } from 'lucide-react'
import Layout from '../../components/Layout'
import { InlineSpinner } from '../../components/LoadingSpinner'
import api from '../../services/api'

const ROLES = ['all', 'student', 'faculty']

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [statusModal, setStatusModal] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({ uid: '', fullName: '', email: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/users', {
        params: { page: pagination.page, limit: pagination.limit, search, role: roleFilter }
      })
      setUsers(res.data.users)
      setPagination(prev => ({ ...prev, ...res.data.pagination }))
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleRoleFilter = (role) => {
    setRoleFilter(role)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/api/admin/users/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'akodemy_users_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to download template:', error)
    }
  }

  const handleUserCreated = () => {
    setShowAddModal(false)
    fetchUsers()
  }

  const handleBulkUpload = (result) => {
    setBulkResult(result)
    setShowBulkModal(false)
    fetchUsers()
  }

  const handleStatusChange = async () => {
    if (!statusModal) return
    setStatusLoading(true)
    try {
      await api.patch(`/api/admin/users/${statusModal._id}/status`, {
        isActive: !statusModal.isActive
      })
      fetchUsers()
      setStatusModal(null)
    } catch (error) {
      console.error('Failed to update user status:', error)
    } finally {
      setStatusLoading(false)
    }
  }

  const openEditModal = (user) => {
    setEditError('')
    setEditForm({
      uid: user.uid || '',
      fullName: user.fullName || '',
      email: user.email || ''
    })
    setEditModal(user)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
    setEditError('')
  }

  const validateEdit = () => {
    if (!editForm.uid.trim()) return 'UID is required'
    if (!editForm.fullName.trim()) return 'Full name is required'
    if (!editForm.email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) return 'Invalid email format'
    return null
  }

  const handleEditSave = async () => {
    if (!editModal) return
    const validationError = validateEdit()
    if (validationError) {
      setEditError(validationError)
      return
    }
    setEditLoading(true)
    setEditError('')
    try {
      await api.patch(`/api/admin/users/${editModal._id}`, {
        uid: editForm.uid.trim(),
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim()
      })
      setEditModal(null)
      fetchUsers()
    } catch (error) {
      setEditError(error.response?.data?.message || 'Failed to update user')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-akodemy-purple" />
                User Management
              </h1>
              <p className="text-gray-400 mt-1">Manage student and faculty accounts</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download Template</span>
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk Upload</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-akodemy-purple hover:bg-akodemy-purple/80 text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>

          {bulkResult && (
            <div className={`p-4 rounded-lg border ${bulkResult.skipped > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {bulkResult.skipped > 0 ? (
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-white">{bulkResult.message}</p>
                    {bulkResult.skipped > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-yellow-400 mb-2">Skipped {bulkResult.skipped} row(s) with errors:</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {bulkResult.errors.map((error, i) => (
                            <div key={i} className="text-sm text-gray-300">
                              Row {error.row}: {error.errors.map(e => `${e.column} - ${e.reason}`).join('; ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setBulkResult(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by UID, name, or email..."
                  value={search}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
                />
              </div>
              <div className="flex gap-2">
                {ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleFilter(role)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                      roleFilter === role
                        ? 'bg-akodemy-purple text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700/50 text-left">
                    <th className="px-4 py-3 text-sm font-semibold text-gray-300">UID</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-300">Full Name</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-300">Email</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-300">Role</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-300">Year & Section</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-4 py-3 text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <InlineSpinner />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user._id} className={`hover:bg-gray-700/30 transition ${!user.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 text-sm text-white font-mono">{user.uid}</td>
                        <td className="px-4 py-3 text-sm text-white">{user.fullName}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === 'student' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {user.role === 'student' ? <GraduationCap className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{user.yearLevelAndSection}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {user.isActive ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition bg-gray-600/60 text-gray-200 hover:bg-gray-600"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => setStatusModal(user)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                user.isActive
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              }`}
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="w-3 h-3" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  Activate
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                Showing {users.length} of {pagination.total} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-300 px-3">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onSuccess={handleUserCreated} />
      )}

      {showBulkModal && (
        <BulkUploadModal onClose={() => setShowBulkModal(false)} onSuccess={handleBulkUpload} />
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {statusModal.isActive ? 'Deactivate User' : 'Activate User'}
              </h2>
              <button onClick={() => setStatusModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-full ${statusModal.isActive ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                  {statusModal.isActive ? (
                    <UserX className="w-8 h-8 text-red-400" />
                  ) : (
                    <UserCheck className="w-8 h-8 text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{statusModal.fullName}</p>
                  <p className="text-sm text-gray-400">{statusModal.uid}</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                {statusModal.isActive
                  ? 'Are you sure you want to deactivate this user? They will no longer be able to log in until reactivated.'
                  : 'Are you sure you want to activate this user? They will be able to log in again.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStatusModal(null)}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={statusLoading}
                  className={`flex-1 py-2.5 rounded-lg transition disabled:opacity-50 ${
                    statusModal.isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {statusLoading ? (
                    <InlineSpinner />
                  ) : statusModal.isActive ? (
                    'Deactivate'
                  ) : (
                    'Activate'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">UID</label>
                <input
                  type="text"
                  name="uid"
                  value={editForm.uid}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditModal(null)}
                  className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editLoading}
                  className="flex-1 py-2.5 bg-akodemy-purple hover:bg-akodemy-purple/80 text-white rounded-lg transition disabled:opacity-50"
                >
                  {editLoading ? <InlineSpinner /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function AddUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    uid: '',
    lastName: '',
    givenName: '',
    middleName: '',
    email: '',
    role: 'student',
    yearLevelAndSection: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'yearLevelAndSection') {
      const normalized = value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 2)
      setFormData(prev => ({ ...prev, [name]: normalized }))
      setError('')
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.uid.trim()) return 'UID is required'
    if (!formData.lastName.trim()) return 'Last Name is required'
    if (!formData.givenName.trim()) return 'Given Name is required'
    if (!formData.email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format'
    if (formData.role === 'student' && !/^[1-9][A-Z]$/.test(formData.yearLevelAndSection.trim())) {
      return 'Year Level & Section must be in Number and Capital Letter (e.g. 4A)'
    }
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/api/admin/users', formData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user')
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Add New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showConfirm ? (
          <div className="p-6">
            <p className="text-white mb-4">Are you sure you want to create this user?</p>
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6 space-y-2">
              <p className="text-sm"><span className="text-gray-400">UID:</span> <span className="text-white">{formData.uid}</span></p>
              <p className="text-sm"><span className="text-gray-400">Name:</span> <span className="text-white">{formData.lastName}, {formData.givenName} {formData.middleName}</span></p>
              <p className="text-sm"><span className="text-gray-400">Email:</span> <span className="text-white">{formData.email}</span></p>
              <p className="text-sm"><span className="text-gray-400">Role:</span> <span className="text-white capitalize">{formData.role}</span></p>
              {formData.role === 'student' && (
                <p className="text-sm"><span className="text-gray-400">Year & Section:</span> <span className="text-white">{formData.yearLevelAndSection}</span></p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 bg-akodemy-purple hover:bg-akodemy-purple/80 text-white rounded-lg transition disabled:opacity-50"
              >
                {loading ? <InlineSpinner /> : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">UID *</label>
              <input
                type="text"
                name="uid"
                value={formData.uid}
                onChange={handleChange}
                placeholder="e.g., 2024-00001 or FAC-001"
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Given Name *</label>
                <input
                  type="text"
                  name="givenName"
                  value={formData.givenName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Year Level & Section *</label>
                <input
                  type="text"
                  name="yearLevelAndSection"
                  value={formData.yearLevelAndSection}
                  onChange={handleChange}
                  placeholder="e.g., 4A"
                  maxLength={2}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-akodemy-purple"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-akodemy-purple hover:bg-akodemy-purple/80 text-white rounded-lg transition"
              >
                Create User
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function BulkUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Please upload an Excel file (.xlsx or .xls)')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1]
        try {
          const res = await api.post('/api/admin/users/bulk', { fileData: base64 })
          onSuccess(res.data)
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to upload file')
          setLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Failed to read file')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Bulk Upload Users</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300 mb-2">
              {file ? file.name : 'Drop your Excel file here or click to browse'}
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="bulkUploadInput"
            />
            <label
              htmlFor="bulkUploadInput"
              className="inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition"
            >
              Select File
            </label>
          </div>

          <p className="text-sm text-gray-400">
            Download the Excel template first to ensure correct column format.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 py-2.5 bg-akodemy-purple hover:bg-akodemy-purple/80 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? <InlineSpinner /> : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
