# API 통합 및 유틸리티 개발 가이드

이 문서는 React/Next.js 기반 쇼핑몰에서 API 통합, 유틸리티 함수, 그리고 전체 시스템 아키텍처를 구현하는 방법을 설명합니다.

## 목차
1. [전체 아키텍처 개요](#1-전체-아키텍처-개요)
2. [API 클라이언트 설정](#2-api-클라이언트-설정)
3. [인증 서비스](#3-인증-서비스)
4. [상품 API 서비스](#4-상품-api-서비스)
5. [에러 처리 시스템](#5-에러-처리-시스템)
6. [유틸리티 함수](#6-유틸리티-함수)
7. [데이터 타입 변환](#7-데이터-타입-변환)
8. [성능 최적화](#8-성능-최적화)
9. [개발 환경 설정](#9-개발-환경-설정)
10. [프로덕션 배포](#10-프로덕션-배포)

---

## 1. 전체 아키텍처 개요

### 시스템 아키텍처

```
📁 전체 시스템 구조
├── 📁 Frontend (Next.js 15)
│   ├── 📁 app/                    # App Router 페이지
│   ├── 📁 components/             # React 컴포넌트
│   ├── 📁 store/                  # Zustand 상태 관리
│   ├── 📁 services/               # API 서비스 레이어
│   ├── 📁 lib/                    # 유틸리티 및 설정
│   ├── 📁 types/                  # TypeScript 타입 정의
│   └── 📁 data/                   # Mock 데이터
├── 📁 Backend API (가상)
│   ├── 📁 auth/                   # 인증 엔드포인트
│   ├── 📁 products/               # 상품 API
│   ├── 📁 users/                  # 사용자 API
│   └── 📁 orders/                 # 주문 API
└── 📁 External Services
    ├── 결제 시스템 (PG)
    ├── 이미지 CDN
    └── 알림 서비스
```

### 데이터 플로우

```
User Action → Component → Store → Service → API → Backend
                 ↓
             UI Update ← Store ← Service ← Response ← Backend
```

### 핵심 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **상태 관리**: Zustand with persistence
- **HTTP 클라이언트**: Axios with interceptors
- **스타일링**: Tailwind CSS v4
- **인증**: JWT Token-based
- **데이터 페칭**: React Query (선택적)

---

## 2. API 클라이언트 설정

### Axios 클라이언트 구성

```typescript
// src/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.goguma-market.com'
const API_TIMEOUT = 10000 // 10초

// Axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 인증 토큰 추가
    const token = getAuthToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 요청 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
      if (config.data) {
        console.log('📤 Request Data:', config.data)
      }
    }

    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 응답 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`)
      console.log('📥 Response Data:', response.data)
    }

    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 401 에러 처리 (토큰 만료)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // 토큰 갱신 시도
        const newToken = await refreshAuthToken()
        if (newToken) {
          setAuthToken(newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // 갱신 실패 시 로그아웃 처리
        handleAuthFailure()
        return Promise.reject(refreshError)
      }
    }

    // 네트워크 에러 처리
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error('🌐 Network Error:', error.message)
      showNetworkErrorToast()
    }

    // 서버 에러 처리
    if (error.response?.status >= 500) {
      console.error('🔥 Server Error:', error.response.data)
      showServerErrorToast()
    }

    console.error('❌ API Error:', error)
    return Promise.reject(error)
  }
)

// 토큰 관리 함수들
let authToken: string | null = null

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || authToken
  }
  return authToken
}

export const setAuthToken = (token: string): void => {
  authToken = token
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token)
  }
}

export const removeAuthToken = (): void => {
  authToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
  }
}

// 토큰 갱신 함수
const refreshAuthToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return null

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken
    })

    return response.data.access_token
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

// 인증 실패 처리
const handleAuthFailure = (): void => {
  removeAuthToken()
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refresh_token')
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login'
  }
}

// 에러 토스트 함수들
const showNetworkErrorToast = () => {
  // react-toastify 또는 다른 토스트 라이브러리 사용
  console.warn('네트워크 연결을 확인해주세요.')
}

