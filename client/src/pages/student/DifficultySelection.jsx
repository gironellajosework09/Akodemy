import { useNavigate, useParams } from 'react-router-dom'
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
      case 'javascript': return { icon: '📜', name: 'JavaScript' }
      case 'python': return { icon: '🐍', name: 'Python' }
      case 'java': return { icon: '☕', name: 'Java' }
      default: return { icon: '💻', name: language }
    }
  }

  const langInfo = getLanguageDisplay()

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="flex items-center gap-2 text-gray-400 mb-8">
          <span className="text-2xl">{langInfo.icon}</span>
          <span className="font-medium text-lg">{langInfo.name}</span>
        </div>
        
        <h1 className="text-4xl font-bold text-white text-center mb-12">
          Choose Your <span className="text-akodemy-purple">Difficulty</span>
        </h1>

        <div className="flex justify-center gap-8 flex-wrap">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              onClick={() => navigate(`/challenges/${language}/${diff.id}`)}
              className={`w-64 bg-gray-800 border-2 ${diff.color} rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 flex flex-col items-center p-8`}
            >
              <div className={`w-24 h-24 ${diff.bg} rounded-xl mb-6 flex items-center justify-center`}>
                <div className={`w-12 h-12 ${diff.color.replace('border', 'bg')} rounded-lg`}></div>
              </div>
              <p className={`font-bold text-xl ${diff.text}`}>{diff.name}</p>
              <div className={`h-1 w-16 ${diff.color.replace('border', 'bg')} mt-4 rounded-full`}></div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
