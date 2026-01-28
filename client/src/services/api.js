// Axios API client with auth handling.
import axios from 'axios'

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
})

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token')
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    api.defaults.headers.common['X-Access-Token'] = token
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && !config.headers?.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers['X-Access-Token'] = token
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const authPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/sso',
        '/api/auth/forgot-password',
        '/api/auth/verify-otp',
        '/api/auth/resend-otp',
        '/api/auth/reset-password'
      ]
      const isAuthRequest = authPaths.some(path => requestUrl.includes(path))
      const isLoginPage = window.location?.pathname === '/login'
      if (!isAuthRequest && !isLoginPage) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api


