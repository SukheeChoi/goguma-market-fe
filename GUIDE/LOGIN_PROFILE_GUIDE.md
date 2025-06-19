# 로그인/로그아웃 및 프로필 관리 기능 개발 가이드

이 문서는 React/Next.js 기반 쇼핑몰에서 사용자 인증과 프로필 관리 기능을 구현하는 방법을 초급 개발자도 이해할 수 있도록 상세하게 설명합니다.

1. [전체 구조 개요](#1-전체-구조-개요)
2. [사용자 타입 정의](#2-사용자-타입-정의)
3. [인증 서비스 구현](#3-인증-서비스-구현)
4. [사용자 상태 관리](#4-사용자-상태-관리)
5. [로그인 페이지 구현](#5-로그인-페이지-구현)
6. [회원가입 페이지 구현](#6-회원가입-페이지-구현)
7. [프로필 관리 페이지](#7-프로필-관리-페이지)
8. [네비게이션 업데이트](#8-네비게이션-업데이트)
9. [라우팅 보호](#9-라우팅-보호)
10. [토큰 관리](#10-토큰-관리)

---

## 1. 전체 구조 개요

### 인증 시스템의 구성 요소

```
📁 src/
├── 📁 types/
│   └── auth.ts          # 사용자/인증 관련 타입
├── 📁 services/
│   └── authService.ts   # API 호출 함수들
├── 📁 store/
│   └── useAuthStore.ts  # 인증 상태 관리
├── 📁 components/
│   ├── 📁 auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ProtectedRoute.tsx
│   └── 📁 ui/
│       └── UserMenu.tsx
└── 📁 app/
    ├── 📁 auth/
    │   ├── 📁 login/
    │   │   └── page.tsx
    │   └── 📁 signup/
    │       └── page.tsx
    └── 📁 profile/
        └── page.tsx
```

### 동작 흐름
1. **로그인**: 사용자 정보 입력 → API 호출 → 토큰 저장 → 상태 업데이트
2. **인증 유지**: 페이지 새로고침 시 토큰으로 사용자 정보 복원
3. **로그아웃**: 토큰 삭제 → 상태 초기화 → 로그인 페이지 이동

---

## 2. 사용자 타입 정의

```typescript
// src/types/auth.ts

// 사용자 정보 인터페이스
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

// 로그인 요청 데이터
export interface LoginRequest {
  email: string
  password: string
}

// 회원가입 요청 데이터
export interface SignupRequest {
  email: string
  password: string
  name: string
  confirmPassword: string
}

// 프로필 수정 요청 데이터
export interface UpdateProfileRequest {
  name?: string
  avatar?: string
  currentPassword?: string
  newPassword?: string
}

// API 응답 타입
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

// 에러 응답 타입
export interface AuthError {
  message: string
  code: string
  field?: string
}
```

**💡 타입 정의를 하는 이유:**
- 코드 자동완성 지원
- 컴파일 시점에 오류 발견
- API 응답 구조 명확화

---

## 3. 인증 서비스 구현

```typescript
// src/services/authService.ts
import { apiClient } from '@/lib/api'
import { 
  LoginRequest, 
  SignupRequest, 
  UpdateProfileRequest,
  AuthResponse,
  User 
} from '@/types/auth'

export const authService = {
  // 로그인
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials)
    return response
  },

  // 회원가입
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/signup', userData)
    return response
  },

  // 로그아웃
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  // 현재 사용자 정보 조회
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/me')
    return response
  },

  // 프로필 수정
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put('/auth/profile', data)
    return response
  },

  // 비밀번호 변경
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/auth/password', {
      currentPassword,
      newPassword
    })
  },

  // 토큰 갱신
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/refresh')
    return response
  }
}
```

**💡 서비스 분리의 장점:**
- API 로직과 UI 로직 분리
- 재사용 가능한 함수들
- 테스트하기 쉬운 구조

---

## 4. 사용자 상태 관리

```typescript
// src/store/useAuthStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types/auth'
import { authService } from '@/services/authService'
import { setAuthToken } from '@/lib/api'

interface AuthState {
  // 상태
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 액션
  login: (email: string, password: string) => Promise<void>
  signup: (userData: SignupRequest) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  clearError: () => void
  
  // 초기화
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 로그인
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authService.login({ email, password })
          
          // 토큰 저장
          setAuthToken(response.accessToken)
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '로그인에 실패했습니다.',
            isLoading: false
          })
          throw error
        }
      },

      // 회원가입
      signup: async (userData) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authService.signup(userData)
          
          // 회원가입 후 자동 로그인
          setAuthToken(response.accessToken)
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '회원가입에 실패했습니다.',
            isLoading: false
          })
          throw error
        }
      },

      // 로그아웃
      logout: async () => {
        try {
          await authService.logout()
        } catch (error) {
          console.error('로그아웃 API 오류:', error)
        } finally {
          // API 실패와 관계없이 로컬 상태는 정리
          setAuthToken(null)
          set({
            user: null,
            isAuthenticated: false,
            error: null
          })
        }
      },

      // 프로필 업데이트
      updateProfile: async (data) => {
        try {
          set({ isLoading: true, error: null })
          
          const updatedUser = await authService.updateProfile(data)
          
          set({
            user: updatedUser,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '프로필 수정에 실패했습니다.',
            isLoading: false
          })
          throw error
        }
      },

      // 에러 클리어
      clearError: () => set({ error: null }),

      // 앱 초기화 (토큰이 있으면 사용자 정보 복원)
      initialize: async () => {
        try {
          set({ isLoading: true })
          
          const user = await authService.getCurrentUser()
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          // 토큰이 유효하지 않으면 정리
          setAuthToken(null)
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      // 민감한 정보는 저장하지 않음 (토큰만 별도 관리)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```

**💡 상태 관리의 핵심:**
- `persist`: 새로고침해도 로그인 상태 유지
- `partialize`: 필요한 데이터만 저장
- 토큰은 별도 관리 (보안상 이유)

---

## 5. 로그인 페이지 구현

```typescript
// src/components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/store/useAuthStore'

export default function LoginForm() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [validation, setValidation] = useState({
    email: '',
    password: ''
  })

  // 입력값 검증
  const validateForm = () => {
    const errors = { email: '', password: '' }
    
    if (!formData.email) {
      errors.email = '이메일을 입력해주세요.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.'
    }
    
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6) {
      errors.password = '비밀번호는 6자 이상이어야 합니다.'
    }
    
    setValidation(errors)
    return !errors.email && !errors.password
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await login(formData.email, formData.password)
      router.push('/') // 로그인 성공시 메인 페이지로
    } catch (error) {
      // 에러는 store에서 처리
    }
  }

  // 입력값 변경
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 에러 클리어
    if (error) clearError()
    if (validation[name as keyof typeof validation]) {
      setValidation(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">로그인</h1>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이메일 입력 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
          />
          {validation.email && (
            <p className="mt-1 text-sm text-red-600">{validation.email}</p>
          )}
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="비밀번호를 입력하세요"
          />
          {validation.password && (
            <p className="mt-1 text-sm text-red-600">{validation.password}</p>
          )}
        </div>

        {/* 로그인 버튼 */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      {/* 회원가입 링크 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
```

```typescript
// src/app/auth/login/page.tsx
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LoginForm />
    </div>
  )
}
```

**💡 로그인 폼의 핵심:**
- 클라이언트 사이드 검증 (빠른 피드백)
- 에러 상태 관리
- 로딩 상태 표시
- 접근성 고려 (label, aria-* 속성)

---

## 6. 회원가입 페이지 구현

```typescript
// src/components/auth/SignupForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/store/useAuthStore'

export default function SignupForm() {
  const router = useRouter()
  const { signup, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [validation, setValidation] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // 입력값 검증
  const validateForm = () => {
    const errors = { name: '', email: '', password: '', confirmPassword: '' }
    
    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.'
    } else if (formData.name.trim().length < 2) {
      errors.name = '이름은 2자 이상이어야 합니다.'
    }
    
    if (!formData.email) {
      errors.email = '이메일을 입력해주세요.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.'
    }
    
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 8) {
      errors.password = '비밀번호는 8자 이상이어야 합니다.'
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = '비밀번호는 영문과 숫자를 포함해야 합니다.'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }
    
    setValidation(errors)
    return Object.values(errors).every(error => !error)
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await signup({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })
      router.push('/') // 회원가입 성공시 메인 페이지로
    } catch (error) {
      // 에러는 store에서 처리
    }
  }

  // 입력값 변경
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 에러 클리어
    if (error) clearError()
    if (validation[name as keyof typeof validation]) {
      setValidation(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">회원가입</h1>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이름 입력 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="홍길동"
          />
          {validation.name && (
            <p className="mt-1 text-sm text-red-600">{validation.name}</p>
          )}
        </div>

        {/* 이메일 입력 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your@email.com"
          />
          {validation.email && (
            <p className="mt-1 text-sm text-red-600">{validation.email}</p>
          )}
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="8자 이상, 영문과 숫자 포함"
          />
          {validation.password && (
            <p className="mt-1 text-sm text-red-600">{validation.password}</p>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호 확인
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="비밀번호를 다시 입력하세요"
          />
          {validation.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{validation.confirmPassword}</p>
          )}
        </div>

        {/* 회원가입 버튼 */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? '회원가입 중...' : '회원가입'}
        </Button>
      </form>

      {/* 로그인 링크 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**💡 회원가입 폼의 특징:**
- 더 강화된 검증 (이름, 비밀번호 강도, 확인)
- 실시간 검증 피드백
- 보안을 위한 비밀번호 규칙

---

## 7. 프로필 관리 페이지

```typescript
// src/app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/store/useAuthStore'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  const [isEditing, setIsEditing] = useState(false)
  const [validation, setValidation] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  // 사용자 정보로 폼 초기화
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name
      }))
    }
  }, [user])

  // 프로필 수정
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) {
      return
    }

    try {
      await updateProfile({
        name: formData.name.trim()
      })
      setIsEditing(false)
    } catch (error) {
      // 에러는 store에서 처리
    }
  }

  // 비밀번호 변경
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      return
    }

    try {
      await updateProfile({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      
      // 성공시 폼 초기화
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }))
      alert('비밀번호가 변경되었습니다.')
    } catch (error) {
      // 에러는 store에서 처리
    }
  }

  // 프로필 폼 검증
  const validateProfileForm = () => {
    const errors = { ...validation }
    
    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.'
    } else if (formData.name.trim().length < 2) {
      errors.name = '이름은 2자 이상이어야 합니다.'
    } else {
      errors.name = ''
    }
    
    setValidation(errors)
    return !errors.name
  }

  // 비밀번호 폼 검증
  const validatePasswordForm = () => {
    const errors = { ...validation }
    
    if (!formData.currentPassword) {
      errors.currentPassword = '현재 비밀번호를 입력해주세요.'
    } else {
      errors.currentPassword = ''
    }
    
    if (!formData.newPassword) {
      errors.newPassword = '새 비밀번호를 입력해주세요.'
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = '비밀번호는 8자 이상이어야 합니다.'
    } else {
      errors.newPassword = ''
    }
    
    if (formData.newPassword !== formData.confirmNewPassword) {
      errors.confirmNewPassword = '새 비밀번호가 일치하지 않습니다.'
    } else {
      errors.confirmNewPassword = ''
    }
    
    setValidation(errors)
    return !errors.currentPassword && !errors.newPassword && !errors.confirmNewPassword
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!user) {
    return <div>로딩 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">프로필 관리</h1>
      
      {/* 기본 정보 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <p className="text-gray-900">{user.email}</p>
            <p className="text-sm text-gray-500">이메일은 변경할 수 없습니다.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              가입일
            </label>
            <p className="text-gray-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* 프로필 수정 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">프로필 수정</h2>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              수정
            </Button>
          )}
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  !isEditing ? 'bg-gray-100' : validation.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validation.name && (
                <p className="mt-1 text-sm text-red-600">{validation.name}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '저장 중...' : '저장'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData(prev => ({ ...prev, name: user.name }))
                  }}
                >
                  취소
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* 비밀번호 변경 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">비밀번호 변경</h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              현재 비밀번호
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validation.currentPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validation.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{validation.currentPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validation.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validation.newPassword && (
              <p className="mt-1 text-sm text-red-600">{validation.newPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validation.confirmNewPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validation.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-600">{validation.confirmNewPassword}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ProtectedProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  )
}
```

**💡 프로필 페이지의 특징:**
- 읽기 전용과 편집 모드 분리
- 민감한 정보 (이메일) 수정 제한
- 비밀번호 변경 별도 처리

---

## 8. 네비게이션 업데이트

```typescript
// src/components/ui/UserMenu.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function UserMenu() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 외부 클릭시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/')
    setIsOpen(false)
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/login"
          className="text-white hover:text-gray-200 transition-colors"
        >
          로그인
        </Link>
        <Link
          href="/auth/signup"
          className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          회원가입
        </Link>
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* 사용자 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
      >
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-gray-700">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="hidden md:block">{user.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            프로필 관리
          </Link>
          
          <Link
            href="/orders"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            주문 내역
          </Link>
          
          <Link
            href="/wishlist"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            위시리스트
          </Link>
          
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
```

```typescript
// src/components/layout/Header.tsx에 UserMenu 추가
import UserMenu from '@/components/ui/UserMenu'

export default function Header() {
  return (
    <header className="w-full bg-black text-white">
      <div className="flex justify-between items-center p-4">
        {/* 로고 등 기존 내용 */}
        
        {/* 오른쪽: 사용자 메뉴 */}
        <div className="flex items-center space-x-4">
          <CartIcon />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
```

**💡 사용자 메뉴의 특징:**
- 로그인 상태에 따른 조건부 렌더링
- 드롭다운 메뉴로 깔끔한 UI
- 외부 클릭 감지로 사용성 개선

---

## 9. 라우팅 보호

```typescript
// src/components/auth/ProtectedRoute.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    // 앱 시작시 인증 상태 초기화
    initialize()
  }, [initialize])

  useEffect(() => {
    // 로딩이 끝나고 인증되지 않은 경우 리다이렉트
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  // 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // 인증되지 않은 경우 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!isAuthenticated) {
    return null
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>
}
```

**💡 라우팅 보호의 핵심:**
- 인증되지 않은 사용자 자동 리다이렉트
- 로딩 상태 처리
- 깜빡임 없는 부드러운 전환

---

## 10. 토큰 관리

```typescript
// src/lib/api.ts (기존 파일에 추가된 부분 설명)

// 토큰 저장소
let authToken: string | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
  if (token) {
    // API 헤더에 토큰 설정
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    // localStorage에 저장
    localStorage.setItem('authToken', token)
  } else {
    // 토큰 제거
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

// 응답 인터셉터에서 401 에러 처리
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      setAuthToken(null)
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)
```

```typescript
// src/app/layout.tsx에서 토큰 초기화
'use client'

import { useEffect } from 'react'
import { initializeAuth } from '@/lib/api'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // 앱 시작시 토큰 복원
    initializeAuth()
  }, [])

  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  )
}
```

**💡 토큰 관리의 핵심:**
- 자동 헤더 설정
- localStorage 동기화
- 만료된 토큰 자동 처리
- 페이지 새로고침시 복원

---

## 사용 예제

### 1. 로그인 후 상품 페이지 접근
```typescript
// 로그인이 필요한 페이지에서
const { isAuthenticated, user } = useAuthStore()

if (isAuthenticated) {
  // 로그인된 사용자만 볼 수 있는 내용
  return <div>안녕하세요, {user?.name}님!</div>
}
```

### 2. 관리자 전용 기능
```typescript
const { user } = useAuthStore()

if (user?.role === 'ADMIN') {
  return <AdminPanel />
}
```

### 3. 조건부 렌더링
```typescript
const { isAuthenticated } = useAuthStore()

return (
  <div>
    {isAuthenticated ? (
      <button onClick={handleAddToWishlist}>위시리스트 추가</button>
    ) : (
      <Link href="/auth/login">로그인하고 위시리스트에 추가</Link>
    )}
  </div>
)
```

---

## 보안 고려사항

### 1. **토큰 저장**
- ✅ localStorage 사용 (XSS 주의)
- ❌ 쿠키 사용시 httpOnly 설정 필요

### 2. **비밀번호 처리**
- ✅ 클라이언트에서 평문 전송 (HTTPS 필수)
- ✅ 서버에서 해싱 처리
- ❌ 클라이언트에서 해싱 금지

### 3. **입력값 검증**
- ✅ 클라이언트 + 서버 양쪽 검증
- ✅ SQL 인젝션 방지
- ✅ XSS 방지

### 4. **에러 처리**
- ✅ 민감한 정보 노출 금지
- ✅ 일반적인 에러 메시지 사용

---

## 마무리

이 문서를 통해 다음을 학습했습니다:

1. **전체 인증 흐름** 이해
2. **상태 관리** (Zustand 활용)
3. **폼 검증** 및 에러 처리
4. **라우팅 보호** 구현
5. **토큰 기반 인증** 시스템
6. **사용자 경험** 개선 방법

각 코드는 실제 프로덕션에서 사용할 수 있는 수준으로 작성되었으며, 보안과 사용성을 모두 고려했습니다. 

추가로 구현하고 싶은 기능이 있다면 이 기반 위에서 확장해나가면 됩니다!