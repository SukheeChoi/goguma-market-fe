import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, type User as AuthUser } from '@/services/authService'
import { setAuthToken, initializeAuth } from '@/lib/api'

interface UserState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  wishlist: string[]
  recentlyViewed: string[]
  
  // Actions
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>
  logout: () => Promise<void>
  loadCurrentUser: () => Promise<void>
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  
  addToWishlist: (productId: string) => void
  removeFromWishlist: (productId: string) => void
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  
  addToRecentlyViewed: (productId: string) => void
  clearRecentlyViewed: () => void
  
  // Initialization
  initialize: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      wishlist: [],
      recentlyViewed: [],
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      
      // 로그인
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.login({ email, password })
          const user: AuthUser = {
            id: response.id,
            name: response.name,
            email: response.email,
            phone: response.phone,
            avatar: response.avatar,
            createdAt: '',
            updatedAt: ''
          }
          set({ user, isAuthenticated: true })
        } catch (error) {
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      // 회원가입
      signup: async (name: string, email: string, password: string, phone?: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.signup({ name, email, password, phone })
          const user: AuthUser = {
            id: response.id,
            name: response.name,
            email: response.email,
            phone: response.phone,
            avatar: response.avatar,
            createdAt: '',
            updatedAt: ''
          }
          set({ user, isAuthenticated: true })
        } catch (error) {
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      // 로그아웃
      logout: async () => {
        try {
          await authService.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ user: null, isAuthenticated: false, wishlist: [], recentlyViewed: [] })
        }
      },
      
      // 현재 사용자 정보 로드
      loadCurrentUser: async () => {
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false })
          return
        }
        
        try {
          const user = await authService.getCurrentUser()
          set({ user, isAuthenticated: true })
        } catch (error) {
          console.error('Load current user error:', error)
          set({ user: null, isAuthenticated: false })
        }
      },
      
      // 프로필 업데이트
      updateProfile: async (data: { name?: string; phone?: string; avatar?: string }) => {
        set({ isLoading: true })
        try {
          const updatedUser = await authService.updateProfile(data)
          set({ user: updatedUser })
        } catch (error) {
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      // 비밀번호 변경
      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true })
        try {
          await authService.changePassword({ currentPassword, newPassword })
        } catch (error) {
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      // 초기화
      initialize: async () => {
        initializeAuth()
        await get().loadCurrentUser()
      },
      
      addToWishlist: (productId) => {
        const { wishlist } = get()
        if (!wishlist.includes(productId)) {
          set({ wishlist: [...wishlist, productId] })
        }
      },
      
      removeFromWishlist: (productId) => {
        const { wishlist } = get()
        set({ wishlist: wishlist.filter(id => id !== productId) })
      },
      
      toggleWishlist: (productId) => {
        const { wishlist } = get()
        if (wishlist.includes(productId)) {
          get().removeFromWishlist(productId)
        } else {
          get().addToWishlist(productId)
        }
      },
      
      isInWishlist: (productId) => {
        const { wishlist } = get()
        return wishlist.includes(productId)
      },
      
      addToRecentlyViewed: (productId) => {
        const { recentlyViewed } = get()
        const updated = [productId, ...recentlyViewed.filter(id => id !== productId)].slice(0, 10)
        set({ recentlyViewed: updated })
      },
      
      clearRecentlyViewed: () => set({ recentlyViewed: [] })
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ 
        user: state.user,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed
      })
    }
  )
)