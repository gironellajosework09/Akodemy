// UI component: Instructions Modal.
import { X, BookOpen, ArrowRight } from 'lucide-react'

// Component logic for Instructions Modal.
export default function InstructionsModal({ isOpen, challenge, onClose, onStartCoding }) {
  if (!isOpen || !challenge) return null

  const parseInstructions = (description) => {
    if (!description) return []
    const lines = description.split('\n').filter(line => line.trim())
    return lines.map((line, index) => ({
      id: index,
      text: line.trim()
    }))
  }

  const instructions = parseInstructions(challenge.description)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-akodemy-purple/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-akodemy-purple" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{challenge.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  challenge.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                  challenge.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {challenge.difficulty}
                </span>
                <span className="text-gray-400 text-xs capitalize">{challenge.language}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Instructions
          </h3>
          
          {instructions.length > 0 ? (
            <div className="space-y-4">
              {instructions.map((instruction, index) => (
                <div key={instruction.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-akodemy-purple/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-akodemy-purple">{index + 1}</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed pt-1">{instruction.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No instructions available for this challenge.</p>
              <p className="text-gray-500 text-sm mt-2">You can start coding right away!</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onStartCoding}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-akodemy-purple text-white rounded-xl hover:bg-purple-700 transition font-semibold text-lg"
          >
            Start Coding
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}



