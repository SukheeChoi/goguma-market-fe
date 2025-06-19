export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginationData<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface Banner {
  id: string
  title: string
  subtitle?: string
  image: string
  link: string
  isActive: boolean
  order: number
}

export interface Brand {
  id: string
  name: string
  logo: string
  description?: string
  isPopular: boolean
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface UIState {
  isLoading: boolean
  error: string | null
  toast: {
    message: string
    type: 'success' | 'error' | 'info'
    isVisible: boolean
  } | null
}