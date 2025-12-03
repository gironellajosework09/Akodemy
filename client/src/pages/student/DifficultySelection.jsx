import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const difficulties = [
  { id: 'beginner', name: 'Beginner', color: 'border-blue-500' },
  { id: 'intermediate', name: 'Intermediate', color: 'border-yellow-500' },
  { id: 'advanced', name: 'Advance', color: 'border-red-500' }
]

export default function DifficultySelection() {
  const navigate = useNavigate()
  const { language } = useParams()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => navigate('/languages')}
          className="flex items-center gap-1 text-gray-600 hover:text-akodemy-purple"
        >
          <ChevronLeft className="w-5 h-5" />
          back
        </button>
        <span className="text-gray-600 uppercase font-medium">PROGRAMMING LANGUAGE</span>
      </div>

      <div className="container mx-auto px-8 py-8">
        <h1 className="text-4xl font-bold text-akodemy-purple text-center mb-12">
          Skill Difficulty Tiers
        </h1>

        <div className="flex justify-center gap-8">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              onClick={() => navigate(`/challenges/${language}/${diff.id}`)}
              className={`w-64 h-80 bg-white rounded-xl border-2 ${diff.color} shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 flex flex-col items-center justify-end p-6`}
            >
              <div className="w-full h-48 bg-gray-100 rounded-lg mb-4"></div>
              <p className="font-semibold text-lg">{diff.name}</p>
              <div className={`h-1 w-16 ${diff.color.replace('border', 'bg')} mt-2 rounded-full`}></div>
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
