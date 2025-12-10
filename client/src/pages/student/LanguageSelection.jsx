import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Layout from '../../components/Layout'

const languages = [
  {
    id: 'java',
    name: 'JAVA',
    icon: '☕',
    color: 'text-red-400',
    bg: 'bg-red-500/20'
  },
  {
    id: 'javascript',
    name: 'JAVASCRIPT',
    icon: '📜',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20'
  },
  {
    id: 'python',
    name: 'PYTHON',
    icon: '🐍',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20'
  }
]

export default function LanguageSelection() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="flex-1 flex flex-col px-4 sm:px-8 py-6 sm:py-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-6 self-start"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Back to Dashboard</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">Choose Your Language</h1>
            <p className="text-gray-400 text-sm sm:text-base">Test your skills and earn mastery badges by solving challenges!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 w-full max-w-3xl">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => navigate(`/challenges/${lang.id}/difficulty`)}
                className="group flex flex-col items-center p-6 sm:p-8 bg-gray-800 border border-gray-700 rounded-2xl hover:border-akodemy-purple transition-all hover:-translate-y-2"
              >
                <div className={`text-5xl sm:text-8xl mb-3 sm:mb-4 ${lang.bg} w-20 h-20 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center`}>
                  {lang.icon}
                </div>
                <p className={`font-bold text-lg sm:text-xl ${lang.color}`}>{lang.name}</p>
                <div className="h-1 w-0 group-hover:w-full bg-akodemy-purple transition-all duration-300 mt-2 sm:mt-3 rounded-full"></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