const showServerErrorToast = () => {
  console.warn('서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
}

// 인증 초기화 함수
export const initializeAuth = (): void => {
  const token = getAuthToken()
  if (token) {
    // 토큰 유효성 검사 (선택적)
    validateToken(token)
  }
}

const validateToken = async (token: string): Promise<boolean> => {
  try {
    await apiClient.get('/auth/validate')
    return true
  } catch (error) {
    removeAuthToken()
    return false
  }
}
```

### API 응답 타입 정의

```typescript
// src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiError {
  status: number
  message: string
  details?: any
}

// HTTP 메서드별 제네릭 타입
export type ApiGet<T> = () => Promise<ApiResponse<T>>
export type ApiPost<T, U> = (data: U) => Promise<ApiResponse<T>>
export type ApiPut<T, U> = (id: string, data: U) => Promise<ApiResponse<T>>
export type ApiDelete = (id: string) => Promise<ApiResponse<void>>
```

---

## 3. 인증 서비스

### 인증 서비스 구현

```typescript
// src/services/authService.ts
import { apiClient, setAuthToken, removeAuthToken } from '@/lib/api'
import { ApiResponse } from '@/types/api'

// 인증 관련 타입
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
  phone?: string
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

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface UpdateProfileRequest {
  name?: string
  phone?: string
  avatar?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

class AuthService {
  private readonly AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  }

  // 로그인
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        this.AUTH_ENDPOINTS.LOGIN,
        credentials
      )

      const authData = response.data.data
      
      // 토큰 저장
      setAuthToken(authData.access_token)
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', authData.refresh_token)
      }

      return authData
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  // 회원가입
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        this.AUTH_ENDPOINTS.SIGNUP,
        userData
      )

      const authData = response.data.data
      
      // 토큰 저장
      setAuthToken(authData.access_token)
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', authData.refresh_token)
      }

      return authData
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  // 로그아웃
  async logout(): Promise<void> {
    try {
      await apiClient.post(this.AUTH_ENDPOINTS.LOGOUT)
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // 로컬 저장소 정리
      removeAuthToken()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refresh_token')
      }
    }
  }

  // 현재 사용자 정보 조회
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(
        this.AUTH_ENDPOINTS.PROFILE
      )
      return response.data.data
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  // 프로필 업데이트
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(
        this.AUTH_ENDPOINTS.PROFILE,
        data
      )
      return response.data.data
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  // 비밀번호 변경
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(
        this.AUTH_ENDPOINTS.CHANGE_PASSWORD,
        data
      )
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  // 인증 상태 확인
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      return !!token
    }
    return false
  }

  // 토큰 갱신
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await apiClient.post<ApiResponse<{ access_token: string }>>(
        this.AUTH_ENDPOINTS.REFRESH,
        { refresh_token: refreshToken }
      )

      const newToken = response.data.data.access_token
      setAuthToken(newToken)
      return newToken
    } catch (error: any) {
      removeAuthToken()
      throw this.handleAuthError(error)
    }
  }

  // 에러 처리
  private handleAuthError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message)
    }
    
    if (error.response?.status === 401) {
      return new Error('인증에 실패했습니다. 다시 로그인해주세요.')
    }
    
    if (error.response?.status === 422) {
      return new Error('입력한 정보를 확인해주세요.')
    }
    
    return new Error('서버와의 통신 중 오류가 발생했습니다.')
  }
}

