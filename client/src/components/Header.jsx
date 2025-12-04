import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, LogOut } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-akodemy-purple text-white py-4 px-6 flex justify-between items-center">
      <Link to={user?.role === 'faculty' ? '/faculty' : '/dashboard'} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <span className="text-akodemy-purple font-bold text-xl">A</span>
        </div>
        <span className="text-2xl font-bold tracking-wide">AKODEMY</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link 
          to={user?.role === 'faculty' ? '/faculty' : '/profile'} 
          className="flex items-center gap-2 bg-white text-akodemy-purple px-4 py-2 rounded-full hover:bg-gray-100 transition"
        >
          <span>My Profile</span>
          <User className="w-5 h-5" />
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white hover:text-gray-200 transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
