import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-akodemy-purple text-white py-4 px-6 flex justify-between items-center">
      <div className="text-lg font-medium">
        Welcome {user?.role === 'faculty' ? "Faculty's" : "Student's"} Name!
      </div>
      <div className="flex items-center gap-4">
        <Link 
          to={user?.role === 'faculty' ? '/faculty' : '/profile'} 
          className="flex items-center gap-2 bg-white text-akodemy-purple px-4 py-2 rounded-full hover:bg-gray-100 transition"
        >
          <span>My Profile</span>
          <User className="w-5 h-5" />
        </Link>
      </div>
    </header>
  )
}
