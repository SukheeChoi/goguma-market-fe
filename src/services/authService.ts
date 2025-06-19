import { apiClient, setAuthToken } from '@/lib/api'

export interface SignupRequest {
  name: string
  email: string
  password: string
  phone?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  type: string
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const authService = {
  // 회원가입
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/signup', data)
    if (response.token) {
      setAuthToken(response.token)
    }
    return response
  },

  // 로그인
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data)
    if (response.token) {
      setAuthToken(response.token)
    }
    return response
  },

  // 로그아웃
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setAuthToken(null)
    }
  },

  // 이메일 중복 확인
  async checkEmail(email: string): Promise<{ exists: boolean }> {
    return await apiClient.get(`/auth/check-email?email=${email}`)
  },

  // 현재 사용자 정보 조회
  async getCurrentUser(): Promise<User> {
    return await apiClient.get('/auth/me')
  },

  // 프로필 업데이트
  async updateProfile(data: { name?: string; phone?: string; avatar?: string }): Promise<User> {
    return await apiClient.put('/auth/profile', data)
  },

  // 비밀번호 변경
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return await apiClient.post('/auth/change-password', data)
  },

  // 토큰 검증
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken')
  },

  // 토큰 가져오기
  getToken(): string | null {
    return localStorage.getItem('authToken')
  }
}