// Axios API client with auth handling.
import axios from 'axios'

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const authPaths = [
        '/api/auth/login',
        '/api/auth/register',
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