// 싱글톤 인스턴스 export
export const authService = new AuthService()
```

### 인증 Hook

```typescript
// src/hooks/useAuth.ts
import { useUserStore } from '@/store'
import { authService } from '@/services/authService'
import { useCallback } from 'react'

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    updateProfile: storeUpdateProfile,
  } = useUserStore()

  const login = useCallback(async (email: string, password: string) => {
    try {
      await storeLogin(email, password)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [storeLogin])

  const logout = useCallback(async () => {
    try {
      await storeLogout()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [storeLogout])

  const updateProfile = useCallback(async (data: any) => {
    try {
      await storeUpdateProfile(data)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [storeUpdateProfile])

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
    isLoggedIn: isAuthenticated,
  }
}
```

---

## 4. 상품 API 서비스

### 상품 서비스 구현

```typescript
// src/services/productService.ts
import { apiClient } from '@/lib/api'
import { ApiResponse, PaginatedResponse } from '@/types/api'
import { Product, ApiProduct, ProductFilter } from '@/types/product'

// 상품 검색 파라미터
export interface ProductSearchParams {
  q?: string              // 검색어
  category?: string       // 카테고리 ID
  subcategory?: string    // 서브카테고리 ID
  brand?: string          // 브랜드 ID
  minPrice?: number       // 최소 가격
  maxPrice?: number       // 최대 가격
  sortBy?: 'latest' | 'popular' | 'price_asc' | 'price_desc' | 'rating'
  page?: number           // 페이지 번호
  limit?: number          // 페이지 당 아이템 수
  tags?: string[]         // 태그 필터
}

class ProductService {
  private readonly PRODUCT_ENDPOINTS = {
    LIST: '/products',
    DETAIL: '/products',
    SEARCH: '/products/search',
    CATEGORIES: '/categories',
    BRANDS: '/brands',
    POPULAR: '/products/popular',
    RECOMMENDATIONS: '/products/recommendations',
  }

  // 상품 목록 조회
  async getProducts(params: ProductSearchParams = {}): Promise<PaginatedResponse<Product>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<ApiProduct>>>(
        this.PRODUCT_ENDPOINTS.LIST,
        { params }
      )

      // API 데이터를 프론트엔드 형식으로 변환
      const apiData = response.data.data
      return {
        ...apiData,
        data: apiData.data.map(this.transformApiProductToProduct)
      }
    } catch (error: any) {
      throw this.handleProductError(error)
    }
  }

  // 상품 상세 조회
  async getProduct(id: string): Promise<Product> {
    try {
      const response = await apiClient.get<ApiResponse<ApiProduct>>(
        `${this.PRODUCT_ENDPOINTS.DETAIL}/${id}`
      )

      return this.transformApiProductToProduct(response.data.data)
    } catch (error: any) {
      throw this.handleProductError(error)
    }
  }

  // 상품 검색
  async searchProducts(query: string, filters: ProductFilter = {}): Promise<Product[]> {
    try {
      const params = {
        q: query,
        ...filters
      }

      const response = await apiClient.get<ApiResponse<ApiProduct[]>>(
        this.PRODUCT_ENDPOINTS.SEARCH,
        { params }
      )

      return response.data.data.map(this.transformApiProductToProduct)
    } catch (error: any) {
      throw this.handleProductError(error)
    }
  }

  // 인기 상품 조회
  async getPopularProducts(limit: number = 12): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<ApiProduct[]>>(
        this.PRODUCT_ENDPOINTS.POPULAR,
        { params: { limit } }
      )

      return response.data.data.map(this.transformApiProductToProduct)
    } catch (error: any) {
      throw this.handleProductError(error)
    }
  }

  // 추천 상품 조회
  async getRecommendations(userId?: string, limit: number = 8): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<ApiProduct[]>>(
        this.PRODUCT_ENDPOINTS.RECOMMENDATIONS,
        { params: { userId, limit } }
      )

      return response.data.data.map(this.transformApiProductToProduct)
    } catch (error: any) {
      throw this.handleProductError(error)
    }
  }

  // 카테고리 목록 조회
  async getCategories(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        this.PRODUCT_ENDPOINTS.CATEGORIES
      )

      return response.data.data
    } catch (error: any) {
      throw this.handleProductError(error)
    }
  }

  // 브랜드 목록 조회
  async getBrands(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(
        this.PRODUCT_ENDPOINTS.BRANDS
      )

      return response.data.data
    } catch (error: any) {
      throw this.handleProductError(error)
    }
  }

  // API 데이터 변환 함수
  private transformApiProductToProduct(apiProduct: ApiProduct): Product {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      brand: apiProduct.brand.name,
      price: apiProduct.price,
      originalPrice: apiProduct.originalPrice,
      discountRate: apiProduct.discountRate,
      category: apiProduct.category.name,
      subcategory: apiProduct.subcategory.name,
      description: apiProduct.description,
      image: `/images/products/${apiProduct.id}/main.jpg`, // 이미지 URL 변환
      images: [
        `/images/products/${apiProduct.id}/main.jpg`,
        `/images/products/${apiProduct.id}/sub1.jpg`,
        `/images/products/${apiProduct.id}/sub2.jpg`,
      ],
      rating: apiProduct.rating,
      reviewCount: apiProduct.reviewCount,
      sizes: [
        { id: 'S', name: 'S', available: true },
        { id: 'M', name: 'M', available: true },
        { id: 'L', name: 'L', available: true },
        { id: 'XL', name: 'XL', available: apiProduct.stock > 10 },
      ],
      colors: [
        { id: 'black', name: '블랙', hex: '#000000', available: true },
        { id: 'white', name: '화이트', hex: '#FFFFFF', available: true },
        { id: 'gray', name: '그레이', hex: '#808080', available: apiProduct.stock > 5 },
      ],
      isNew: apiProduct.isNew,
      isBest: apiProduct.isBest,
      isOnSale: apiProduct.isOnSale,
      isSoldoutSoon: apiProduct.isSoldoutSoon || apiProduct.stock < 5,
      isSoldout: apiProduct.isSoldout || apiProduct.stock === 0,
      stock: apiProduct.stock,
      createdAt: apiProduct.createdAt,
    }
  }

  // 에러 처리
  private handleProductError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message)
    }
    
    if (error.response?.status === 404) {
      return new Error('상품을 찾을 수 없습니다.')
    }
    
    return new Error('상품 정보를 불러오는 중 오류가 발생했습니다.')
  }
}

