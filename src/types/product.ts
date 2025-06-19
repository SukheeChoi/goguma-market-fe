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

// 프론트엔드에서 사용하는 Product 타입 (기존 유지)
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

export interface Size {
  id: string
  name: string
  available: boolean
}

export interface Color {
  id: string
  name: string
  code: string
  available: boolean
}

export interface Category {
  id: string
  name: string
  subcategories?: Category[]
}

export interface CartItem {
  productId: string
  product: Product
  selectedSize: Size
  selectedColor: Color
  quantity: number
}

export interface ProductFilter {
  category?: string | undefined
  brands?: string[]
  priceRange?: {
    min: number
    max: number
  }
  sizes?: string[]
  colors?: string[]
  tags?: string[]
}

export type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating'