import axios from 'axios'

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8082/api' : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 토큰 저장소
let authToken: string | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('authToken', token)
  } else {
    delete apiClient.defaults.headers.common['Authorization']
    localStorage.removeItem('authToken')
  }
}

// 페이지 로드시 토큰 복원
export const initializeAuth = () => {
  if (typeof window !== 'undefined') {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      setAuthToken(savedToken)
    }
  }
}

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 헤더에 추가
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      setAuthToken(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
    
    if (error.response) {
      console.error('API Error:', error.response.data)
    } else if (error.request) {
      console.error('Network Error:', error.request)
    } else {
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)