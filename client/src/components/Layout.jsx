// UI component: Layout.
import Header from './Header'
import Footer from './Footer'

// Component logic for Layout.
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}



