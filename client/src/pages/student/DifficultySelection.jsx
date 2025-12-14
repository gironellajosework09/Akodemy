import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Layout from '../../components/Layout'

const difficulties = [
  { id: 'beginner', name: 'Beginner', color: 'border-green-500', bg: 'bg-green-500/20', text: 'text-green-400' },
  { id: 'intermediate', name: 'Intermediate', color: 'border-yellow-500', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  { id: 'advanced', name: 'Advanced', color: 'border-red-500', bg: 'bg-red-500/20', text: 'text-red-400' }
]

export default function DifficultySelection() {
  const navigate = useNavigate()
  const { language } = useParams()

  const getLanguageDisplay = () => {
    switch (language) {
      case 'javascript': return { icon: '/images/js-logo.png', name: 'JavaScript' }
      case 'python': return { icon: '/images/python-logo.png', name: 'Python' }
      case 'java': return { icon: '/images/java-logo.png', name: 'Java' }
      default: return { icon: '💻', name: language }
    }
  }

  const langInfo = getLanguageDisplay()

  return (
    <Layout>
      <div className="flex-1 flex flex-col px-4 sm:px-8 py-6 sm:py-12">
        <button
          onClick={() => navigate('/languages')}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-6 self-start"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Back to Language Selection</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex items-center text-gray-400 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-14 sm:h-14 p-1 sm:p-2 rounded-lg flex items-center justify-center">
              <img
                src={langInfo.icon}
                alt={langInfo.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-medium text-base sm:text-lg">{langInfo.name}</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
            Choose Your <span className="text-akodemy-purple">Difficulty</span>
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 w-full max-w-3xl">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                onClick={() => navigate(`/challenges/${language}/${diff.id}`)}
                className={`bg-gray-800 border-2 ${diff.color} rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 flex flex-col items-center p-6 sm:p-8`}
              >
                <div className={`w-16 h-16 sm:w-24 sm:h-24 ${diff.bg} rounded-xl mb-4 sm:mb-6 flex items-center justify-center`}>
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 ${diff.color.replace('border', 'bg')} rounded-lg`}></div>
                </div>
                <p className={`font-bold text-lg sm:text-xl ${diff.text}`}>{diff.name}</p>
                <div className={`h-1 w-12 sm:w-16 ${diff.color.replace('border', 'bg')} mt-3 sm:mt-4 rounded-full`}></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
