# 🔍 고급 필터링 및 검색 시스템 구현 가이드

이 문서는 고구마 마켓의 고급 필터링 및 검색 시스템 구현 방법을 상세히 설명합니다.

## 📋 목차

1. [필터 타입 정의](#필터-타입-정의)
2. [고급 검색 UI](#고급-검색-ui)
3. [필터 Store 구현](#필터-store-구현)
4. [검색 자동완성](#검색-자동완성)
5. [검색 결과 최적화](#검색-결과-최적화)

---

## 필터 타입 정의

```typescript
// src/types/filter.ts
export interface FilterOptions {
  categories: string[]
  brands: string[]
  priceRange: {
    min: number
    max: number
  }
  colors: string[]
  sizes: string[]
  ratings: number[]
  features: string[]
  sortBy: SortOption
  inStock: boolean
  onSale: boolean
  freeShipping: boolean
}

export enum SortOption {
  POPULAR = 'popular',
  LATEST = 'latest',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
  RATING = 'rating',
  REVIEW_COUNT = 'review_count'
}

export interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'brand' | 'category' | 'keyword'
  count?: number
}

export interface SearchHistory {
  id: string
  query: string
  timestamp: string
  resultCount: number
}
```

---

## 고급 검색 UI

```typescript
// src/components/shop/AdvancedFilter.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button, Slider, Checkbox } from '@/components/ui'
import type { FilterOptions, SortOption } from '@/types/filter'

interface AdvancedFilterProps {
  onFilterChange: (filters: Partial<FilterOptions>) => void
  initialFilters?: Partial<FilterOptions>
}

export default function AdvancedFilter({ onFilterChange, initialFilters }: AdvancedFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 1000000 },
    colors: [],
    sizes: [],
    ratings: [],
    features: [],
    sortBy: SortOption.POPULAR,
    inStock: false,
    onSale: false,
    freeShipping: false,
    ...initialFilters
  })

  const categories = [
    { id: 'clothing', name: '의류', count: 1523 },
    { id: 'shoes', name: '신발', count: 892 },
    { id: 'accessories', name: '액세서리', count: 456 },
    { id: 'bags', name: '가방', count: 321 }
  ]

  const brands = [
    { id: 'nike', name: '나이키', count: 234 },
    { id: 'adidas', name: '아디다스', count: 189 },
    { id: 'uniqlo', name: '유니클로', count: 156 },
    { id: 'zara', name: '자라', count: 134 }
  ]

  const colors = [
    { id: 'black', name: '블랙', hex: '#000000' },
    { id: 'white', name: '화이트', hex: '#FFFFFF' },
    { id: 'red', name: '레드', hex: '#FF0000' },
    { id: 'blue', name: '블루', hex: '#0000FF' },
    { id: 'gray', name: '그레이', hex: '#808080' }
  ]

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  const features = [
    { id: 'eco-friendly', name: '친환경' },
    { id: 'limited-edition', name: '한정판' },
    { id: 'handmade', name: '수제' },
    { id: 'organic', name: '오가닉' }
  ]

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleArrayFilter = (key: keyof FilterOptions, value: string) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    updateFilter(key, newArray)
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000000 },
      colors: [],
      sizes: [],
      ratings: [],
      features: [],
      sortBy: SortOption.POPULAR,
      inStock: false,
      onSale: false,
      freeShipping: false
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = () => {
    return filters.categories.length > 0 ||
           filters.brands.length > 0 ||
           filters.colors.length > 0 ||
           filters.sizes.length > 0 ||
           filters.ratings.length > 0 ||
           filters.features.length > 0 ||
           filters.inStock ||
           filters.onSale ||
           filters.freeShipping ||
           filters.priceRange.min > 0 ||
           filters.priceRange.max < 1000000
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">필터</h3>
        <div className="flex gap-2">
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600"
            >
              초기화
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '접기' : '펼치기'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 정렬 */}
        <div>
          <label className="block text-sm font-medium mb-2">정렬</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as SortOption)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value={SortOption.POPULAR}>인기순</option>
            <option value={SortOption.LATEST}>최신순</option>
            <option value={SortOption.PRICE_LOW}>가격 낮은순</option>
            <option value={SortOption.PRICE_HIGH}>가격 높은순</option>
            <option value={SortOption.RATING}>평점순</option>
            <option value={SortOption.REVIEW_COUNT}>리뷰순</option>
          </select>
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <div className="space-y-2">
            {categories.map(category => (
              <label key={category.id} className="flex items-center">
                <Checkbox
                  checked={filters.categories.includes(category.id)}
                  onChange={() => toggleArrayFilter('categories', category.id)}
                />
                <span className="ml-2 text-sm">{category.name}</span>
                <span className="ml-auto text-xs text-gray-500">({category.count})</span>
              </label>
            ))}
          </div>
        </div>

        {isExpanded && (
          <>
            {/* 브랜드 */}
            <div>
              <label className="block text-sm font-medium mb-2">브랜드</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {brands.map(brand => (
                  <label key={brand.id} className="flex items-center">
                    <Checkbox
                      checked={filters.brands.includes(brand.id)}
                      onChange={() => toggleArrayFilter('brands', brand.id)}
                    />
                    <span className="ml-2 text-sm">{brand.name}</span>
                    <span className="ml-auto text-xs text-gray-500">({brand.count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 가격 범위 */}
            <div>
              <label className="block text-sm font-medium mb-2">가격 범위</label>
              <div className="px-2">
                <Slider
                  value={[filters.priceRange.min, filters.priceRange.max]}
                  onChange={([min, max]) => updateFilter('priceRange', { min, max })}
                  min={0}
                  max={1000000}
                  step={10000}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{filters.priceRange.min.toLocaleString()}원</span>
                  <span>{filters.priceRange.max.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 색상 */}
            <div>
              <label className="block text-sm font-medium mb-2">색상</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => toggleArrayFilter('colors', color.id)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      filters.colors.includes(color.id)
                        ? 'border-black'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* 사이즈 */}
            <div>
              <label className="block text-sm font-medium mb-2">사이즈</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleArrayFilter('sizes', size)}
                    className={`px-3 py-1 border rounded ${
                      filters.sizes.includes(size)
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 평점 */}
            <div>
              <label className="block text-sm font-medium mb-2">평점</label>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <label key={rating} className="flex items-center">
                    <Checkbox
                      checked={filters.ratings.includes(rating)}
                      onChange={() => toggleArrayFilter('ratings', rating.toString())}
                    />
                    <div className="ml-2 flex items-center">
                      {[...Array(rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                      <span className="ml-1 text-sm">이상</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 특성 */}
            <div>
              <label className="block text-sm font-medium mb-2">특성</label>
              <div className="space-y-2">
                {features.map(feature => (
                  <label key={feature.id} className="flex items-center">
                    <Checkbox
                      checked={filters.features.includes(feature.id)}
                      onChange={() => toggleArrayFilter('features', feature.id)}
                    />
                    <span className="ml-2 text-sm">{feature.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 기타 옵션 */}
            <div>
              <label className="block text-sm font-medium mb-2">기타</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <Checkbox
                    checked={filters.inStock}
                    onChange={(checked) => updateFilter('inStock', checked)}
                  />
                  <span className="ml-2 text-sm">재고 있음</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={filters.onSale}
                    onChange={(checked) => updateFilter('onSale', checked)}
                  />
                  <span className="ml-2 text-sm">할인 중</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={filters.freeShipping}
                    onChange={(checked) => updateFilter('freeShipping', checked)}
                  />
                  <span className="ml-2 text-sm">무료배송</span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## 필터 Store 구현

```typescript
// src/store/useFilterStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilterOptions, SearchHistory, SearchSuggestion } from '@/types/filter'
import * as searchService from '@/services/searchService'

interface FilterState {
  filters: FilterOptions
  searchQuery: string
  searchHistory: SearchHistory[]
  suggestions: SearchSuggestion[]
  isLoading: boolean
  
  // Actions
  updateFilters: (filters: Partial<FilterOptions>) => void
  resetFilters: () => void
  setSearchQuery: (query: string) => void
  addToHistory: (query: string, resultCount: number) => void
  clearHistory: () => void
  fetchSuggestions: (query: string) => Promise<void>
  saveFilterPreset: (name: string, filters: FilterOptions) => void
  loadFilterPreset: (name: string) => void
}

const defaultFilters: FilterOptions = {
  categories: [],
  brands: [],
  priceRange: { min: 0, max: 1000000 },
  colors: [],
  sizes: [],
  ratings: [],
  features: [],
  sortBy: 'popular' as any,
  inStock: false,
  onSale: false,
  freeShipping: false
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,
      searchQuery: '',
      searchHistory: [],
      suggestions: [],
      isLoading: false,
      
      updateFilters: (newFilters: Partial<FilterOptions>): void => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }))
      },
      
      resetFilters: (): void => {
        set({ filters: defaultFilters })
      },
      
      setSearchQuery: (query: string): void => {
        set({ searchQuery: query })
      },
      
      addToHistory: (query: string, resultCount: number): void => {
        if (!query.trim()) return
        
        set(state => {
          const existingIndex = state.searchHistory.findIndex(
            item => item.query.toLowerCase() === query.toLowerCase()
          )
          
          const newHistoryItem: SearchHistory = {
            id: Date.now().toString(),
            query: query.trim(),
            timestamp: new Date().toISOString(),
            resultCount
          }
          
          let newHistory = [...state.searchHistory]
          
          if (existingIndex > -1) {
            // 기존 검색어를 최상단으로 이동
            newHistory.splice(existingIndex, 1)
          }
          
          newHistory.unshift(newHistoryItem)
          
          // 최대 20개까지만 저장
          if (newHistory.length > 20) {
            newHistory = newHistory.slice(0, 20)
          }
          
          return { searchHistory: newHistory }
        })
      },
      
      clearHistory: (): void => {
        set({ searchHistory: [] })
      },
      
      fetchSuggestions: async (query: string): Promise<void> => {
        if (!query.trim()) {
          set({ suggestions: [] })
          return
        }
        
        set({ isLoading: true })
        
        try {
          const suggestions = await searchService.getSuggestions(query)
          set({ suggestions })
        } catch (error) {
          console.error('검색 제안 조회 실패:', error)
          set({ suggestions: [] })
        } finally {
          set({ isLoading: false })
        }
      },
      
      saveFilterPreset: (name: string, filters: FilterOptions): void => {
        // 필터 프리셋 저장 로직
        const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}')
        presets[name] = filters
        localStorage.setItem('filterPresets', JSON.stringify(presets))
      },
      
      loadFilterPreset: (name: string): void => {
        const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}')
        if (presets[name]) {
          set({ filters: presets[name] })
        }
      }
    }),
    {
      name: 'filter-storage',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        filters: state.filters
      })
    }
  )
)
```

---

## 검색 자동완성

```typescript
// src/components/ui/SearchBar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useFilterStore } from '@/store'
import { useDebounce } from '@/hooks/useDebounce'
import type { SearchSuggestion } from '@/types/filter'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export default function SearchBar({ onSearch, placeholder = "상품을 검색하세요" }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const {
    searchQuery,
    searchHistory,
    suggestions,
    setSearchQuery,
    fetchSuggestions,
    clearHistory
  } = useFilterStore()
  
  const debouncedQuery = useDebounce(inputValue, 300)
  
  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery)
    }
  }, [debouncedQuery, fetchSuggestions])
  
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setIsOpen(true)
  }
  
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setInputValue(query)
    setIsOpen(false)
    onSearch(query)
    inputRef.current?.blur()
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      handleSearch(inputValue.trim())
    }
  }
  
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    const icons = {
      product: '🛍️',
      brand: '🏷️',
      category: '📁',
      keyword: '🔍'
    }
    return icons[type]
  }
  
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200">{part}</mark>
      ) : (
        part
      )
    )
  }
  
  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-4 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          🔍
        </button>
      </form>
      
      {/* 드롭다운 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* 최근 검색어 */}
          {!inputValue && searchHistory.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">최근 검색어</h4>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  전체 삭제
                </button>
              </div>
              <div className="space-y-1">
                {searchHistory.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSearch(item.query)}
                    className="flex items-center justify-between w-full px-2 py-1 text-left hover:bg-gray-50 rounded"
                  >
                    <span className="text-sm">{item.query}</span>
                    <span className="text-xs text-gray-500">
                      {item.resultCount}개
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* 검색 제안 */}
          {inputValue && suggestions.length > 0 && (
            <div className="p-2">
              <h4 className="text-sm font-medium text-gray-700 px-2 py-1">검색 제안</h4>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSearch(suggestion.text)}
                  className="flex items-center w-full px-2 py-2 text-left hover:bg-gray-50 rounded"
                >
                  <span className="mr-2">{getSuggestionIcon(suggestion.type)}</span>
                  <span className="text-sm">
                    {highlightMatch(suggestion.text, inputValue)}
                  </span>
                  {suggestion.count && (
                    <span className="ml-auto text-xs text-gray-500">
                      {suggestion.count}개
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* 검색 결과 없음 */}
          {inputValue && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 검색 결과 최적화

```typescript
// src/services/searchService.ts
import { apiClient } from '@/lib/api'
import type { Product } from '@/types/product'
import type { FilterOptions, SearchSuggestion } from '@/types/filter'

export interface SearchParams extends Partial<FilterOptions> {
  query?: string
  page?: number
  limit?: number
}

export interface SearchResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
  filters: {
    availableCategories: string[]
    availableBrands: string[]
    priceRange: { min: number; max: number }
    availableColors: string[]
    availableSizes: string[]
  }
}

export const searchProducts = async (params: SearchParams): Promise<SearchResponse> => {
  const response = await apiClient.get('/search', { params })
  return response.data
}

export const getSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  const response = await apiClient.get('/search/suggestions', {
    params: { query, limit: 10 }
  })
  return response.data
}

export const getPopularKeywords = async (): Promise<string[]> => {
  const response = await apiClient.get('/search/popular')
  return response.data
}

export const trackSearchEvent = async (query: string, resultCount: number): Promise<void> => {
  await apiClient.post('/search/track', {
    query,
    resultCount,
    timestamp: new Date().toISOString()
  })
}

// 클라이언트 사이드 검색 최적화
export class SearchOptimizer {
  private static cache = new Map<string, SearchResponse>()
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5분
  
  static async optimizedSearch(params: SearchParams): Promise<SearchResponse> {
    const cacheKey = JSON.stringify(params)
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    
    try {
      const result = await searchProducts(params)
      
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
      
      // 검색 이벤트 추적
      if (params.query) {
        trackSearchEvent(params.query, result.total)
      }
      
      return result
    } catch (error) {
      console.error('검색 오류:', error)
      throw error
    }
  }
  
  static clearCache(): void {
    this.cache.clear()
  }
}
```

---

## 💡 구현 팁

### 1. 성능 최적화
- 검색 결과 캐싱으로 중복 요청 방지
- 디바운싱으로 API 호출 최소화
- 가상 스크롤링으로 대량 결과 처리
- 필터 적용 시 점진적 로딩

### 2. 사용자 경험
- 실시간 필터 미리보기
- 필터 조합에 따른 결과 수 표시
- 저장된 검색 조건 및 즐겨찾기
- 모바일 친화적 필터 UI

### 3. 검색 품질
- 오타 교정 및 유사어 처리
- 동의어 및 관련어 확장
- 인기도 기반 결과 순위 조정
- 개인화된 검색 결과

### 4. 분석 및 개선
- 검색어 분석 및 트렌드 파악
- 필터 사용 패턴 분석
- A/B 테스트를 통한 최적화
- 사용자 피드백 수집

---

## 🚀 확장 기능

1. **시각적 검색**
   - 이미지 기반 상품 검색
   - 색상 팔레트 추출 검색

2. **음성 검색**
   - 음성 인식 API 연동
   - 다국어 음성 검색 지원

3. **AI 추천 검색**
   - 사용자 행동 기반 검색어 추천
   - 개인화된 필터 제안

4. **고급 분석**
   - 검색 퍼널 분석
   - 검색 성능 모니터링

이 가이드를 통해 사용자가 원하는 상품을 빠르고 정확하게 찾을 수 있는 검색 시스템을 구축할 수 있습니다.