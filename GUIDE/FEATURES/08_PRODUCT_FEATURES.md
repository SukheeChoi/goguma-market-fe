# 🛍️ 상품 비교 및 상세 개선 기능 구현 가이드

이 문서는 고구마 마켓의 상품 비교 기능 및 상품 상세 페이지 개선 방법을 상세히 설명합니다.

## 📋 목차

1. [상품 비교 시스템](#상품-비교-시스템)
2. [상품 상세 개선](#상품-상세-개선)
3. [360도 이미지 뷰어](#360도-이미지-뷰어)
4. [AR 체험 기능](#ar-체험-기능)
5. [라이브 채팅](#라이브-채팅)

---

## 상품 비교 시스템

### 비교 타입 정의

```typescript
// src/types/comparison.ts
export interface ComparisonItem {
  id: string
  product: Product
  addedAt: string
}

export interface ComparisonState {
  items: ComparisonItem[]
  maxItems: number
  isOpen: boolean
}

export interface ComparisonData {
  products: Product[]
  specifications: ComparisonSpec[]
  similarities: string[]
  differences: ComparisonDifference[]
}

export interface ComparisonSpec {
  category: string
  specs: {
    name: string
    values: (string | number)[]
    isHighlight?: boolean
  }[]
}

export interface ComparisonDifference {
  productId: string
  feature: string
  value: string | number
  isAdvantage: boolean
}
```

### 비교 Store 구현

```typescript
// src/store/useComparisonStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ComparisonItem, ComparisonData } from '@/types/comparison'
import type { Product } from '@/types/product'

interface ComparisonStore {
  items: ComparisonItem[]
  maxItems: number
  isOpen: boolean
  
  // Actions
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  clearAll: () => void
  togglePanel: () => void
  canAddItem: (productId: string) => boolean
  getComparisonData: () => Promise<ComparisonData>
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,
      isOpen: false,
      
      addItem: (product: Product): void => {
        const { items, maxItems } = get()
        
        // 이미 추가된 상품인지 확인
        if (items.some(item => item.product.id === product.id)) {
          return
        }
        
        // 최대 개수 확인
        if (items.length >= maxItems) {
          alert(`최대 ${maxItems}개까지 비교할 수 있습니다.`)
          return
        }
        
        const newItem: ComparisonItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          addedAt: new Date().toISOString()
        }
        
        set(state => ({
          items: [...state.items, newItem]
        }))
      },
      
      removeItem: (productId: string): void => {
        set(state => ({
          items: state.items.filter(item => item.product.id !== productId)
        }))
      },
      
      clearAll: (): void => {
        set({ items: [] })
      },
      
      togglePanel: (): void => {
        set(state => ({ isOpen: !state.isOpen }))
      },
      
      canAddItem: (productId: string): boolean => {
        const { items, maxItems } = get()
        return items.length < maxItems && !items.some(item => item.product.id === productId)
      },
      
      getComparisonData: async (): Promise<ComparisonData> => {
        const { items } = get()
        
        if (items.length < 2) {
          throw new Error('비교하려면 최소 2개 상품이 필요합니다.')
        }
        
        try {
          const productIds = items.map(item => item.product.id)
          const response = await fetch('/api/products/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds })
          })
          
          return await response.json()
        } catch (error) {
          console.error('상품 비교 데이터 조회 실패:', error)
          throw error
        }
      }
    }),
    {
      name: 'comparison-storage'
    }
  )
)
```

### 비교 패널 UI

```typescript
// src/components/shop/ComparisonPanel.tsx
'use client'

import { useState } from 'react'
import { useComparisonStore } from '@/store'
import { Button } from '@/components/ui'
import Link from 'next/link'

export default function ComparisonPanel() {
  const { items, isOpen, removeItem, clearAll, togglePanel } = useComparisonStore()
  
  if (items.length === 0) {
    return null
  }
  
  return (
    <>
      {/* 플로팅 비교 버튼 */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-4">
        <button
          onClick={togglePanel}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span>⚖️</span>
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {items.length}
            </span>
          </div>
        </button>
      </div>
      
      {/* 비교 패널 */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-16 bg-white border-t shadow-lg z-50 md:bottom-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">상품 비교 ({items.length}개)</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={clearAll}>
                  전체 삭제
                </Button>
                <button
                  onClick={togglePanel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-24 text-center relative"
                >
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                  
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded mx-auto mb-2"
                  />
                  <p className="text-xs font-medium truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.product.price.toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>
            
            {items.length >= 2 && (
              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/compare?ids=${items.map(item => item.product.id).join(',')}`}
                  className="flex-1"
                >
                  <Button className="w-full">
                    비교하기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

### 비교 페이지

```typescript
// src/app/compare/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useComparisonStore } from '@/store'
import { Button } from '@/components/ui'
import type { ComparisonData } from '@/types/comparison'

export default function ComparePage() {
  const searchParams = useSearchParams()
  const { getComparisonData } = useComparisonStore()
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadComparisonData = async () => {
      try {
        const data = await getComparisonData()
        setComparisonData(data)
      } catch (error) {
        console.error('비교 데이터 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadComparisonData()
  }, [getComparisonData])
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (!comparisonData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">비교할 상품이 없습니다</h1>
        <p className="text-gray-600 mb-6">
          상품을 선택하여 비교해보세요.
        </p>
        <Button>
          상품 둘러보기
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">상품 비교</h1>
      
      {/* 상품 기본 정보 */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
          <div className="font-semibold text-gray-600">상품</div>
          {comparisonData.products.map((product) => (
            <div key={product.id} className="text-center">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-32 h-32 object-cover rounded mx-auto mb-4"
              />
              <h3 className="font-semibold mb-2">{product.name}</h3>
              <p className="text-lg font-bold text-blue-600">
                {product.price.toLocaleString()}원
              </p>
              <p className="text-sm text-gray-600">{product.brand}</p>
              
              <div className="mt-4 space-y-2">
                <Button size="sm" className="w-full">
                  장바구니 담기
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  상세보기
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 상세 비교 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">상세 스펙 비교</h2>
          
          {comparisonData.specifications.map((category) => (
            <div key={category.category} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {category.category}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        항목
                      </th>
                      {comparisonData.products.map((product) => (
                        <th key={product.id} className="text-center py-3 px-4 font-medium">
                          {product.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {category.specs.map((spec) => (
                      <tr
                        key={spec.name}
                        className={`border-b ${spec.isHighlight ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="py-3 px-4 font-medium text-gray-700">
                          {spec.name}
                          {spec.isHighlight && (
                            <span className="ml-2 text-yellow-600">⭐</span>
                          )}
                        </td>
                        {spec.values.map((value, index) => (
                          <td key={index} className="py-3 px-4 text-center">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 장단점 요약 */}
      {comparisonData.differences.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">장단점 요약</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {comparisonData.products.map((product) => {
              const productAdvantages = comparisonData.differences.filter(
                diff => diff.productId === product.id && diff.isAdvantage
              )
              const productDisadvantages = comparisonData.differences.filter(
                diff => diff.productId === product.id && !diff.isAdvantage
              )
              
              return (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{product.name}</h3>
                  
                  {productAdvantages.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-green-600 mb-2">
                        👍 장점
                      </h4>
                      <ul className="text-sm space-y-1">
                        {productAdvantages.map((advantage, index) => (
                          <li key={index} className="text-green-700">
                            • {advantage.feature}: {advantage.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {productDisadvantages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-2">
                        👎 단점
                      </h4>
                      <ul className="text-sm space-y-1">
                        {productDisadvantages.map((disadvantage, index) => (
                          <li key={index} className="text-red-700">
                            • {disadvantage.feature}: {disadvantage.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 상품 상세 개선

### 향상된 이미지 갤러리

```typescript
// src/components/shop/EnhancedImageGallery.tsx
'use client'

import { useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Zoom, Thumbs } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/zoom'
import 'swiper/css/thumbs'

interface EnhancedImageGalleryProps {
  images: string[]
  productName: string
}

export default function EnhancedImageGallery({ images, productName }: EnhancedImageGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  
  const openFullscreen = (index: number) => {
    setCurrentIndex(index)
    setIsFullscreen(true)
    document.body.style.overflow = 'hidden'
  }
  
  const closeFullscreen = () => {
    setIsFullscreen(false)
    document.body.style.overflow = 'unset'
  }
  
  return (
    <>
      <div className="space-y-4">
        {/* 메인 이미지 슬라이더 */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <Swiper
            modules={[Navigation, Pagination, Zoom, Thumbs]}
            navigation
            pagination={{ clickable: true }}
            zoom={{ maxRatio: 3 }}
            thumbs={{ swiper: thumbsSwiper }}
            onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
            className="h-full"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="swiper-zoom-container h-full">
                  <img
                    src={image}
                    alt={`${productName} ${index + 1}`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => openFullscreen(index)}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* 풀스크린 버튼 */}
          <button
            onClick={() => openFullscreen(currentIndex)}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 z-10"
          >
            🔍
          </button>
        </div>
        
        {/* 썸네일 슬라이더 */}
        {images.length > 1 && (
          <div className="w-full">
            <Swiper
              modules={[Navigation, Thumbs]}
              onSwiper={setThumbsSwiper}
              spaceBetween={8}
              slidesPerView={5}
              watchSlidesProgress
              className="thumbs-swiper"
              breakpoints={{
                640: { slidesPerView: 6 },
                768: { slidesPerView: 8 }
              }}
            >
              {images.map((image, index) => (
                <SwiperSlide key={index}>
                  <div className="aspect-square bg-gray-100 rounded cursor-pointer overflow-hidden">
                    <img
                      src={image}
                      alt={`${productName} 썸네일 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
      
      {/* 풀스크린 모달 */}
      {isFullscreen && (
        <div
          ref={fullscreenRef}
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-gray-300"
          >
            ✕
          </button>
          
          <Swiper
            modules={[Navigation, Zoom]}
            navigation
            zoom={{ maxRatio: 5 }}
            initialSlide={currentIndex}
            className="w-full h-full"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="swiper-zoom-container w-full h-full flex items-center justify-center">
                  <img
                    src={image}
                    alt={`${productName} ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </>
  )
}
```

### 크기 가이드

```typescript
// src/components/shop/SizeGuide.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface SizeGuideProps {
  productType: string
}

export default function SizeGuide({ productType }: SizeGuideProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const sizeData = {
    'clothing': {
      title: '의류 사이즈 가이드',
      measurements: [
        { size: 'XS', chest: 88, waist: 72, hip: 90 },
        { size: 'S', chest: 92, waist: 76, hip: 94 },
        { size: 'M', chest: 96, waist: 80, hip: 98 },
        { size: 'L', chest: 100, waist: 84, hip: 102 },
        { size: 'XL', chest: 104, waist: 88, hip: 106 }
      ],
      guide: [
        '가슴둘레: 겨드랑이 아래 가장 넓은 부분',
        '허리둘레: 가장 잘록한 부분',
        '엉덩이둘레: 엉덩이의 가장 넓은 부분'
      ]
    },
    'shoes': {
      title: '신발 사이즈 가이드',
      measurements: [
        { size: '240', length: 24.0, width: 9.0 },
        { size: '245', length: 24.5, width: 9.2 },
        { size: '250', length: 25.0, width: 9.4 },
        { size: '255', length: 25.5, width: 9.6 },
        { size: '260', length: 26.0, width: 9.8 }
      ],
      guide: [
        '발 길이: 뒤꿈치부터 가장 긴 발가락까지',
        '발 너비: 발의 가장 넓은 부분',
        '오후에 측정하는 것을 권장합니다'
      ]
    }
  }
  
  const currentData = sizeData[productType as keyof typeof sizeData]
  
  if (!currentData) return null
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-sm"
      >
        📏 사이즈 가이드
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{currentData.title}</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* 사이즈 측정 가이드 */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">측정 방법</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {currentData.guide.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
              
              {/* 사이즈 차트 */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-3 text-left">사이즈</th>
                      {Object.keys(currentData.measurements[0]).slice(1).map((key) => (
                        <th key={key} className="border p-3 text-center">
                          {key === 'chest' ? '가슴둘레(cm)' :
                           key === 'waist' ? '허리둘레(cm)' :
                           key === 'hip' ? '엉덩이둘레(cm)' :
                           key === 'length' ? '발길이(cm)' :
                           key === 'width' ? '발너비(cm)' : key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.measurements.map((measurement, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-3 font-semibold">{measurement.size}</td>
                        {Object.values(measurement).slice(1).map((value, valueIndex) => (
                          <td key={valueIndex} className="border p-3 text-center">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 추가 팁 */}
              <div className="mt-6 p-4 bg-blue-50 rounded">
                <h4 className="font-semibold text-blue-800 mb-2">💡 사이즈 선택 팁</h4>
                <p className="text-sm text-blue-700">
                  사이즈가 애매하다면 한 치수 큰 것을 선택하는 것을 권장합니다. 
                  브랜드별로 사이즈가 다를 수 있으니 참고용으로만 활용해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

---

## 360도 이미지 뷰어

```typescript
// src/components/shop/Product360Viewer.tsx
'use client'

import { useState, useRef, useEffect } from 'react'

interface Product360ViewerProps {
  images: string[]
  productName: string
}

export default function Product360Viewer({ images, productName }: Product360ViewerProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoRotateRef = useRef<NodeJS.Timeout>()
  
  const totalFrames = images.length
  
  const nextFrame = () => {
    setCurrentFrame((prev) => (prev + 1) % totalFrames)
  }
  
  const prevFrame = () => {
    setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames)
  }
  
  const startAutoRotate = () => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current)
    }
    
    autoRotateRef.current = setInterval(() => {
      nextFrame()
    }, 100)
    
    setIsRotating(true)
  }
  
  const stopAutoRotate = () => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current)
    }
    setIsRotating(false)
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    stopAutoRotate()
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - startX
    const sensitivity = 5
    
    if (Math.abs(deltaX) > sensitivity) {
      if (deltaX > 0) {
        nextFrame()
      } else {
        prevFrame()
      }
      setStartX(e.clientX)
    }
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  useEffect(() => {
    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [])
  
  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={images[currentFrame]}
          alt={`${productName} 360도 뷰 ${currentFrame + 1}/${totalFrames}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      
      {/* 컨트롤 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded-full px-4 py-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={prevFrame}
            className="text-white hover:text-gray-300"
          >
            ◀️
          </button>
          
          <button
            onClick={isRotating ? stopAutoRotate : startAutoRotate}
            className="text-white hover:text-gray-300"
          >
            {isRotating ? '⏸️' : '▶️'}
          </button>
          
          <button
            onClick={nextFrame}
            className="text-white hover:text-gray-300"
          >
            ▶️
          </button>
          
          <span className="text-white text-sm ml-2">
            {currentFrame + 1}/{totalFrames}
          </span>
        </div>
      </div>
      
      {/* 360도 표시 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        360°
      </div>
      
      {/* 가이드 텍스트 */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        드래그하여 회전
      </div>
    </div>
  )
}
```

---

## AR 체험 기능

```typescript
// src/components/shop/ARViewer.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'

interface ARViewerProps {
  productId: string
  productName: string
  arModelUrl?: string
}

export default function ARViewer({ productId, productName, arModelUrl }: ARViewerProps) {
  const [isARSupported, setIsARSupported] = useState(false)
  const [isARActive, setIsARActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // AR 지원 여부 확인
  const checkARSupport = async () => {
    try {
      // WebXR AR 지원 확인
      if ('xr' in navigator) {
        const isSupported = await (navigator as any).xr.isSessionSupported('immersive-ar')
        setIsARSupported(isSupported)
      } else {
        // 일반 카메라 접근 확인
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        setIsARSupported(true)
      }
    } catch (error) {
      console.log('AR not supported:', error)
      setIsARSupported(false)
    }
  }
  
  // AR 세션 시작
  const startAR = async () => {
    try {
      if ('xr' in navigator && arModelUrl) {
        // WebXR AR 사용
        const session = await (navigator as any).xr.requestSession('immersive-ar')
        setIsARActive(true)
        // AR 렌더링 로직 구현
      } else {
        // 기본 카메라 + 오버레이 사용
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setIsARActive(true)
        }
      }
    } catch (error) {
      console.error('AR 시작 실패:', error)
      alert('AR 기능을 사용할 수 없습니다.')
    }
  }
  
  // AR 세션 종료
  const stopAR = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsARActive(false)
  }
  
  // 사진 촬영
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      if (context) {
        context.drawImage(video, 0, 0)
        
        // 이미지 다운로드
        const link = document.createElement('a')
        link.download = `${productName}_ar_try.png`
        link.href = canvas.toDataURL()
        link.click()
      }
    }
  }
  
  // 컴포넌트 마운트 시 AR 지원 여부 확인
  useState(() => {
    checkARSupport()
  })
  
  if (!isARSupported) {
    return (
      <div className="text-center p-4 bg-gray-100 rounded">
        <p className="text-gray-600 mb-2">AR 체험을 사용할 수 없습니다</p>
        <p className="text-sm text-gray-500">
          최신 브라우저와 카메라 권한이 필요합니다
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {!isARActive ? (
        <Button
          onClick={startAR}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          📱 AR로 착용해보기
        </Button>
      ) : (
        <div className="relative">
          {/* AR 뷰 */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* AR 오버레이 UI */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 가이드 그리드 */}
              <div className="absolute inset-0 border-2 border-white border-opacity-30">
                <div className="absolute top-1/2 left-0 right-0 border-t border-white border-opacity-30"></div>
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-white border-opacity-30"></div>
              </div>
              
              {/* 중앙 포커스 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-20 h-20 border-2 border-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* 안내 텍스트 */}
            <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded">
              <p className="text-sm text-center">
                카메라를 자신에게 향하고 중앙의 원에 맞춰보세요
              </p>
            </div>
          </div>
          
          {/* AR 컨트롤 */}
          <div className="flex space-x-2">
            <Button
              onClick={capturePhoto}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              📸 사진 촬영
            </Button>
            <Button
              onClick={stopAR}
              variant="outline"
              className="flex-1"
            >
              종료
            </Button>
          </div>
          
          {/* 숨겨진 캔버스 */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center">
        💡 AR 기능은 실제 착용감과 다를 수 있습니다
      </div>
    </div>
  )
}
```

---

## 라이브 채팅

```typescript
// src/components/shop/LiveChat.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useUserStore } from '@/store'
import { Button } from '@/components/ui'

interface ChatMessage {
  id: string
  type: 'user' | 'agent' | 'system'
  message: string
  timestamp: string
  sender?: string
}

interface LiveChatProps {
  productId?: string
}

export default function LiveChat({ productId }: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useUserStore()
  
  // 웹소켓 연결
  const connectWebSocket = () => {
    // 실제 구현에서는 웹소켓 연결 로직
    setIsConnected(true)
    
    // 초기 메시지
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'agent',
      message: '안녕하세요! 고구마 마켓 고객센터입니다. 무엇을 도와드릴까요?',
      timestamp: new Date().toISOString(),
      sender: '상담원'
    }
    
    setMessages([welcomeMessage])
    
    // 상품 관련 안내 메시지 (productId가 있는 경우)
    if (productId) {
      setTimeout(() => {
        const productMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          message: '현재 보고 계신 상품에 대해 궁금한 점이 있으시면 언제든 문의해주세요!',
          timestamp: new Date().toISOString(),
          sender: '상담원'
        }
        setMessages(prev => [...prev, productMessage])
      }, 1000)
    }
  }
  
  // 메시지 전송
  const sendMessage = () => {
    if (!inputMessage.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      sender: user?.name || '고객'
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    
    // 타이핑 표시
    setIsTyping(true)
    
    // 자동 응답 시뮬레이션
    setTimeout(() => {
      const autoReply = getAutoReply(userMessage.message)
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        message: autoReply,
        timestamp: new Date().toISOString(),
        sender: '상담원'
      }
      
      setMessages(prev => [...prev, agentMessage])
      setIsTyping(false)
    }, 1500)
  }
  
  // 자동 응답 로직
  const getAutoReply = (message: string): string => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('사이즈') || lowerMessage.includes('크기')) {
      return '사이즈 관련 문의주셨네요. 상품 상세 페이지의 "사이즈 가이드"를 참고해주시거나, 구체적인 사이즈를 알려주시면 더 자세히 안내드릴게요!'
    }
    
    if (lowerMessage.includes('배송') || lowerMessage.includes('택배')) {
      return '배송은 주문 후 1-3일 내 발송되며, 배송비는 3,000원입니다. (5만원 이상 무료배송) 제주/도서산간 지역은 추가 배송비가 있을 수 있어요.'
    }
    
    if (lowerMessage.includes('교환') || lowerMessage.includes('환불')) {
      return '교환/환불은 상품 수령 후 7일 이내 가능하며, 착용하지 않은 새 제품만 가능합니다. 자세한 내용은 고객센터 1588-1234로 연락주세요.'
    }
    
    if (lowerMessage.includes('재고') || lowerMessage.includes('품절')) {
      return '재고 문의주셨네요. 현재 재고 상황을 확인해드리겠습니다. 잠시만 기다려주세요!'
    }
    
    return '문의해주신 내용을 확인했습니다. 더 자세한 상담이 필요하시면 고객센터 1588-1234로 연결해드릴 수 있어요. 다른 궁금한 점이 있으시면 언제든 말씀해주세요!'
  }
  
  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  return (
    <>
      {/* 채팅 버튼 */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            if (!isConnected) connectWebSocket()
          }}
          className="fixed bottom-20 right-4 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 z-40 md:bottom-4"
        >
          💬
        </button>
      )}
      
      {/* 채팅 창 */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 w-80 h-96 bg-white border rounded-lg shadow-xl z-50 flex flex-col md:bottom-4">
          {/* 헤더 */}
          <div className="bg-green-500 text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-300 rounded-full"></div>
              <span className="font-semibold">고객센터</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* 타이핑 표시 */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* 입력 영역 */}
          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Button
                onClick={sendMessage}
                size="sm"
                disabled={!inputMessage.trim()}
              >
                전송
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

---

## 💡 구현 팁

### 1. 상품 비교 최적화
- 같은 카테고리 상품만 비교 허용
- 비교 항목 우선순위 설정
- 비교 결과 캐싱으로 성능 향상
- 모바일에서 가로 스크롤 최적화

### 2. 이미지 성능
- 이미지 지연 로딩 구현
- WebP 포맷 지원
- 해상도별 이미지 제공
- CDN 사용으로 로딩 속도 개선

### 3. AR/VR 기능
- 점진적 향상으로 구현
- 브라우저 호환성 체크
- 카메라 권한 우아한 처리
- 대안 기능 제공

### 4. 사용자 경험
- 터치 제스처 지원
- 키보드 네비게이션
- 로딩 상태 표시
- 에러 상황 적절한 처리

---

## 🚀 확장 기능

1. **AI 기반 상품 추천**
   - 유사 상품 자동 추천
   - 개인화된 비교 항목
   - 스타일 매칭 시스템

2. **소셜 기능**
   - 비교 결과 공유
   - 커뮤니티 리뷰 연동
   - 친구 추천 시스템

3. **고급 AR 기능**
   - 얼굴 인식 피팅
   - 배경 교체
   - 조명 시뮬레이션

4. **분석 대시보드**
   - 비교 패턴 분석
   - 인기 비교 항목
   - 전환율 최적화

이 가이드를 통해 사용자가 더 나은 구매 결정을 내릴 수 있도록 돕는 고급 상품 기능들을 구현할 수 있습니다.