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