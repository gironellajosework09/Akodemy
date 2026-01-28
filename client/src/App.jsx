// App routes and top-level layout.
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import SsoCallback from './pages/SsoCallback'
import StudentDashboard from './pages/student/Dashboard'
import StudentProfile from './pages/student/Profile'
import LanguageSelection from './pages/student/LanguageSelection'
import DifficultySelection from './pages/student/DifficultySelection'
import ChallengeList from './pages/student/ChallengeList'
import ChallengeEditor from './pages/student/ChallengeEditor'
import FacultyDashboard from './pages/faculty/Dashboard'
import FacultyProfile from './pages/faculty/Profile'
import StudentList from './pages/faculty/StudentList'
import StudentProfileView from './pages/faculty/StudentProfileView'
import AdminUserManagement from './pages/admin/UserManagement'

function getDefaultRoute(role) {
  switch (role) {
    case 'admin': return '/admin'
    case 'faculty': return '/faculty'
    default: return '/dashboard'
  }
}

function ProtectedRoute({ children, allowedRoles }) {
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
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  if (allowedRoles && !roles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />
  }
  
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Login />} />
      <Route path="/sso" element={<SsoCallback />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles="student">
          <StudentProfile />
        </ProtectedRoute>
      } />
      <Route path="/languages" element={
        <ProtectedRoute allowedRoles="student">
          <LanguageSelection />
        </ProtectedRoute>
      } />
      <Route path="/challenges/:language/difficulty" element={
        <ProtectedRoute allowedRoles="student">
          <DifficultySelection />
        </ProtectedRoute>
      } />
      <Route path="/challenges/:language/:difficulty" element={
        <ProtectedRoute allowedRoles="student">
          <ChallengeList />
        </ProtectedRoute>
      } />
      <Route path="/challenge/:challengeId" element={
        <ProtectedRoute allowedRoles="student">
          <ChallengeEditor />
        </ProtectedRoute>
      } />
      
      <Route path="/faculty" element={
        <ProtectedRoute allowedRoles="faculty">
          <FacultyDashboard />
        </ProtectedRoute>
      } />
      <Route path="/faculty/profile" element={
        <ProtectedRoute allowedRoles="faculty">
          <FacultyProfile />
        </ProtectedRoute>
      } />
      <Route path="/faculty/students" element={
        <ProtectedRoute allowedRoles="faculty">
          <StudentList />
        </ProtectedRoute>
      } />
      <Route path="/faculty/student/:studentId" element={
        <ProtectedRoute allowedRoles="faculty">
          <StudentProfileView />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles="admin">
          <AdminUserManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles="admin">
          <AdminUserManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
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


