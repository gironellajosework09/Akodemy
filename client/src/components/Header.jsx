import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, LogOut, Code2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    logout()
    navigate('/login')
  }

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-800 text-white py-4 px-6 flex justify-between items-center">
        <Link to={user?.role === 'faculty' ? '/faculty' : '/dashboard'} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-akodemy-purple rounded-lg flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-wide">Akodemy</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link 
            to={user?.role === 'faculty' ? '/faculty' : '/profile'} 
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            <span>My Profile</span>
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-gray-800"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  )
}