// 싱글톤 인스턴스 export
export const productService = new ProductService()
```

### 캐싱 및 최적화

```typescript
// src/lib/cache.ts
interface CacheItem<T> {
  data: T
  timestamp: number
  expiresIn: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

export const memoryCache = new MemoryCache()

// 캐시 활용 데코레이터
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  expiresIn?: number
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = keyGenerator(...args)
    const cached = memoryCache.get(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const result = await fn(...args)
    memoryCache.set(cacheKey, result, expiresIn)
    
    return result
  }) as T
}
```

---

## 5. 에러 처리 시스템

### 에러 타입 정의

```typescript
// src/types/error.ts
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
  timestamp: Date
}

export class NetworkError extends Error {
  public readonly type = ErrorType.NETWORK
  public readonly timestamp = new Date()

  constructor(message: string = '네트워크 연결을 확인해주세요.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends Error {
  public readonly type = ErrorType.AUTHENTICATION
  public readonly timestamp = new Date()

  constructor(message: string = '인증에 실패했습니다.') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends Error {
  public readonly type = ErrorType.VALIDATION
  public readonly timestamp = new Date()

  constructor(message: string = '입력 정보를 확인해주세요.', public fields?: Record<string, string>) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

### 에러 핸들러

```typescript
// src/lib/errorHandler.ts
import { AppError, ErrorType, NetworkError, AuthenticationError, ValidationError } from '@/types/error'
import { toast } from 'react-toastify'

class ErrorHandler {
  // 에러 분류 및 처리
  handle(error: any): AppError {
    let appError: AppError

    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      appError = this.createNetworkError(error)
    } else if (error.response?.status === 401) {
      appError = this.createAuthError(error)
    } else if (error.response?.status === 403) {
      appError = this.createAuthorizationError(error)
    } else if (error.response?.status === 422) {
      appError = this.createValidationError(error)
    } else if (error.response?.status === 404) {
      appError = this.createNotFoundError(error)
    } else if (error.response?.status >= 500) {
      appError = this.createServerError(error)
    } else {
      appError = this.createUnknownError(error)
    }

    // 에러 로깅
    this.logError(appError, error)

    // 사용자에게 알림
    this.showErrorToast(appError)

    return appError
  }

  private createNetworkError(error: any): AppError {
    return {
      type: ErrorType.NETWORK,
      message: '인터넷 연결을 확인해주세요.',
      timestamp: new Date(),
    }
  }

  private createAuthError(error: any): AppError {
    return {
      type: ErrorType.AUTHENTICATION,
      message: error.response?.data?.message || '로그인이 필요합니다.',
      timestamp: new Date(),
    }
  }

  private createAuthorizationError(error: any): AppError {
    return {
      type: ErrorType.AUTHORIZATION,
      message: '접근 권한이 없습니다.',
      timestamp: new Date(),
    }
  }

  private createValidationError(error: any): AppError {
    return {
      type: ErrorType.VALIDATION,
      message: error.response?.data?.message || '입력 정보를 확인해주세요.',
      details: error.response?.data?.errors,
      timestamp: new Date(),
    }
  }

  private createNotFoundError(error: any): AppError {
    return {
      type: ErrorType.NOT_FOUND,
      message: '요청하신 정보를 찾을 수 없습니다.',
      timestamp: new Date(),
    }
  }

  private createServerError(error: any): AppError {
    return {
      type: ErrorType.SERVER,
      message: '서버에 일시적인 문제가 발생했습니다.',
      timestamp: new Date(),
    }
  }

  private createUnknownError(error: any): AppError {
    return {
      type: ErrorType.UNKNOWN,
      message: '알 수 없는 오류가 발생했습니다.',
      details: error.message,
      timestamp: new Date(),
    }
  }

  private logError(appError: AppError, originalError: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${appError.type}]`)
      console.error('App Error:', appError)
      console.error('Original Error:', originalError)
      console.groupEnd()
    }

