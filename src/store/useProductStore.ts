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