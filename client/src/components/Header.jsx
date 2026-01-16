// UI component: Header.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, LogOut, Code2, Home } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

// Component logic for Header.
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
      <header className="bg-gray-900 border-b border-gray-800 text-white py-2 sm:py-4 px-3 sm:px-6 flex justify-between items-center">
        <Link to={user?.role === 'faculty' ? '/faculty' : '/dashboard'} className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
          {/* <div className="w-8 h-8 sm:w-10 sm:h-10 bg-akodemy-purple rounded-lg flex items-center justify-center"> */}
            {/* <Code2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" /> */}
              <img
                src="/images/akodemy-logo.png"
                alt="Akodemy Logo"
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
              />
          </div>
          <span className="text-lg sm:text-2xl font-bold tracking-wide">Akodemy</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link 
            to={user?.role === 'faculty' ? '/faculty' : '/dashboard'} 
            className="flex items-center gap-2 bg-gray-800 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm sm:text-base">Home</span>
          </Link>
          <Link 
            to={user?.role === 'faculty' ? '/faculty/profile' : '/profile'} 
            className="flex items-center gap-2 bg-gray-800 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm sm:text-base">My Profile</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition p-1.5 sm:p-2 rounded-lg hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
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