    // 프로덕션에서는 외부 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(appError, originalError)
    }
  }

  private showErrorToast(error: AppError): void {
    const toastOptions = {
      position: 'top-right' as const,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    }

    switch (error.type) {
      case ErrorType.NETWORK:
        toast.error('🌐 ' + error.message, toastOptions)
        break
      case ErrorType.AUTHENTICATION:
        toast.warn('🔐 ' + error.message, toastOptions)
        break
      case ErrorType.VALIDATION:
        toast.warning('⚠️ ' + error.message, toastOptions)
        break
      case ErrorType.SERVER:
        toast.error('🔥 ' + error.message, toastOptions)
        break
      default:
        toast.error('❌ ' + error.message, toastOptions)
    }
  }

  private sendToLoggingService(appError: AppError, originalError: any): void {
    // Sentry, LogRocket 등 외부 로깅 서비스 연동
    try {
      // 예: Sentry.captureException(originalError)
      console.log('Would send to logging service:', { appError, originalError })
    } catch (loggingError) {
      console.error('Failed to send error to logging service:', loggingError)
    }
  }
}

export const errorHandler = new ErrorHandler()
```

### 에러 바운더리

```typescript
// src/components/ErrorBoundary.tsx
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 에러 로깅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">
              페이지를 로드하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                페이지 새로고침
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                홈으로 이동
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 6. 유틸리티 함수

### 확장된 유틸리티 함수

```typescript
// src/lib/utils.ts - 기존 코드 확장
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 조건부 스타일링 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 가격 포맷팅
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원'
}

// 할인율 포맷팅
export function formatDiscountRate(rate: number): string {
  return `${rate}%`
}

// 할인 가격 계산
export function getDiscountedPrice(originalPrice: number, discountRate: number): number {
  return Math.floor(originalPrice * (1 - discountRate / 100))
}

// 날짜 포맷팅
export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dateObj)
    
    case 'long':
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj)
    
    case 'relative':
      return formatRelativeTime(dateObj)
    
    default:
      return dateObj.toLocaleDateString('ko-KR')
  }
}

// 상대적 시간 포맷팅
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return '방금 전'
  } else if (diffMin < 60) {
    return `${diffMin}분 전`
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`
  } else if (diffDay < 7) {
    return `${diffDay}일 전`
  } else {
    return formatDate(date, 'short')
  }
}

// 문자열 자르기
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 이메일 유효성 검사
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 전화번호 포맷팅
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  
  return phone
}

// 랜덤 ID 생성
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 쓰로틀 함수
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 로컬 스토리지 헬퍼
export const storage = {
  get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return defaultValue || null
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

// URL 쿼리 파라미터 헬퍼
export const urlParams = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null
    
    const params = new URLSearchParams(window.location.search)
    return params.get(key)
  },

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    url.searchParams.set(key, value)
    window.history.replaceState({}, '', url.toString())
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return
    
    const url = new URL(window.location.href)
    url.searchParams.delete(key)
    window.history.replaceState({}, '', url.toString())
  }
}

