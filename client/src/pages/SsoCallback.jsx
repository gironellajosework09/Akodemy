// SSO callback handler for CCIS Portal handoff.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function SsoCallback() {
  const [error, setError] = useState('')
  const { setSession } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')

    if (!token) {
      setError('Missing SSO token')
      return
    }

    let isMounted = true

    api.post('/api/auth/sso', { token })
      .then((response) => {
        if (!isMounted) return
        setSession(response.data)
        const role = response.data.user?.role
        navigate(role === 'faculty' ? '/faculty' : '/dashboard', { replace: true })
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.response?.data?.message || 'SSO login failed')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 1500)
      })

    return () => {
      isMounted = false
    }
  }, [location.search, navigate, setSession])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-akodemy-purple mx-auto mb-6"></div>
        <h1 className="text-2xl font-semibold mb-2">Signing you in...</h1>
        <p className="text-gray-400">
          {error || 'Connecting your CCIS Portal session to Akodemy.'}
        </p>
      </div>
    </div>
  )
}
