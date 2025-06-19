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