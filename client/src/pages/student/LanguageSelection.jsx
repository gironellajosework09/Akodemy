import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const languages = [
  {
    id: 'java',
    name: 'JAVA',
    icon: '☕',
    color: 'text-red-600'
  },
  {
    id: 'javascript',
    name: 'JAVASCRIPT',
    icon: '📜',
    color: 'text-yellow-500'
  },
  {
    id: 'python',
    name: 'PYTHON',
    icon: '🐍',
    color: 'text-blue-500'
  }
]

export default function LanguageSelection() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-gray-600 hover:text-akodemy-purple"
        >
          <ChevronLeft className="w-5 h-5" />
          back
        </button>
      </div>

      <div className="container mx-auto px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-akodemy-purple mb-2">Choose your language,</h1>
          <p className="text-gray-600">test your skills, and earn mastery badges by solving challenges!</p>
        </div>

        <div className="flex justify-center items-center gap-8">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => navigate(`/challenges/${lang.id}/difficulty`)}
              className="group flex flex-col items-center p-6 hover:scale-110 transition-transform"
            >
              <div className="text-8xl mb-4">{lang.icon}</div>
              <p className={`font-bold text-xl ${lang.color}`}>{lang.name}</p>
              <div className="h-1 w-0 group-hover:w-full bg-akodemy-purple transition-all duration-300 mt-2"></div>
            </button>
          ))}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-akodemy-purple text-white py-4 text-center">
        <p>&copy; Copyright 2025. All Rights Reserved.</p>
      </footer>
    </div>
  )
}
