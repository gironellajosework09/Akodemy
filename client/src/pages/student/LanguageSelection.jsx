import { useNavigate } from 'react-router-dom'
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
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Language</h1>
          <p className="text-gray-400">Test your skills and earn mastery badges by solving challenges!</p>
        </div>

        <div className="flex justify-center items-center gap-8 flex-wrap">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => navigate(`/challenges/${lang.id}/difficulty`)}
              className="group flex flex-col items-center p-8 bg-gray-800 border border-gray-700 rounded-2xl hover:border-akodemy-purple transition-all hover:-translate-y-2"
            >
              <div className={`text-8xl mb-4 ${lang.bg} w-32 h-32 rounded-xl flex items-center justify-center`}>
                {lang.icon}
              </div>
              <p className={`font-bold text-xl ${lang.color}`}>{lang.name}</p>
              <div className="h-1 w-0 group-hover:w-full bg-akodemy-purple transition-all duration-300 mt-3 rounded-full"></div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
