export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  wishlist: string[]
  recentlyViewed: string[]
}

export interface UserPreferences {
  favoriteCategories: string[]
  favoriteBrands: string[]
  preferredSize: string
}

export interface Review {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string
  images?: string[]
  helpful: number
  createdAt: string
  user: {
    name: string
    avatar?: string
  }
}

export interface Address {
  id: string
  name: string
  phone: string
  address: string
  detailAddress: string
  zipCode: string
  isDefault: boolean
}