// 파일 크기 포맷팅
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 색상 밝기 계산
export function getColorBrightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  
  return (r * 299 + g * 587 + b * 114) / 1000
}

// 배열 셔플
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 깊은 객체 복사
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}
```

---

## 7. 데이터 타입 변환

### 타입 변환 유틸리티

```typescript
// src/lib/transformers.ts
import { Product, ApiProduct } from '@/types/product'
import { User, ApiUser } from '@/types/user'

// 상품 데이터 변환
export class ProductTransformer {
  static fromApi(apiProduct: ApiProduct): Product {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      brand: apiProduct.brand.name,
      price: apiProduct.price,
      originalPrice: apiProduct.originalPrice,
      discountRate: apiProduct.discountRate,
      category: apiProduct.category.name,
      subcategory: apiProduct.subcategory.name,
      description: apiProduct.description,
      image: this.transformImageUrl(apiProduct.id, 'main'),
      images: this.transformImageUrls(apiProduct.id),
      rating: apiProduct.rating,
      reviewCount: apiProduct.reviewCount,
      sizes: this.transformSizes(apiProduct.sizes),
      colors: this.transformColors(apiProduct.colors),
      isNew: apiProduct.isNew,
      isBest: apiProduct.isBest,
      isOnSale: apiProduct.isOnSale,
      isSoldoutSoon: apiProduct.isSoldoutSoon || apiProduct.stock < 5,
      isSoldout: apiProduct.isSoldout || apiProduct.stock === 0,
      stock: apiProduct.stock,
      createdAt: apiProduct.createdAt,
    }
  }

  static toApi(product: Product): Partial<ApiProduct> {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      discountRate: product.discountRate,
      description: product.description,
      isNew: product.isNew,
      isBest: product.isBest,
      isOnSale: product.isOnSale,
      stock: product.stock,
    }
  }

  private static transformImageUrl(productId: string, type: 'main' | 'sub1' | 'sub2'): string {
    return `/images/products/${productId}/${type}.jpg`
  }

  private static transformImageUrls(productId: string): string[] {
    return [
      this.transformImageUrl(productId, 'main'),
      this.transformImageUrl(productId, 'sub1'),
      this.transformImageUrl(productId, 'sub2'),
    ]
  }

  private static transformSizes(apiSizes?: any[]): any[] {
    if (!apiSizes) {
      return [
        { id: 'S', name: 'S', available: true },
        { id: 'M', name: 'M', available: true },
        { id: 'L', name: 'L', available: true },
        { id: 'XL', name: 'XL', available: true },
      ]
    }
    return apiSizes
  }

  private static transformColors(apiColors?: any[]): any[] {
    if (!apiColors) {
      return [
        { id: 'black', name: '블랙', hex: '#000000', available: true },
        { id: 'white', name: '화이트', hex: '#FFFFFF', available: true },
        { id: 'gray', name: '그레이', hex: '#808080', available: true },
      ]
    }
    return apiColors
  }
}

// 사용자 데이터 변환
export class UserTransformer {
  static fromApi(apiUser: ApiUser): User {
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      phone: apiUser.phone,
      avatar: apiUser.avatar || this.getDefaultAvatar(apiUser.name),
      createdAt: apiUser.createdAt,
      updatedAt: apiUser.updatedAt,
    }
  }

  static toApi(user: User): Partial<ApiUser> {
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    }
  }

  private static getDefaultAvatar(name: string): string {
    // 이름 첫 글자로 기본 아바타 생성
    const firstChar = name.charAt(0).toUpperCase()
    return `https://ui-avatars.com/api/?name=${firstChar}&background=random`
  }
}

// 주문 데이터 변환
export class OrderTransformer {
  static fromApi(apiOrder: any): any {
    return {
      id: apiOrder.id,
      orderNumber: apiOrder.order_number,
      status: this.transformOrderStatus(apiOrder.status),
      items: apiOrder.items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        price: item.price,
        options: {
          size: item.size,
          color: item.color,
        },
      })),
      totalAmount: apiOrder.total_amount,
      shippingAddress: {
        recipient: apiOrder.shipping_address.recipient,
        phone: apiOrder.shipping_address.phone,
        address: apiOrder.shipping_address.address,
        detailAddress: apiOrder.shipping_address.detail_address,
        zipCode: apiOrder.shipping_address.zip_code,
      },
      paymentMethod: apiOrder.payment_method,
      paymentStatus: apiOrder.payment_status,
      createdAt: apiOrder.created_at,
      updatedAt: apiOrder.updated_at,
    }
  }

  private static transformOrderStatus(apiStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': '주문 접수',
      'confirmed': '주문 확인',
      'preparing': '상품 준비중',
      'shipped': '배송중',
      'delivered': '배송 완료',
      'cancelled': '주문 취소',
    }
    return statusMap[apiStatus] || apiStatus
  }
}
```

---

## 8. 성능 최적화

### React Query 통합 (선택적)

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// 커스텀 훅
export function useProducts(params?: any) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  })
}
```

### 이미지 최적화

```typescript
// src/components/OptimizedImage.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          className="transition-opacity duration-300"
          style={{
            opacity: isLoading ? 0 : 1,
          }}
        />
      )}
    </div>
  )
}
```

### 컴포넌트 lazy loading

```typescript
// src/lib/lazyComponents.ts
import { lazy } from 'react'

// 동적 import로 코드 스플리팅
export const LazyProductDetail = lazy(() => import('@/components/shop/ProductDetail'))
export const LazyCartDrawer = lazy(() => import('@/components/shop/CartDrawer'))
export const LazyWishlistModal = lazy(() => import('@/components/shop/WishlistModal'))

// 사용 예제
import { Suspense } from 'react'

function App() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <LazyProductDetail productId="123" />
    </Suspense>
  )
}
```

---

## 9. 개발 환경 설정

### 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id

# Private variables (서버에서만 접근 가능)
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
STRIPE_SECRET_KEY=your_stripe_secret
```

### Next.js 설정

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: true, // Turbopack 활성화 (개발 환경)
  },
  images: {
    domains: ['localhost', 'api.goguma-market.com', 'cdn.goguma-market.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

### TypeScript 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@/services/*": ["./src/services/*"],
      "@/data/*": ["./src/data/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 10. 프로덕션 배포

### 빌드 스크립트

```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "analyze": "ANALYZE=true next build"
  }
}
```

### Docker 설정

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### CI/CD 파이프라인 (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t goguma-market .
      
      - name: Deploy to production
        run: |
          # 실제 배포 스크립트
          echo "Deploying to production..."
```

---

## 사용 예제

### 1. API 클라이언트 사용

```typescript
// 컴포넌트에서 API 사용
import { useEffect, useState } from 'react'
import { productService } from '@/services/productService'
import { errorHandler } from '@/lib/errorHandler'

function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const result = await productService.getProducts()
        setProducts(result.data)
      } catch (error) {
        errorHandler.handle(error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### 2. 유틸리티 함수 활용

```typescript
import { formatPrice, formatDate, cn } from '@/lib/utils'

function ProductPrice({ price, originalPrice, discountRate }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <span className={cn(
          'font-semibold',
          discountRate ? 'text-red-500' : 'text-gray-900'
        )}>
          {formatPrice(price)}
        </span>
        
        {discountRate && (
          <span className="text-sm text-gray-500 line-through">
            {formatPrice(originalPrice)}
          </span>
        )}
      </div>
      
      {discountRate && (
        <span className="text-sm text-red-500">
          {discountRate}% 할인
        </span>
      )}
    </div>
  )
}
```

### 3. 에러 처리 통합

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
```

---

## 마무리

이 가이드를 통해 다음을 구현할 수 있습니다:

1. **완전한 API 통합 시스템** - Axios 기반 HTTP 클라이언트
2. **견고한 에러 처리** - 타입별 에러 분류 및 사용자 알림
3. **효율적인 상태 관리** - Zustand + API 서비스 연동
4. **성능 최적화** - 캐싱, 이미지 최적화, 코드 스플리팅
5. **개발 환경 구성** - TypeScript, 환경 변수, 빌드 설정
6. **프로덕션 배포** - Docker, CI/CD 파이프라인

모든 시스템은 TypeScript로 타입 안전성을 보장하며, 실제 프로덕션 환경에서 확장 가능한 아키텍처로 설계되었습니다.