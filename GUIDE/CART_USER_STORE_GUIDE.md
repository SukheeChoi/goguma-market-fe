# 장바구니 및 사용자 상태 관리 가이드

이 문서는 React/Next.js 기반 쇼핑몰에서 장바구니, 위시리스트, 최근 본 상품 등 사용자 상태 관리 기능을 구현하는 방법을 설명합니다.

## 목차
1. [전체 구조 개요](#1-전체-구조-개요)
2. [장바구니 상태 관리 (CartStore)](#2-장바구니-상태-관리-cartstore)
3. [사용자 상태 관리 (UserStore)](#3-사용자-상태-관리-userstore)
4. [장바구니 아이콘 컴포넌트](#4-장바구니-아이콘-컴포넌트)
5. [위시리스트 기능](#5-위시리스트-기능)
6. [최근 본 상품 기능](#6-최근-본-상품-기능)
7. [데이터 영속성 (Persistence)](#7-데이터-영속성-persistence)
8. [인증 연동](#8-인증-연동)
9. [성능 최적화](#9-성능-최적화)

---

## 1. 전체 구조 개요

### 상태 관리 시스템 구성

```
📁 상태 관리 구조
├── 📁 store/
│   ├── useCartStore.ts           # 장바구니 상태 관리
│   ├── useUserStore.ts           # 사용자 상태 관리
│   └── index.ts                  # Store exports
├── 📁 components/ui/
│   └── CartIcon.tsx              # 장바구니 아이콘
├── 📁 services/
│   └── authService.ts            # 인증 API 서비스
└── 📁 lib/
    └── api.ts                    # API 클라이언트
```

### 주요 기능
- **장바구니 관리**: 상품 추가/삭제/수량 변경
- **데이터 영속성**: localStorage를 통한 상태 유지
- **위시리스트**: 관심 상품 저장
- **최근 본 상품**: 상품 조회 히스토리
- **사용자 인증**: 로그인/로그아웃/프로필 관리
- **실시간 동기화**: 상태 변경 시 UI 즉시 업데이트

---

## 2. 장바구니 상태 관리 (CartStore)

### 장바구니 타입 정의

```typescript
// src/types/product.ts
export interface CartItem {
  productId: string
  product: Product
  selectedSize: Size
  selectedColor: Color
  quantity: number
}
```

### CartStore 구현

```typescript
// src/store/useCartStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, Size, Color } from '@/types'

interface CartState {
  items: CartItem[]
  isOpen: boolean
  
  // Actions
  addItem: (product: Product, size: Size, color: Color, quantity?: number) => void
  removeItem: (productId: string, sizeId: string, colorId: string) => void
  updateQuantity: (productId: string, sizeId: string, colorId: string, quantity: number) => void
  clearCart: () => void
  
  // Cart UI
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  
  // Getters
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemCount: (productId: string) => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (product, size, color, quantity = 1) => {
        const { items } = get()
        const existingItemIndex = items.findIndex(
          item => 
            item.productId === product.id && 
            item.selectedSize.id === size.id && 
            item.selectedColor.id === color.id
        )
        
        if (existingItemIndex > -1) {
          // 이미 존재하는 아이템의 수량 증가
          const updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += quantity
          set({ items: updatedItems })
        } else {
          // 새 아이템 추가
          const newItem: CartItem = {
            productId: product.id,
            product,
            selectedSize: size,
            selectedColor: color,
            quantity
          }
          set({ items: [...items, newItem] })
        }
      },
      
      removeItem: (productId, sizeId, colorId) => {
        const { items } = get()
        const updatedItems = items.filter(
          item => !(
            item.productId === productId && 
            item.selectedSize.id === sizeId && 
            item.selectedColor.id === colorId
          )
        )
        set({ items: updatedItems })
      },
      
      updateQuantity: (productId, sizeId, colorId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, sizeId, colorId)
          return
        }
        
        const { items } = get()
        const updatedItems = items.map(item => {
          if (
            item.productId === productId && 
            item.selectedSize.id === sizeId && 
            item.selectedColor.id === colorId
          ) {
            return { ...item, quantity }
          }
          return item
        })
        set({ items: updatedItems })
      },
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
      },
      
      getItemCount: (productId) => {
        const { items } = get()
        return items
          .filter(item => item.productId === productId)
          .reduce((total, item) => total + item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
)
```

**💡 CartStore의 핵심 기능:**
- **중복 상품 처리**: 동일 상품+옵션 시 수량 증가
- **옵션별 구분**: 사이즈/색상이 다르면 별도 아이템
- **실시간 계산**: 총 수량, 총 가격 자동 계산
- **UI 상태**: 장바구니 열림/닫힘 상태 관리
- **데이터 영속성**: localStorage 자동 저장

### 장바구니 사용 예제

```typescript
// 상품 카드에서 장바구니 추가
const { addItem } = useCartStore()

const handleAddToCart = () => {
  const defaultSize = product.sizes.find(size => size.available)
  const defaultColor = product.colors.find(color => color.available)
  
  if (defaultSize && defaultColor) {
    addItem(product, defaultSize, defaultColor, 1)
  }
}

// 장바구니 수량 표시
const { getTotalItems } = useCartStore()
const totalItems = getTotalItems()

return <span>{totalItems}</span>
```

---

## 3. 사용자 상태 관리 (UserStore)

### 사용자 타입 정의

```typescript
// src/services/authService.ts
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}
```

### UserStore 구현

```typescript
// src/store/useUserStore.ts
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
```

**💡 UserStore의 핵심 기능:**
- **인증 상태 관리**: 로그인/로그아웃/회원가입
- **위시리스트**: 관심 상품 저장 및 관리
- **최근 본 상품**: 최대 10개까지 히스토리 유지
- **프로필 관리**: 사용자 정보 수정
- **자동 초기화**: 앱 시작 시 토큰으로 사용자 복원

---

## 4. 장바구니 아이콘 컴포넌트

### CartIcon 구현

```typescript
// src/components/ui/CartIcon.tsx
'use client'

import { useCartStore } from '@/store'
import { useEffect, useState } from 'react'

export default function CartIcon() {
    const { getTotalItems } = useCartStore();
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        setTotalItems(getTotalItems());
    }, [getTotalItems]);

    return (
        <div className="relative">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 576 512"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    fill="#f2f2f2"
                    d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"
                />
            </svg>

            {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
            )}
        </div>
    );
}
```

**💡 CartIcon의 특징:**
- **Hydration 문제 해결**: useEffect로 클라이언트 전용 렌더링
- **실시간 업데이트**: 장바구니 변경 시 즉시 반영
- **배지 표시**: 아이템 개수가 있을 때만 표시
- **접근성**: 적절한 크기와 대비

### 헤더에서 사용

```typescript
// src/components/layout/Header.tsx
import CartIcon from '@/components/ui/CartIcon'

export default function Header() {
  return (
    <header className="w-full bg-black text-white">
      <div className="flex justify-between items-center p-4">
        {/* 로고 등 기존 내용 */}
        
        {/* 오른쪽: 장바구니 아이콘 */}
        <div className="flex items-center space-x-4">
          <CartIcon />
        </div>
      </div>
    </header>
  )
}
```

---

## 5. 위시리스트 기능

### 위시리스트 사용 예제

```typescript
// 상품 카드에서 위시리스트 토글
const { isInWishlist, toggleWishlist } = useUserStore()

const handleWishlistToggle = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  toggleWishlist(product.id)
}

return (
  <button onClick={handleWishlistToggle}>
    <svg 
      className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
      />
    </svg>
  </button>
)
```

### 위시리스트 페이지 구현

```typescript
// src/app/wishlist/page.tsx
'use client'

import { useUserStore } from '@/store'
import { useProductStore } from '@/store'
import { ProductGrid } from '@/components/shop'
import { useEffect, useMemo } from 'react'

export default function WishlistPage() {
  const { wishlist, isAuthenticated } = useUserStore()
  const { products, fetchProducts } = useProductStore()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const wishlistProducts = useMemo(() => {
    return products.filter(product => wishlist.includes(product.id))
  }, [products, wishlist])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
        <p>위시리스트를 보려면 먼저 로그인해주세요.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">위시리스트</h1>
      
      {wishlistProducts.length > 0 ? (
        <ProductGrid products={wishlistProducts} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">위시리스트가 비어있습니다.</p>
        </div>
      )}
    </div>
  )
}
```

---

## 6. 최근 본 상품 기능

### 최근 본 상품 자동 추가

```typescript
// 상품 상세 페이지에서 자동 추가
const { addToRecentlyViewed } = useUserStore()

useEffect(() => {
  if (selectedProduct) {
    addToRecentlyViewed(productId)
  }
}, [selectedProduct, productId, addToRecentlyViewed])
```

### 최근 본 상품 컴포넌트

```typescript
// src/components/shop/RecentlyViewed.tsx
'use client'

import { useUserStore } from '@/store'
import { useProductStore } from '@/store'
import { ProductCard } from '@/components/shop'
import { useMemo } from 'react'

export default function RecentlyViewed() {
  const { recentlyViewed } = useUserStore()
  const { products } = useProductStore()

  const recentProducts = useMemo(() => {
    return recentlyViewed
      .map(id => products.find(product => product.id === id))
      .filter(Boolean)
      .slice(0, 4) // 최대 4개만 표시
  }, [recentlyViewed, products])

  if (recentProducts.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-6">최근 본 상품</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
```

---

## 7. 데이터 영속성 (Persistence)

### Zustand Persist 설정

```typescript
// persist 미들웨어 사용
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // store 구현
    }),
    {
      name: 'cart-storage', // localStorage 키 이름
      partialize: (state) => ({ items: state.items }) // 저장할 상태만 선택
    }
  )
)
```

### 저장되는 데이터 구조

```javascript
// localStorage에 저장되는 데이터
{
  "cart-storage": {
    "state": {
      "items": [
        {
          "productId": "1",
          "product": { /* 상품 정보 */ },
          "selectedSize": { /* 선택된 사이즈 */ },
          "selectedColor": { /* 선택된 색상 */ },
          "quantity": 2
        }
      ]
    },
    "version": 0
  }
}
```

**💡 영속성 관리의 핵심:**
- **선택적 저장**: 민감하지 않은 데이터만 저장
- **버전 관리**: Zustand가 자동으로 스키마 변경 감지
- **자동 복원**: 페이지 새로고침 시 자동으로 상태 복원
- **용량 관리**: 불필요한 데이터는 제외

---

## 8. 인증 연동

### 로그인 상태에 따른 동작

```typescript
// 위시리스트는 로그인 사용자만 이용 가능
const { isAuthenticated, toggleWishlist } = useUserStore()

const handleWishlist = () => {
  if (!isAuthenticated) {
    alert('로그인이 필요한 서비스입니다.')
    return
  }
  toggleWishlist(productId)
}
```

### 로그아웃 시 데이터 정리

```typescript
// UserStore의 logout 함수
logout: async () => {
  try {
    await authService.logout()
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // 개인정보 관련 데이터만 정리
    set({ 
      user: null, 
      isAuthenticated: false, 
      wishlist: [], 
      recentlyViewed: [] 
    })
  }
}
```

**💡 개인정보 보호:**
- 로그아웃 시 위시리스트, 최근 본 상품 정리
- 장바구니는 비회원도 사용 가능하므로 유지
- 토큰은 별도 관리하여 보안 강화

---

## 9. 성능 최적화

### 1. 메모이제이션 활용

```typescript
// 계산 결과 캐싱
const totalPrice = useMemo(() => {
  return items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
}, [items])

const wishlistProducts = useMemo(() => {
  return products.filter(product => wishlist.includes(product.id))
}, [products, wishlist])
```

### 2. 배치 업데이트

```typescript
// 여러 상태를 한 번에 업데이트
set(state => ({
  ...state,
  items: updatedItems,
  lastUpdated: Date.now()
}))
```

### 3. 구독 최적화

```typescript
// 필요한 상태만 구독
const totalItems = useCartStore(state => state.getTotalItems())
const isInWishlist = useUserStore(state => state.isInWishlist)
```

### 4. 디바운싱

```typescript
// 검색어 디바운싱
import { useDebouncedCallback } from 'use-debounce'

const debouncedSearch = useDebouncedCallback(
  (searchTerm: string) => {
    searchProducts(searchTerm)
  },
  300
)
```

---

## Store 통합 Export

```typescript
// src/store/index.ts
export { useCartStore } from './useCartStore'
export { useUserStore } from './useUserStore'
export { useProductStore } from './useProductStore'

// 타입도 함께 export
export type { CartItem } from '@/types'
```

---

## 사용 예제

### 1. 상품 카드에서 모든 기능 사용

```typescript
import { useCartStore, useUserStore } from '@/store'

function ProductCard({ product }) {
  const { addItem } = useCartStore()
  const { toggleWishlist, isInWishlist } = useUserStore()
  
  const handleAddToCart = () => {
    const defaultSize = product.sizes.find(size => size.available)
    const defaultColor = product.colors.find(color => color.available)
    addItem(product, defaultSize, defaultColor, 1)
  }
  
  const handleWishlist = () => {
    toggleWishlist(product.id)
  }
  
  return (
    <div>
      <button onClick={handleAddToCart}>장바구니 추가</button>
      <button onClick={handleWishlist}>
        {isInWishlist(product.id) ? '♥' : '♡'}
      </button>
    </div>
  )
}
```

### 2. 헤더에서 상태 표시

```typescript
function Header() {
  const { getTotalItems } = useCartStore()
  const { user, isAuthenticated } = useUserStore()
  
  return (
    <header>
      <div>장바구니 ({getTotalItems()})</div>
      {isAuthenticated ? (
        <div>안녕하세요, {user?.name}님</div>
      ) : (
        <div>로그인</div>
      )}
    </header>
  )
}
```

### 3. 조건부 기능 제공

```typescript
function WishlistButton({ productId }) {
  const { isAuthenticated, toggleWishlist, isInWishlist } = useUserStore()
  
  if (!isAuthenticated) {
    return <Link href="/login">로그인 후 이용 가능</Link>
  }
  
  return (
    <button onClick={() => toggleWishlist(productId)}>
      {isInWishlist(productId) ? '위시리스트에서 제거' : '위시리스트에 추가'}
    </button>
  )
}
```

---

## 테스트 가이드

### 1. 장바구니 테스트

```typescript
// 장바구니 기능 테스트
describe('CartStore', () => {
  test('상품 추가', () => {
    const { addItem, getTotalItems } = useCartStore.getState()
    addItem(mockProduct, mockSize, mockColor, 1)
    expect(getTotalItems()).toBe(1)
  })
  
  test('중복 상품 수량 증가', () => {
    const { addItem, items } = useCartStore.getState()
    addItem(mockProduct, mockSize, mockColor, 1)
    addItem(mockProduct, mockSize, mockColor, 1)
    expect(items[0].quantity).toBe(2)
  })
})
```

### 2. 위시리스트 테스트

```typescript
describe('UserStore', () => {
  test('위시리스트 토글', () => {
    const { toggleWishlist, isInWishlist } = useUserStore.getState()
    toggleWishlist('product-1')
    expect(isInWishlist('product-1')).toBe(true)
    toggleWishlist('product-1')
    expect(isInWishlist('product-1')).toBe(false)
  })
})
```

---

## 마무리

이 가이드를 통해 다음을 구현할 수 있습니다:

1. **완전한 장바구니 시스템** - 추가/삭제/수량변경
2. **위시리스트 기능** - 관심 상품 저장
3. **최근 본 상품** - 사용자 히스토리 관리
4. **데이터 영속성** - 새로고침 후에도 유지
5. **인증 연동** - 로그인 상태에 따른 기능 제한
6. **성능 최적화** - 메모이제이션과 효율적인 렌더링

모든 상태 관리는 Zustand를 기반으로 하며, TypeScript로 타입 안전성을 보장합니다. 실제 프로덕션 환경에서 바로 사용할 수 있는 완성도 높은 코드입니다.