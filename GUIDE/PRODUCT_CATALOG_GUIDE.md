# 상품 카탈로그 및 상품 상세 기능 개발 가이드

이 문서는 React/Next.js 기반 쇼핑몰에서 상품 카탈로그, 상품 상세, 검색 및 필터링 기능을 구현하는 방법을 설명합니다.

## 목차
1. [전체 구조 개요](#1-전체-구조-개요)
2. [상품 타입 및 데이터 구조](#2-상품-타입-및-데이터-구조)
3. [상품 상태 관리 (ProductStore)](#3-상품-상태-관리-productstore)
4. [상품 API 서비스](#4-상품-api-서비스)
5. [카테고리 네비게이션](#5-카테고리-네비게이션)
6. [상품 카드 컴포넌트](#6-상품-카드-컴포넌트)
7. [상품 그리드 및 리스트](#7-상품-그리드-및-리스트)
8. [검색 기능](#8-검색-기능)
9. [상품 상세 페이지](#9-상품-상세-페이지)
10. [필터링 및 정렬](#10-필터링-및-정렬)

---

## 1. 전체 구조 개요

### 상품 카탈로그 시스템 구성

```
📁 상품 카탈로그 구조
├── 📁 types/product.ts           # 상품 관련 타입 정의
├── 📁 data/
│   ├── products.ts               # Mock 상품 데이터
│   ├── categories.ts             # 카테고리 데이터
│   └── brands.ts                 # 브랜드 데이터
├── 📁 store/useProductStore.ts   # 상품 상태 관리
├── 📁 services/productService.ts # 상품 API 서비스
├── 📁 components/shop/
│   ├── ProductCard.tsx           # 상품 카드
│   ├── ProductGrid.tsx           # 상품 그리드
│   └── CategoryNav.tsx           # 카테고리 네비게이션
├── 📁 components/ui/
│   ├── SearchBar.tsx             # 검색바
│   └── Badge.tsx                 # 배지 컴포넌트
└── 📁 app/
    ├── page.tsx                  # 메인 상품 목록
    └── product/[id]/page.tsx     # 상품 상세 페이지
```

### 주요 기능
- **상품 목록 표시**: 그리드 형태의 상품 카탈로그
- **카테고리 네비게이션**: 카테고리별 상품 필터링
- **검색 기능**: 상품명, 브랜드명으로 검색
- **정렬 기능**: 인기순, 최신순, 가격순, 평점순
- **상품 상세**: 이미지, 옵션 선택, 장바구니 추가
- **위시리스트**: 관심 상품 저장
- **배지 시스템**: NEW, BEST, SALE 등 표시

---

## 2. 상품 타입 및 데이터 구조

### 핵심 타입 정의

```typescript
// src/types/product.ts

// 백엔드 API 응답 타입
export interface ApiProduct {
  id: string
  name: string
  brand: {
    id: string
    name: string
    description: string
  }
  price: number
  originalPrice?: number
  discountRate?: number
  category: {
    id: string
    name: string
  }
  subcategory: {
    id: string
    name: string
  }
  description: string
  rating: number
  reviewCount: number
  isNew: boolean
  isBest: boolean
  isOnSale: boolean
  isSoldoutSoon?: boolean
  isSoldout?: boolean
  stock: number
  createdAt: string
}

// 프론트엔드에서 사용하는 Product 타입
export interface Product {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  discountRate?: number
  images: string[]
  category: string
  subcategory?: string
  description: string
  sizes: Size[]
  colors: Color[]
  tags: string[]
  rating: number
  reviewCount: number
  isNew: boolean
  isBest: boolean
  isOnSale: boolean
  stock: number
  isSoldoutSoon?: boolean
  isEvent?: boolean
  isSoldout?: boolean
  createdAt: string
}

// 사이즈 정보
export interface Size {
  id: string
  name: string
  available: boolean
}

// 색상 정보
export interface Color {
  id: string
  name: string
  code: string
  available: boolean
}

// 카테고리 정보
export interface Category {
  id: string
  name: string
  subcategories?: Category[]
}

// 필터 조건
export interface ProductFilter {
  category?: string
  brands?: string[]
  priceRange?: {
    min: number
    max: number
  }
  sizes?: string[]
  colors?: string[]
  tags?: string[]
}

// 정렬 옵션
export type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating'
```

**💡 타입 설계의 핵심:**
- API 응답 타입과 UI 타입 분리
- 옵셔널 프로퍼티로 유연성 확보
- 배지 시스템을 위한 boolean 플래그들

### 카테고리 데이터 구조

```typescript
// src/data/categories.ts
import { Category } from '@/types'

export const categories: Category[] = [
  {
    id: 'men',
    name: '남성',
    subcategories: [
      { id: 'men-tops', name: '상의' },
      { id: 'men-bottoms', name: '하의' },
      { id: 'men-outer', name: '아우터' },
      { id: 'men-shoes', name: '신발' },
      { id: 'men-accessories', name: '액세서리' }
    ]
  },
  {
    id: 'women',
    name: '여성',
    subcategories: [
      { id: 'women-tops', name: '상의' },
      { id: 'women-bottoms', name: '하의' },
      { id: 'women-outer', name: '아우터' },
      { id: 'women-shoes', name: '신발' },
      { id: 'women-accessories', name: '액세서리' }
    ]
  },
  {
    id: 'sports',
    name: '스포츠',
    subcategories: [
      { id: 'sports-wear', name: '스포츠웨어' },
      { id: 'sports-shoes', name: '운동화' },
      { id: 'sports-equipment', name: '운동용품' }
    ]
  },
  {
    id: 'bags',
    name: '가방',
    subcategories: [
      { id: 'backpack', name: '백팩' },
      { id: 'crossbag', name: '크로스백' },
      { id: 'totebag', name: '토트백' }
    ]
  }
]
```

---

## 3. 상품 상태 관리 (ProductStore)

```typescript
// src/store/useProductStore.ts
import { create } from 'zustand'
import { Product, ProductFilter, SortOption } from '@/types'
import { productService, ProductQuery } from '@/services/productService'

interface ProductState {
  // 상품 데이터
  products: Product[]
  filteredProducts: Product[]
  selectedProduct: Product | null
  
  // 필터 및 정렬
  filters: ProductFilter
  sortOption: SortOption
  
  // 로딩 상태
  isLoading: boolean
  error: string | null
  
  // 페이지네이션
  pagination: {
    page: number
    limit: number
    total: number
  }

  // Actions
  setProducts: (products: Product[]) => void
  setSelectedProduct: (product: Product | null) => void
  getProductById: (id: string) => Product | undefined
  fetchProducts: (query?: ProductQuery) => Promise<void>
  fetchProductById: (id: string) => Promise<void>
  
  // 필터 및 정렬
  setFilters: (filters: Partial<ProductFilter>) => void
  setSortOption: (option: SortOption) => void
  clearFilters: () => void
  
  // 검색
  searchProducts: (query: string) => void
  
  // 상태 관리
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 페이지네이션
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  
  // 헬퍼 함수
  applySorting: (products: Product[], sortOption: SortOption) => Product[]
}

export const useProductStore = create<ProductState>((set, get) => ({
  // 초기 상태
  products: [],
  filteredProducts: [],
  selectedProduct: null,
  
  filters: {},
  sortOption: 'popular',
  
  isLoading: false,
  error: null,
  
  pagination: {
    page: 1,
    limit: 12,
    total: 0
  },

  // Actions
  setProducts: (products) => set({ products, filteredProducts: products }),
  
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  
  getProductById: (id) => {
    const { products } = get()
    return products.find(product => product.id === id)
  },

  // API 호출 함수들
  fetchProducts: async (query = {}) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await productService.getProducts(query)
      const { products, total, page, limit } = response
      
      set({
        products,
        filteredProducts: products,
        pagination: { page, limit, total },
        isLoading: false
      })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : '상품을 불러오는데 실패했습니다.' 
      })
    }
  },

  fetchProductById: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const product = await productService.getProductById(id)
      
      set({
        selectedProduct: product,
        isLoading: false
      })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : '상품을 불러오는데 실패했습니다.' 
      })
    }
  },
  
  setFilters: (newFilters) => {
    const { filters, products, sortOption } = get()
    const updatedFilters = { ...filters, ...newFilters }
    
    let filtered = [...products]
    
    // 카테고리 필터
    if (updatedFilters.category) {
      filtered = filtered.filter(product => 
        product.category === updatedFilters.category ||
        product.subcategory === updatedFilters.category
      )
    }
    
    // 브랜드 필터
    if (updatedFilters.brands && updatedFilters.brands.length > 0) {
      filtered = filtered.filter(product => 
        updatedFilters.brands!.includes(product.brand)
      )
    }
    
    // 가격 범위 필터
    if (updatedFilters.priceRange) {
      const { min, max } = updatedFilters.priceRange
      filtered = filtered.filter(product => 
        product.price >= min && product.price <= max
      )
    }
    
    // 태그 필터
    if (updatedFilters.tags && updatedFilters.tags.length > 0) {
      filtered = filtered.filter(product =>
        updatedFilters.tags!.some(tag => product.tags.includes(tag))
      )
    }
    
    // 정렬 적용
    filtered = get().applySorting(filtered, sortOption)
    
    set({ 
      filters: updatedFilters, 
      filteredProducts: filtered,
      pagination: { ...get().pagination, page: 1, total: filtered.length }
    })
  },
  
  setSortOption: (option) => {
    const { filteredProducts } = get()
    const sorted = get().applySorting([...filteredProducts], option)
    set({ sortOption: option, filteredProducts: sorted })
  },
  
  clearFilters: () => {
    const { products } = get()
    set({ 
      filters: {}, 
      filteredProducts: products,
      pagination: { ...get().pagination, page: 1, total: products.length }
    })
  },
  
  searchProducts: (query) => {
    const { products } = get()
    if (!query.trim()) {
      set({ filteredProducts: products })
      return
    }
    
    const searchResults = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.brand.toLowerCase().includes(query.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )
    
    set({ 
      filteredProducts: searchResults,
      pagination: { ...get().pagination, page: 1, total: searchResults.length }
    })
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  setPage: (page) => set(state => ({ 
    pagination: { ...state.pagination, page } 
  })),
  
  setLimit: (limit) => set(state => ({ 
    pagination: { ...state.pagination, limit, page: 1 } 
  })),
  
  // 정렬 헬퍼 함수
  applySorting: (products: Product[], sortOption: SortOption): Product[] => {
    switch (sortOption) {
      case 'newest':
        return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'price-low':
        return products.sort((a, b) => a.price - b.price)
      case 'price-high':
        return products.sort((a, b) => b.price - a.price)
      case 'rating':
        return products.sort((a, b) => b.rating - a.rating)
      case 'popular':
      default:
        return products.sort((a, b) => b.reviewCount - a.reviewCount)
    }
  }
}))
```

**💡 상품 스토어의 핵심:**
- 필터링과 정렬 로직 분리
- API 호출과 로컬 상태 관리 구분
- 페이지네이션 상태 관리
- 에러 및 로딩 상태 처리

---

## 4. 상품 API 서비스

```typescript
// src/services/productService.ts
import { apiClient } from '@/lib/api'
import { Product, ApiProduct } from '@/types'

// 백엔드 API 응답 타입
export interface ApiProductsResponse {
  content: ApiProduct[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalPages: number
  totalElements: number
  first: boolean
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  numberOfElements: number
  empty: boolean
}

// 프론트엔드에서 사용하는 응답 타입
export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductQuery {
  page?: number
  limit?: number
  category?: string
  brand?: string
  search?: string
  sort?: string
  minPrice?: number
  maxPrice?: number
}

// API 응답을 프론트엔드 타입으로 변환하는 함수
const convertApiProductToProduct = (apiProduct: ApiProduct): Product => {
  const product: Product = {
    id: apiProduct.id,
    name: apiProduct.name,
    brand: apiProduct.brand.name,
    price: apiProduct.price,
    images: ['/products/placeholder.jpg'], // 기본 이미지 설정
    category: apiProduct.category.id,
    description: apiProduct.description,
    sizes: [], // 백엔드에서 사이즈 정보가 없으므로 빈 배열
    colors: [], // 백엔드에서 색상 정보가 없으므로 빈 배열
    tags: [], // 백엔드에서 태그 정보가 없으므로 빈 배열
    rating: apiProduct.rating,
    reviewCount: apiProduct.reviewCount,
    isNew: apiProduct.isNew,
    isBest: apiProduct.isBest,
    isOnSale: apiProduct.isOnSale,
    stock: apiProduct.stock,
    createdAt: apiProduct.createdAt
  }

  // 선택적 속성들 추가
  if (apiProduct.originalPrice) {
    product.originalPrice = apiProduct.originalPrice
  }
  if (apiProduct.discountRate) {
    product.discountRate = apiProduct.discountRate
  }
  if (apiProduct.subcategory) {
    product.subcategory = apiProduct.subcategory.id
  }
  if (apiProduct.isSoldoutSoon) {
    product.isSoldoutSoon = apiProduct.isSoldoutSoon
  }
  if (apiProduct.isSoldout) {
    product.isSoldout = apiProduct.isSoldout
  }

  return product
}

export const productService = {
  // 전체 상품 조회
  async getProducts(query: ProductQuery = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })
    
    const response: ApiProductsResponse = await apiClient.get(`/products?${params.toString()}`)
    
    return {
      products: response.content.map(convertApiProductToProduct),
      total: response.totalElements,
      page: response.number + 1, // 백엔드는 0부터 시작, 프론트엔드는 1부터 시작
      limit: response.size,
      totalPages: response.totalPages
    }
  },

  // 상품 상세 조회
  async getProductById(id: string): Promise<Product> {
    const response: ApiProduct = await apiClient.get(`/products/${id}`)
    return convertApiProductToProduct(response)
  },

  // 카테고리별 상품 조회
  async getProductsByCategory(category: string, query: Omit<ProductQuery, 'category'> = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...query, category })
  },

  // 브랜드별 상품 조회
  async getProductsByBrand(brand: string, query: Omit<ProductQuery, 'brand'> = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...query, brand })
  },

  // 상품 검색
  async searchProducts(search: string, query: Omit<ProductQuery, 'search'> = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...query, search })
  },
}
```

**💡 API 서비스의 특징:**
- 백엔드 응답을 프론트엔드 타입으로 변환
- 쿼리 파라미터 동적 생성
- 페이지 번호 변환 (0-based ↔ 1-based)
- 재사용 가능한 함수 구조

---

## 5. 카테고리 네비게이션

```typescript
// src/components/shop/CategoryNav.tsx
'use client'

import { useState } from 'react'
import { categories } from '@/data'
import { useProductStore } from '@/store'

export default function CategoryNav() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { setFilters } = useProductStore()
  
  const handleCategoryClick = (categoryId: string) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null)
      setFilters({ category: undefined })
    } else {
      setActiveCategory(categoryId)
      setFilters({ category: categoryId })
    }
  }
  
  return (
    <div className="border-b border-gray-200">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8 overflow-x-auto">
          <button
            onClick={() => {
              setActiveCategory(null)
              setFilters({ category: undefined })
            }}
            className={`flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeCategory === null
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            전체
          </button>
          
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeCategory === category.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
```

**💡 카테고리 네비게이션의 특징:**
- 활성 상태 시각적 표시
- 토글 방식으로 필터 해제 가능
- 반응형 디자인 (overflow-x-auto)
- 상태 관리와 분리된 UI 로직

---

## 6. 상품 카드 컴포넌트

```typescript
// src/components/shop/ProductCard.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { Badge, Button, NewBadge } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { useCartStore, useUserStore } from '@/store'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { isInWishlist, toggleWishlist } = useUserStore()
  const [isImageLoading, setIsImageLoading] = useState(true)
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 기본 사이즈와 컬러 선택 (첫 번째 사용 가능한 옵션)
    const defaultSize = product.sizes.find(size => size.available)
    const defaultColor = product.colors.find(color => color.available)
    
    if (defaultSize && defaultColor) {
      addItem(product, defaultSize, defaultColor, 1)
    }
  }
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
  }
  
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {/* 배지들 */}
          <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
            {product.isNew && <Badge variant="new">NEW</Badge>}
            {product.isBest && <Badge variant="best">BEST</Badge>}
            {product.isOnSale && <Badge variant="sale">SALE</Badge>}
            {product.isSoldoutSoon && <NewBadge text="품절임박" type="soldout-soon" />}
            {product.isEvent && <NewBadge text="이벤트" type="event" />}
            {product.isSoldout && <NewBadge text="품절" type="soldout" />}
          </div>
          
          {/* 위시리스트 버튼 */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
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
          
          {/* 상품 이미지 */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              isImageLoading ? 'blur-sm' : 'blur-0'
            }`}
            onLoad={() => setIsImageLoading(false)}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* 호버 시 장바구니 버튼 */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={handleAddToCart}
              className="w-full"
              size="sm"
            >
              장바구니 담기
            </Button>
          </div>
        </div>
        
        {/* 상품 정보 */}
        <div className="mt-3 space-y-1">
          <p className="text-sm text-gray-500">{product.brand}</p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          
          <div className="flex items-center gap-2">
            {product.originalPrice && product.discountRate ? (
              <>
                <span className="text-sm font-bold text-red-600">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="text-xs text-red-600 font-medium">
                  {product.discountRate}%
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          {/* 평점 및 리뷰 */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs text-gray-500 ml-1">
                {product.rating} ({product.reviewCount})
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

**💡 상품 카드의 핵심 기능:**
- 호버 효과로 사용자 경험 개선
- 배지 시스템으로 상품 상태 표시
- 위시리스트 토글 기능
- 이미지 로딩 상태 처리
- 빠른 장바구니 추가 기능

---

## 7. 상품 그리드 및 리스트

```typescript
// src/components/shop/ProductGrid.tsx
'use client'

import { Product } from '@/types'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[] | undefined
  isLoading?: boolean
}

export default function ProductGrid({ products, isLoading = false }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg 
          className="w-12 h-12 text-gray-400 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">상품이 없습니다</h3>
        <p className="text-sm text-gray-500">다른 조건으로 검색해보세요.</p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

**💡 상품 그리드의 특징:**
- 반응형 그리드 레이아웃
- 로딩 상태 스켈레톤 UI
- 빈 상태 처리
- 안전한 렌더링 (옵셔널 체이닝)

---

## 8. 검색 기능

```typescript
// src/components/ui/SearchBar.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
}

export default function SearchBar({ 
  placeholder = '검색어를 입력하세요',
  onSearch,
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(query)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg 
            className="w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              onSearch('')
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <svg 
              className="w-4 h-4 text-gray-400 hover:text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  )
}
```

### 메인 페이지에서 검색 사용

```typescript
// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ProductGrid } from '@/components/shop'
import { SearchBar, Button } from '@/components/ui'
import { useProductStore } from '@/store'
import { SortOption } from '@/types'

export default function MainShopPage() {
  const { 
    filteredProducts, 
    isLoading, 
    error,
    sortOption,
    searchProducts,
    setSortOption,
    clearFilters,
    fetchProducts
  } = useProductStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popular', label: '인기순' },
    { value: 'newest', label: '최신순' },
    { value: 'price-low', label: '가격 낮은순' },
    { value: 'price-high', label: '가격 높은순' },
    { value: 'rating', label: '평점순' }
  ]
  
  // 컴포넌트 마운트 시 상품 데이터 불러오기
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    searchProducts(query)
  }
  
  // 에러 상태 표시
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-600 text-center">오류가 발생했습니다: {error}</p>
        <Button onClick={() => fetchProducts()}>다시 시도</Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* 검색 및 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-96">
          <SearchBar
            placeholder="브랜드, 상품명으로 검색"
            onSearch={handleSearch}
          />
        </div>
        
        <div className="flex items-center gap-4">
          {/* 정렬 옵션 */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* 필터 초기화 */}
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            필터 초기화
          </Button>
        </div>
      </div>
      
      {/* 검색 결과 정보 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {searchQuery ? (
            <span>'{searchQuery}' 검색결과 {filteredProducts?.length || 0}개</span>
          ) : (
            <span>전체 {filteredProducts?.length || 0}개 상품</span>
          )}
        </div>
      </div>
      
      {/* 상품 그리드 */}
      <ProductGrid products={filteredProducts} isLoading={isLoading} />
      
      {/* 더 보기 버튼 (향후 페이지네이션 구현) */}
      {filteredProducts && filteredProducts.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline">
            더 많은 상품 보기
          </Button>
        </div>
      )}
    </div>
  )
}
```

**💡 검색 기능의 특징:**
- 실시간 검색어 입력
- 검색 결과 개수 표시
- 검색어 클리어 기능
- 키보드 엔터 지원
- 아이콘으로 UX 개선

---

## 9. 상품 상세 페이지

```typescript
// src/app/product/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Size, Color } from '@/types'
import { Button, Badge } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { useProductStore, useCartStore, useUserStore } from '@/store'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  
  const { selectedProduct, isLoading, error, fetchProductById } = useProductStore()
  const { addItem } = useCartStore()
  const { isInWishlist, toggleWishlist, addToRecentlyViewed } = useUserStore()
  
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  
  useEffect(() => {
    fetchProductById(productId)
  }, [productId, fetchProductById])

  useEffect(() => {
    if (selectedProduct) {
      setSelectedSize(selectedProduct.sizes.find(size => size.available) || null)
      setSelectedColor(selectedProduct.colors.find(color => color.available) || null)
      addToRecentlyViewed(productId)
    }
  }, [selectedProduct, productId, addToRecentlyViewed])
  
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>상품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchProductById(productId)}>다시 시도</Button>
        </div>
      </div>
    )
  }

  // 상품이 없는 경우
  if (!selectedProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
          <Button onClick={() => router.back()}>
            이전 페이지로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  const product = selectedProduct
  
  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert('사이즈와 색상을 선택해주세요.')
      return
    }
    
    addItem(product, selectedSize, selectedColor, quantity)
    alert('장바구니에 추가되었습니다.')
  }
  
  const handleBuyNow = () => {
    if (!selectedSize || !selectedColor) {
      alert('사이즈와 색상을 선택해주세요.')
      return
    }
    
    addItem(product, selectedSize, selectedColor, quantity)
    // TODO: 구매 페이지로 이동
    alert('구매 기능은 추후 구현 예정입니다.')
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 뒤로 가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        뒤로 가기
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 상품 이미지 */}
        <div className="space-y-4">
          {/* 메인 이미지 */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={product.images[selectedImageIndex]}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* 썸네일 이미지들 */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? 'border-black' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* 상품 정보 */}
        <div className="space-y-6">
          {/* 브랜드 및 상품명 */}
          <div>
            <p className="text-lg text-gray-600 mb-2">{product.brand}</p>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          </div>
          
          {/* 배지들 */}
          <div className="flex gap-2">
            {product.isNew && <Badge variant="new">NEW</Badge>}
            {product.isBest && <Badge variant="best">BEST</Badge>}
            {product.isOnSale && <Badge variant="sale">SALE</Badge>}
          </div>
          
          {/* 가격 */}
          <div className="space-y-2">
            {product.originalPrice && product.discountRate ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                </div>
                <p className="text-red-600 font-medium">
                  {product.discountRate}% 할인
                </p>
              </>
            ) : (
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          {/* 평점 및 리뷰 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {product.rating}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              리뷰 {product.reviewCount}개
            </span>
          </div>
          
          {/* 색상 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">색상</h3>
            <div className="flex gap-2">
              {product.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => color.available && setSelectedColor(color)}
                  disabled={!color.available}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor?.id === color.id
                      ? 'border-black'
                      : 'border-gray-300'
                  } ${!color.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: color.code }}
                  title={color.name}
                />
              ))}
            </div>
            {selectedColor && (
              <p className="text-sm text-gray-600 mt-2">선택된 색상: {selectedColor.name}</p>
            )}
          </div>
          
          {/* 사이즈 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">사이즈</h3>
            <div className="grid grid-cols-6 gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => size.available && setSelectedSize(size)}
                  disabled={!size.available}
                  className={`px-3 py-2 border text-sm font-medium rounded-md ${
                    selectedSize?.id === size.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  } ${!size.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 수량 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">수량</h3>
            <div className="flex items-center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 border border-gray-300 rounded-l-md hover:bg-gray-50"
              >
                -
              </button>
              <span className="px-4 py-2 border-t border-b border-gray-300 bg-white text-center min-w-[60px]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 border border-gray-300 rounded-r-md hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>
          
          {/* 구매 버튼들 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1"
              >
                장바구니 담기
              </Button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <svg 
                  className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
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
            </div>
            <Button
              onClick={handleBuyNow}
              className="w-full"
            >
              바로 구매하기
            </Button>
          </div>
          
          {/* 상품 설명 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">상품 설명</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>
          
          {/* 태그 */}
          {product.tags.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">태그</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**💡 상품 상세 페이지의 특징:**
- 이미지 갤러리 (썸네일 + 메인)
- 옵션 선택 (색상, 사이즈, 수량)
- 다양한 구매 액션 (장바구니, 위시리스트, 바로구매)
- 상품 정보 상세 표시
- 로딩 및 에러 상태 처리
- 최근 본 상품에 자동 추가

---

## 10. 필터링 및 정렬

### 유틸리티 함수

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원'
}

export function formatDiscountRate(rate: number): string {
  return `${rate}%`
}

export function getDiscountedPrice(originalPrice: number, discountRate: number): number {
  return Math.floor(originalPrice * (1 - discountRate / 100))
}
```

### 필터 컴포넌트 예제

```typescript
// src/components/shop/ProductFilter.tsx (선택적 구현)
'use client'

import { useState } from 'react'
import { useProductStore } from '@/store'
import { brands } from '@/data'
import { Button } from '@/components/ui'

export default function ProductFilter() {
  const { filters, setFilters, clearFilters } = useProductStore()
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 })
  const [selectedBrands, setSelectedBrands] = useState<string[]>(filters.brands || [])

  const handleBrandToggle = (brandId: string) => {
    const updated = selectedBrands.includes(brandId)
      ? selectedBrands.filter(id => id !== brandId)
      : [...selectedBrands, brandId]
    
    setSelectedBrands(updated)
    setFilters({ brands: updated })
  }

  const handlePriceFilter = () => {
    setFilters({ priceRange })
  }

  return (
    <div className="space-y-6 p-4 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">필터</h3>
        <Button variant="outline" size="sm" onClick={clearFilters}>
          초기화
        </Button>
      </div>

      {/* 브랜드 필터 */}
      <div>
        <h4 className="font-medium mb-3">브랜드</h4>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.id)}
                onChange={() => handleBrandToggle(brand.id)}
                className="mr-2"
              />
              {brand.name}
            </label>
          ))}
        </div>
      </div>

      {/* 가격 필터 */}
      <div>
        <h4 className="font-medium mb-3">가격대</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="최소가격"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <span className="self-center">~</span>
            <input
              type="number"
              placeholder="최대가격"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <Button onClick={handlePriceFilter} size="sm" className="w-full">
            적용
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 사용 예제

### 1. 기본 상품 목록 표시
```typescript
import { ProductGrid, CategoryNav } from '@/components/shop'
import { useProductStore } from '@/store'

function ProductPage() {
  const { filteredProducts, isLoading } = useProductStore()
  
  return (
    <div>
      <CategoryNav />
      <ProductGrid products={filteredProducts} isLoading={isLoading} />
    </div>
  )
}
```

### 2. 검색 결과 표시
```typescript
const handleSearch = (query: string) => {
  searchProducts(query)
}

return (
  <SearchBar onSearch={handleSearch} placeholder="상품 검색" />
)
```

### 3. 카테고리별 필터링
```typescript
const handleCategoryFilter = (categoryId: string) => {
  setFilters({ category: categoryId })
}
```

---

## 성능 최적화 팁

### 1. **이미지 최적화**
- Next.js Image 컴포넌트 사용
- 적절한 sizes 속성 설정
- 로딩 상태 표시

### 2. **상태 관리 최적화**
- 필터링 디바운싱
- 메모이제이션 활용
- 불필요한 리렌더링 방지

### 3. **API 최적화**
- 페이지네이션 구현
- 캐싱 전략 수립
- 로딩 상태 적절히 표시

### 4. **사용자 경험 개선**
- 스켈레톤 UI 제공
- 에러 상태 처리
- 접근성 고려

---

## 마무리

이 가이드를 통해 다음을 구현할 수 있습니다:

1. **완전한 상품 카탈로그** 시스템
2. **검색 및 필터링** 기능
3. **상품 상세** 페이지
4. **카테고리 네비게이션**
5. **위시리스트** 기능
6. **장바구니 연동**

모든 컴포넌트는 재사용 가능하며, 타입 안전성을 보장합니다. 실제 프로덕션 환경에서 바로 사용할 수 있는 수준의 코드입니다.