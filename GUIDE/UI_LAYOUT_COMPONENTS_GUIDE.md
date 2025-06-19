# UI 컴포넌트 및 레이아웃 개발 가이드

이 문서는 React/Next.js 기반 쇼핑몰에서 재사용 가능한 UI 컴포넌트와 레이아웃 시스템을 구현하는 방법을 설명합니다.

## 목차
1. [전체 구조 개요](#1-전체-구조-개요)
2. [레이아웃 시스템](#2-레이아웃-시스템)
3. [헤더 컴포넌트](#3-헤더-컴포넌트)
4. [UI 컴포넌트 시스템](#4-ui-컴포넌트-시스템)
5. [Button 컴포넌트](#5-button-컴포넌트)
6. [Badge 컴포넌트](#6-badge-컴포넌트)
7. [SearchBar 컴포넌트](#7-searchbar-컴포넌트)
8. [CartIcon 컴포넌트](#8-carticon-컴포넌트)
9. [반응형 디자인](#9-반응형-디자인)
10. [Tailwind CSS 활용](#10-tailwind-css-활용)

---

## 1. 전체 구조 개요

### 컴포넌트 시스템 구성

```
📁 컴포넌트 구조
├── 📁 components/
│   ├── 📁 ui/                     # 재사용 가능한 UI 컴포넌트
│   │   ├── Button.tsx             # 버튼 컴포넌트
│   │   ├── Badge.tsx              # 배지 컴포넌트
│   │   ├── SearchBar.tsx          # 검색바 컴포넌트
│   │   ├── CartIcon.tsx           # 장바구니 아이콘
│   │   └── index.ts               # UI 컴포넌트 exports
│   ├── 📁 layout/                 # 레이아웃 컴포넌트
│   │   ├── Header.tsx             # 헤더 컴포넌트
│   │   └── MainLayout.tsx         # 메인 레이아웃
│   └── 📁 shop/                   # 비즈니스 로직 컴포넌트
│       ├── ProductCard.tsx        # 상품 카드
│       ├── ProductGrid.tsx        # 상품 그리드
│       └── CategoryNav.tsx        # 카테고리 네비게이션
├── 📁 lib/
│   └── utils.ts                   # 유틸리티 함수 (cn, formatPrice)
└── 📁 app/
    ├── layout.tsx                 # 루트 레이아웃
    └── page.tsx                   # 메인 페이지
```

### 디자인 시스템 원칙
- **재사용성**: 범용적으로 사용 가능한 컴포넌트
- **일관성**: 동일한 스타일과 패턴 유지
- **접근성**: 키보드 네비게이션과 스크린 리더 지원
- **반응형**: 모바일부터 데스크톱까지 대응
- **타입 안전성**: TypeScript로 프롭스 타입 정의

---

## 2. 레이아웃 시스템

### 루트 레이아웃 구현

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/shop/CategoryNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '고구마 마켓 - 온라인 쇼핑몰',
  description: 'Musinsa 스타일의 패션 쇼핑몰',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* 헤더 */}
        <Header />
        
        {/* 카테고리 네비게이션 */}
        <CategoryNav />
        
        {/* 메인 콘텐츠 */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        
        {/* Toast 컨테이너 (react-toastify) */}
        <div id="toast-root" />
      </body>
    </html>
  )
}
```

### 메인 레이아웃 컴포넌트

```typescript
// src/components/layout/MainLayout.tsx
interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export default function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('container mx-auto px-4 py-6', className)}>
      {children}
    </div>
  )
}
```

**💡 레이아웃 시스템의 특징:**
- **일관된 구조**: Header + CategoryNav + Main 구성
- **컨테이너 관리**: 반응형 여백과 최대 너비 설정
- **유연성**: 페이지별 커스터마이징 가능
- **SEO 최적화**: 메타데이터와 시맨틱 HTML

---

## 3. 헤더 컴포넌트

### Header 구현

```typescript
// src/components/layout/Header.tsx
import Link from 'next/link'
import SearchBar from '@/components/ui/SearchBar'
import CartIcon from '@/components/ui/CartIcon'
import { useProductStore } from '@/store'

export default function Header() {
  const { searchProducts } = useProductStore()

  const handleSearch = (query: string) => {
    searchProducts(query)
  }

  return (
    <header className="w-full bg-black text-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="text-xl font-bold">
            고구마 마켓
          </Link>

          {/* 중앙 검색바 (데스크톱) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="상품, 브랜드를 검색해보세요"
              className="w-full"
            />
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-4">
            {/* 로그인/회원가입 */}
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <Link href="/login" className="hover:text-gray-300">
                로그인
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/signup" className="hover:text-gray-300">
                회원가입
              </Link>
            </div>

            {/* 장바구니 */}
            <Link href="/cart" className="hover:text-gray-300">
              <CartIcon />
            </Link>

            {/* 모바일 메뉴 버튼 */}
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 검색바 */}
        <div className="md:hidden pb-4">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="상품, 브랜드 검색"
            className="w-full"
          />
        </div>
      </div>
    </header>
  )
}
```

**💡 헤더의 핵심 기능:**
- **고정 위치**: sticky header로 스크롤 시에도 고정
- **반응형 검색**: 데스크톱은 중앙, 모바일은 하단 배치
- **네비게이션**: 로고, 로그인, 장바구니 링크
- **상태 연동**: 장바구니 아이콘에 실시간 개수 표시

---

## 4. UI 컴포넌트 시스템

### 컴포넌트 아키텍처 원칙

```typescript
// 컴포넌트 인터페이스 패턴
interface ComponentProps {
  // 필수 프롭스
  children?: React.ReactNode
  
  // 스타일 관련
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  
  // 상태 관련
  disabled?: boolean
  loading?: boolean
  
  // 이벤트 핸들러
  onClick?: (event: React.MouseEvent) => void
}
```

### UI 컴포넌트 Export

```typescript
// src/components/ui/index.ts
export { default as Button } from './Button'
export { default as Badge } from './Badge'
export { default as SearchBar } from './SearchBar'
export { default as CartIcon } from './CartIcon'

// 타입도 함께 export
export type { ButtonProps } from './Button'
export type { BadgeProps } from './Badge'
```

---

## 5. Button 컴포넌트

### Button 구현

```typescript
// src/components/ui/Button.tsx
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseStyles = [
      'inline-flex items-center justify-center rounded-md font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50'
    ]

    const variants = {
      primary: 'bg-black text-white hover:bg-gray-800',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
      ghost: 'hover:bg-gray-100 hover:text-gray-900',
      destructive: 'bg-red-500 text-white hover:bg-red-600'
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg'
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="mr-2 h-4 w-4 animate-spin" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
```

### Button 사용 예제

```typescript
// 다양한 버튼 스타일 사용
function ButtonExamples() {
  return (
    <div className="space-y-4">
      {/* 기본 버튼 */}
      <Button>장바구니에 추가</Button>
      
      {/* 크기별 버튼 */}
      <div className="space-x-2">
        <Button size="sm">작은 버튼</Button>
        <Button size="md">중간 버튼</Button>
        <Button size="lg">큰 버튼</Button>
      </div>
      
      {/* 스타일별 버튼 */}
      <div className="space-x-2">
        <Button variant="primary">주요 액션</Button>
        <Button variant="secondary">보조 액션</Button>
        <Button variant="outline">아웃라인</Button>
        <Button variant="ghost">고스트</Button>
      </div>
      
      {/* 로딩 상태 */}
      <Button loading>처리 중...</Button>
      
      {/* 비활성화 */}
      <Button disabled>비활성화</Button>
    </div>
  )
}
```

**💡 Button 컴포넌트의 특징:**
- **다양한 변형**: 5가지 스타일 변형 제공
- **크기 옵션**: 3가지 크기 선택 가능
- **상태 관리**: 로딩, 비활성화 상태 지원
- **접근성**: 포커스 링과 키보드 네비게이션
- **타입 안전성**: HTMLButtonElement 속성 모두 상속

---

## 6. Badge 컴포넌트

### Badge 구현

```typescript
// src/components/ui/Badge.tsx
import { cn } from '@/lib/utils'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'new' | 'best' | 'sale' | 'soldout' | 'default'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    new: 'bg-blue-500 text-white',
    best: 'bg-red-500 text-white', 
    sale: 'bg-orange-500 text-white',
    soldout: 'bg-gray-500 text-white',
    default: 'bg-gray-200 text-gray-800'
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 text-xs font-medium rounded',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
```

### Badge 사용 예제

```typescript
// 상품 카드에서 배지 사용
function ProductCard({ product }) {
  return (
    <div className="relative">
      {/* 상품 이미지 */}
      <div className="relative">
        <img src={product.image} alt={product.name} />
        
        {/* 배지들 */}
        <div className="absolute top-2 left-2 space-y-1">
          {product.isNew && <Badge variant="new">NEW</Badge>}
          {product.isBest && <Badge variant="best">BEST</Badge>}
          {product.isOnSale && <Badge variant="sale">SALE</Badge>}
          {product.isSoldout && <Badge variant="soldout">품절</Badge>}
        </div>
      </div>
      
      {/* 상품 정보 */}
      <div className="p-4">
        <h3>{product.name}</h3>
        <p>{product.price}원</p>
      </div>
    </div>
  )
}
```

**💡 Badge 컴포넌트의 특징:**
- **의미론적 색상**: 각 상태에 맞는 색상 체계
- **컴팩트한 크기**: 작은 공간에 최적화
- **겹침 지원**: absolute 포지셔닝으로 이미지 위에 배치
- **확장 가능**: 새로운 variant 쉽게 추가 가능

---

## 7. SearchBar 컴포넌트

### SearchBar 구현 (이미 구현됨)

```typescript
// src/components/ui/SearchBar.tsx - 기존 코드 참조
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
        
        {/* 검색 아이콘 */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* 클리어 버튼 */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              onSearch('')
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  )
}
```

### SearchBar 고급 기능 추가

```typescript
// SearchBar with debouncing and suggestions
import { useState, useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  onSuggestionSelect?: (suggestion: string) => void
  suggestions?: string[]
  showSuggestions?: boolean
  debounceMs?: number
  className?: string
}

export default function SearchBar({ 
  placeholder = '검색어를 입력하세요',
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  showSuggestions = false,
  debounceMs = 300,
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // 디바운스된 검색 함수
  const debouncedSearch = useDebouncedCallback(
    (searchQuery: string) => {
      onSearch(searchQuery)
    },
    debounceMs
  )

  // 입력값 변경 시 디바운스된 검색 실행
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          const selectedSuggestion = suggestions[selectedIndex]
          setQuery(selectedSuggestion)
          onSuggestionSelect?.(selectedSuggestion)
          setIsFocused(false)
        } else {
          onSearch(query)
        }
        break
      case 'Escape':
        setIsFocused(false)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
        
        {/* 검색 아이콘과 클리어 버튼 동일 */}
      </div>

      {/* 검색 제안 드롭다운 */}
      {showSuggestions && isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuery(suggestion)
                onSuggestionSelect?.(suggestion)
                setIsFocused(false)
              }}
              className={cn(
                'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                index === selectedIndex && 'bg-gray-100'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**💡 SearchBar의 핵심 기능:**
- **실시간 검색**: 디바운싱으로 성능 최적화
- **자동완성**: 키보드 네비게이션 지원
- **접근성**: ESC, 화살표 키 지원
- **시각적 피드백**: 포커스 상태와 선택 표시

---

## 8. CartIcon 컴포넌트

### CartIcon 구현 (이미 구현됨)

```typescript
// src/components/ui/CartIcon.tsx - 기존 코드 참조
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
- **Hydration 안전**: useEffect로 클라이언트 렌더링
- **실시간 업데이트**: 상태 변경 시 즉시 반영
- **시각적 표시**: 아이템 있을 때만 배지 표시
- **접근성**: 적절한 크기와 색상 대비

---

## 9. 반응형 디자인

### 브레이크포인트 시스템

```css
/* Tailwind CSS 기본 브레이크포인트 */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */
```

### 반응형 그리드 시스템

```typescript
// 반응형 상품 그리드
function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// 반응형 헤더 레이아웃
function Header() {
  return (
    <header className="bg-black text-white">
      <div className="container mx-auto px-4">
        {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="w-full md:w-auto mb-4 md:mb-0">
            {/* 로고 */}
          </div>
          
          <div className="w-full md:flex-1 md:max-w-md md:mx-8">
            {/* 검색바 */}
          </div>
          
          <div className="w-full md:w-auto flex justify-center md:justify-end">
            {/* 메뉴 */}
          </div>
        </div>
      </div>
    </header>
  )
}
```

### 모바일 최적화

```typescript
// 모바일 전용 컴포넌트
function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      {/* 모바일 메뉴 버튼 */}
      <button 
        className="md:hidden p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* 모바일 메뉴 드롭다운 */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black border-t border-gray-700">
          <nav className="p-4 space-y-2">
            <Link href="/login" className="block py-2 text-white hover:text-gray-300">
              로그인
            </Link>
            <Link href="/signup" className="block py-2 text-white hover:text-gray-300">
              회원가입
            </Link>
            <Link href="/wishlist" className="block py-2 text-white hover:text-gray-300">
              위시리스트
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
```

**💡 반응형 디자인 원칙:**
- **모바일 우선**: Mobile-first 접근 방식
- **유연한 그리드**: 화면 크기에 따른 컬럼 수 조정
- **터치 친화적**: 충분한 터치 영역 확보
- **콘텐츠 우선**: 핵심 기능을 모든 디바이스에서 접근 가능

---

## 10. Tailwind CSS 활용

### 유틸리티 함수

```typescript
// src/lib/utils.ts - 기존 코드 참조
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 조건부 스타일링 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 가격 포맷팅
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원'
}

// 할인율 포맷팅
export function formatDiscountRate(rate: number): string {
  return `${rate}%`
}

// 할인 가격 계산
export function getDiscountedPrice(originalPrice: number, discountRate: number): number {
  return Math.floor(originalPrice * (1 - discountRate / 100))
}
```

### 커스텀 Tailwind 설정

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 브랜드 컬러
        brand: {
          50: '#fdf2f8',
          500: '#ec4899',
          900: '#831843',
        },
        // 시맨틱 컬러
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      spacing: {
        // 커스텀 spacing
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        // 커스텀 애니메이션
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // 폼 스타일링
    require('@tailwindcss/forms'),
    // 타이포그래피
    require('@tailwindcss/typography'),
  ],
}
```

### 디자인 토큰 시스템

```typescript
// src/lib/design-tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      900: '#111827',
    },
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    full: '9999px',
  },
}
```

### 조건부 스타일링 패턴

```typescript
// 상태에 따른 스타일 적용
function Button({ variant, size, disabled, loading, className, ...props }) {
  return (
    <button
      className={cn(
        // 기본 스타일
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        
        // 크기별 스타일
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        
        // 변형별 스타일
        {
          'bg-black text-white hover:bg-gray-800': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
        },
        
        // 상태별 스타일
        {
          'opacity-50 pointer-events-none': disabled || loading,
          'cursor-wait': loading,
        },
        
        // 커스텀 클래스
        className
      )}
      {...props}
    />
  )
}
```

**💡 Tailwind CSS 활용 팁:**
- **cn 함수**: 조건부 클래스명 관리의 핵심
- **컴포넌트 추상화**: 반복적인 스타일을 컴포넌트로 추상화
- **디자인 토큰**: 일관된 디자인 시스템 구축
- **성능 최적화**: PurgeCSS로 미사용 스타일 제거

---

## 사용 예제

### 1. 완전한 페이지 레이아웃

```typescript
// src/app/page.tsx
import MainLayout from '@/components/layout/MainLayout'
import { ProductGrid } from '@/components/shop'
import { SearchBar, Button } from '@/components/ui'

export default function HomePage() {
  return (
    <MainLayout>
      {/* 히어로 섹션 */}
      <section className="mb-12">
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold mb-4">
            최신 패션 트렌드를 만나보세요
          </h1>
          <p className="text-gray-600 mb-8">
            고구마 마켓에서 다양한 브랜드의 상품을 둘러보세요
          </p>
          <Button size="lg">
            쇼핑하기
          </Button>
        </div>
      </section>

      {/* 상품 그리드 */}
      <section>
        <ProductGrid />
      </section>
    </MainLayout>
  )
}
```

### 2. 반응형 카드 레이아웃

```typescript
function ProductCard({ product }) {
  return (
    <div className="group cursor-pointer">
      {/* 이미지 영역 */}
      <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
        <img 
          src={product.image} 
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* 배지들 */}
        <div className="absolute top-2 left-2 space-y-1">
          {product.isNew && <Badge variant="new">NEW</Badge>}
          {product.isBest && <Badge variant="best">BEST</Badge>}
        </div>
        
        {/* 호버 액션 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all">
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 translate-y-full group-hover:translate-y-0 transition-transform">
            <Button size="sm" className="whitespace-nowrap">
              장바구니에 추가
            </Button>
          </div>
        </div>
      </div>
      
      {/* 상품 정보 */}
      <div className="space-y-1">
        <p className="text-sm text-gray-500">{product.brand}</p>
        <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
        <p className="font-semibold">{formatPrice(product.price)}</p>
      </div>
    </div>
  )
}
```

### 3. 모달과 오버레이

```typescript
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* 모달 내용 */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
```

---

## 테스트 가이드

### 컴포넌트 테스트

```typescript
// Button 컴포넌트 테스트
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button Component', () => {
  test('기본 버튼 렌더링', () => {
    render(<Button>클릭하세요</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('클릭하세요')
  })
  
  test('클릭 이벤트 처리', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>클릭</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  test('로딩 상태 표시', () => {
    render(<Button loading>로딩 중</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveClass('cursor-wait')
  })
})
```

### 반응형 테스트

```typescript
// 반응형 레이아웃 테스트
import { render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

describe('Responsive Layout', () => {
  test('모바일 뷰에서 메뉴 숨김', () => {
    // 모바일 크기로 설정
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 640 })
      window.dispatchEvent(new Event('resize'))
    })
    
    render(<Header />)
    
    // 데스크톱 메뉴가 숨겨졌는지 확인
    expect(screen.getByTestId('desktop-menu')).toHaveClass('hidden')
    expect(screen.getByTestId('mobile-menu-button')).toBeVisible()
  })
})
```

---

## 마무리

이 가이드를 통해 다음을 구현할 수 있습니다:

1. **일관된 레이아웃 시스템** - Header, Navigation, Main Layout
2. **재사용 가능한 UI 컴포넌트** - Button, Badge, SearchBar, CartIcon
3. **반응형 디자인** - 모바일부터 데스크톱까지 대응
4. **접근성 준수** - 키보드 네비게이션과 스크린 리더 지원
5. **성능 최적화** - 효율적인 렌더링과 상태 관리
6. **타입 안전성** - TypeScript로 안전한 프롭스 관리

모든 컴포넌트는 Tailwind CSS와 TypeScript를 활용하여 현대적이고 유지보수가 쉬운 코드로 구성되어 있습니다.