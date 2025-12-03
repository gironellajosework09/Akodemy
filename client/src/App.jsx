import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import StudentDashboard from './pages/student/Dashboard'
import StudentProfile from './pages/student/Profile'
import LanguageSelection from './pages/student/LanguageSelection'
import DifficultySelection from './pages/student/DifficultySelection'
import ChallengeList from './pages/student/ChallengeList'
import ChallengeEditor from './pages/student/ChallengeEditor'
import FacultyDashboard from './pages/faculty/Dashboard'
import StudentList from './pages/faculty/StudentList'
import StudentProfileView from './pages/faculty/StudentProfileView'

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'faculty' ? '/faculty' : '/dashboard'} replace />
  }
  
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'faculty' ? '/faculty' : '/dashboard'} /> : <Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRole="student">
          <StudentProfile />
        </ProtectedRoute>
      } />
      <Route path="/languages" element={
        <ProtectedRoute allowedRole="student">
          <LanguageSelection />
        </ProtectedRoute>
      } />
      <Route path="/challenges/:language/difficulty" element={
        <ProtectedRoute allowedRole="student">
          <DifficultySelection />
        </ProtectedRoute>
      } />
      <Route path="/challenges/:language/:difficulty" element={
        <ProtectedRoute allowedRole="student">
          <ChallengeList />
        </ProtectedRoute>
      } />
      <Route path="/challenge/:challengeId" element={
        <ProtectedRoute allowedRole="student">
          <ChallengeEditor />
        </ProtectedRoute>
      } />
      
      <Route path="/faculty" element={
        <ProtectedRoute allowedRole="faculty">
          <FacultyDashboard />
        </ProtectedRoute>
      } />
      <Route path="/faculty/students" element={
        <ProtectedRoute allowedRole="faculty">
          <StudentList />
        </ProtectedRoute>
      } />
      <Route path="/faculty/student/:studentId" element={
        <ProtectedRoute allowedRole="faculty">
          <StudentProfileView />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
