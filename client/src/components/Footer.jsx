import { Code2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-6 px-6 border-t border-gray-800 bg-gray-900">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-akodemy-purple rounded flex items-center justify-center">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white">Akodemy</span>
        </div>
        <p className="text-gray-500 text-sm">2025 Akodemy. Built for learning.</p>
      </div>
    </footer>
  )
}
