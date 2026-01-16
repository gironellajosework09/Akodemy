// Faculty page: Profile.
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { User, Save, Check } from 'lucide-react'
import api from '../../services/api'

// Faculty page logic for Profile.
export default function FacultyProfile() {
  const { user, setUser } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    phone: user?.phone || '',
    birthdate: user?.birthdate || '',
    sex: user?.sex || ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.put('/api/auth/profile', formData)
      setUser(response.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">My Profile</h1>
        
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-white">{user?.name || 'Faculty Name'}</h3>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-akodemy-purple/20 text-akodemy-purple text-xs rounded">Faculty</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                readOnly
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Contact Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Birthdate</label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-akodemy-purple focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-akodemy-purple text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}



