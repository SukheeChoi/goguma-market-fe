# 📚 무신사 스타일 쇼핑몰 만들기 - 초급자 완전 가이드

## 🎯 학습 목표
이 가이드를 따라하면 다음을 배울 수 있습니다:
- Next.js 15 + TypeScript 프로젝트 구조
- Zustand를 사용한 상태관리
- Tailwind CSS로 반응형 UI 구현
- 컴포넌트 재사용과 관심사 분리

---

## 📁 1단계: 프로젝트 구조 이해하기

### 폴더 구조 설명
```
src/
├── app/                    # Next.js App Router 📍 페이지들
│   ├── layout.tsx         # 전체 레이아웃 (헤더, 네비게이션 포함)
│   ├── page.tsx           # 메인 쇼핑 페이지
│   └── product/[id]/      # 상품 상세 페이지 (동적 라우팅)
├── components/             # 재사용 가능한 컴포넌트들
│   ├── ui/                # 기본 UI 컴포넌트 (버튼, 뱃지 등)
│   ├── shop/              # 쇼핑몰 전용 컴포넌트
│   └── layout/            # 레이아웃 관련 컴포넌트
├── store/                 # Zustand 상태관리 📍 데이터 저장소
├── types/                 # TypeScript 타입 정의
├── data/                  # Mock 데이터 (실제 프로젝트에서는 API)
└── lib/                   # 유틸리티 함수들
```

**🔑 핵심 개념**: 
- `app/` 폴더 = 페이지 라우팅
- `components/` 폴더 = 재사용 가능한 UI 조각들
- `store/` 폴더 = 앱의 상태(데이터) 관리

---

## 🏗️ 2단계: 기본 설정 파일들

### package.json - 프로젝트 의존성
```json
{
  "scripts": {
    "dev": "next dev --turbopack",    // 개발 서버 실행
    "build": "next build",            // 프로덕션 빌드
    "lint": "next lint"              // 코드 검사
  },
  "dependencies": {
    "next": "15.3.3",               // Next.js 프레임워크
    "react": "^19.0.0",             // React 라이브러리
    "zustand": "^5.0.5",            // 상태관리 라이브러리
    "tailwind-merge": "^3.3.1"      // CSS 클래스 병합
  }
}
```

### tsconfig.json - TypeScript 설정
```json
{
  "compilerOptions": {
    "strict": true,                  // 엄격한 타입 체크
    "noUnusedLocals": true,         // 사용하지 않는 변수 경고
    "paths": {
      "@/*": ["./src/*"]            // @ = src 폴더 단축경로
    }
  }
}
```

**🔑 학습 포인트**: `@/components/Button` = `src/components/Button`

---

## 🎨 3단계: UI 컴포넌트 만들기

### Button 컴포넌트 (`src/components/ui/Button.tsx`)

**초급자 관점에서 단계별 설명:**

```tsx
// 1️⃣ 필요한 것들 가져오기
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// 2️⃣ 버튼이 받을 수 있는 속성들 정의
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' // 버튼 스타일 종류
  size?: 'sm' | 'md' | 'lg'                     // 버튼 크기
  isLoading?: boolean                           // 로딩 상태
  children: ReactNode                           // 버튼 내용 (텍스트, 아이콘 등)
}

// 3️⃣ 실제 버튼 컴포넌트
export default function Button({
  variant = 'primary',  // 기본값 설정
  size = 'md',
  isLoading = false,
  className,           // 추가 CSS 클래스
  children,           // 버튼 내용
  disabled,
  ...props           // 나머지 모든 button 속성들
}: ButtonProps) {
  
  // 4️⃣ 기본 스타일 정의
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors'
  
  // 5️⃣ variant에 따른 스타일 변화
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  }
  
  // 6️⃣ size에 따른 크기 변화
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg'
  }
  
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],  // 선택된 variant 스타일 적용
        sizes[size],        // 선택된 size 스타일 적용
        className           // 추가 클래스 병합
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? '로딩중...' : children}
    </button>
  )
}
```

**🔑 학습 포인트**:
- `interface`로 컴포넌트가 받을 props 타입 정의
- `extends`로 기본 HTML 속성들 상속
- 조건부 스타일링으로 다양한 버튼 만들기

### 사용 예시:
```tsx
<Button variant="primary" size="lg">
  구매하기
</Button>
<Button variant="outline" isLoading={true}>
  장바구니 담기
</Button>
```

---

## 📊 4단계: 상태관리 (Zustand)

### 상품 스토어 (`src/store/useProductStore.ts`)

**초급자를 위한 Zustand 이해하기:**

```tsx
import { create } from 'zustand'

// 1️⃣ 스토어가 관리할 데이터와 함수들 정의
interface ProductState {
  // 데이터 (상태)
  products: Product[]           // 모든 상품 목록
  filteredProducts: Product[]   // 필터링된 상품 목록
  isLoading: boolean           // 로딩 상태
  
  // 함수 (액션)
  searchProducts: (query: string) => void    // 검색 함수
  setFilters: (filters: Partial<ProductFilter>) => void  // 필터 설정
}

// 2️⃣ 실제 스토어 생성
export const useProductStore = create<ProductState>((set, get) => ({
  // 초기값 설정
  products: mockProducts,
  filteredProducts: mockProducts,
  isLoading: false,
  
  // 검색 함수 구현
  searchProducts: (query) => {
    const { products } = get()  // 현재 상태 가져오기
    
    if (!query.trim()) {
      set({ filteredProducts: products })  // 빈 검색어면 전체 보여주기
      return
    }
    
    // 검색어가 상품명이나 브랜드에 포함된 것들 필터링
    const searchResults = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.brand.toLowerCase().includes(query.toLowerCase())
    )
    
    set({ filteredProducts: searchResults })  // 상태 업데이트
  }
}))
```

### 컴포넌트에서 스토어 사용하기:

```tsx
function ProductList() {
  // 3️⃣ 스토어에서 필요한 데이터와 함수 가져오기
  const { filteredProducts, searchProducts, isLoading } = useProductStore()
  
  return (
    <div>
      <SearchBar onSearch={searchProducts} />
      {isLoading ? (
        <div>로딩중...</div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  )
}
```

**🔑 학습 포인트**:
- Zustand = 전역 상태 관리 라이브러리 (Redux보다 간단)
- `get()` = 현재 상태 읽기
- `set()` = 상태 업데이트하기
- 컴포넌트에서 `useProductStore()` 훅으로 사용

---

## 🎭 5단계: 컴포넌트 조합하기

### ProductCard 컴포넌트 분석

```tsx
function ProductCard({ product }: { product: Product }) {
  // 1️⃣ 필요한 스토어 함수들 가져오기
  const { addItem } = useCartStore()
  const { toggleWishlist, isInWishlist } = useUserStore()
  
  // 2️⃣ 이벤트 핸들러 함수들
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()  // 링크 이동 방지
    e.stopPropagation() // 부모 이벤트 전파 방지
    
    // 기본 옵션으로 장바구니에 추가
    const defaultSize = product.sizes.find(size => size.available)
    const defaultColor = product.colors.find(color => color.available)
    
    if (defaultSize && defaultColor) {
      addItem(product, defaultSize, defaultColor, 1)
    }
  }
  
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group cursor-pointer">
        {/* 3️⃣ 상품 이미지 영역 */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {/* 배지들 */}
          <div className="absolute top-2 left-2 z-10 flex gap-1">
            {product.isNew && <Badge variant="new">NEW</Badge>}
            {product.isBest && <Badge variant="best">BEST</Badge>}
          </div>
          
          {/* 상품 이미지 */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* 4️⃣ 호버 시 나타나는 장바구니 버튼 */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button onClick={handleAddToCart} className="w-full" size="sm">
              장바구니 담기
            </Button>
          </div>
        </div>
        
        {/* 5️⃣ 상품 정보 */}
        <div className="mt-3 space-y-1">
          <p className="text-sm text-gray-500">{product.brand}</p>
          <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </Link>
  )
}
```

**🔑 학습 포인트**:
- `group` 클래스와 `group-hover:` 로 호버 효과 구현
- `absolute` + `relative` 로 배지와 버튼 위치 조정
- `e.preventDefault()`, `e.stopPropagation()` 으로 이벤트 제어
- 여러 스토어에서 필요한 함수들만 선택적으로 가져오기

---

## 🔄 6단계: 페이지 구성하기

### 메인 페이지 (`src/app/page.tsx`)

```tsx
export default function MainShopPage() {
  // 1️⃣ 상태와 함수들 가져오기
  const { 
    filteredProducts,    // 필터링된 상품들
    isLoading,          // 로딩 상태
    sortOption,         // 현재 정렬 옵션
    searchProducts,     // 검색 함수
    setSortOption,      // 정렬 변경 함수
    clearFilters        // 필터 초기화 함수
  } = useProductStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  
  // 2️⃣ 정렬 옵션 데이터
  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'newest', label: '최신순' },
    { value: 'price-low', label: '가격 낮은순' },
    { value: 'price-high', label: '가격 높은순' }
  ]
  
  // 3️⃣ 검색 처리 함수
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    searchProducts(query)
  }
  
  return (
    <div className="space-y-6">
      {/* 4️⃣ 검색 및 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-96">
          <SearchBar
            placeholder="브랜드, 상품명으로 검색"
            onSearch={handleSearch}
          />
        </div>
        
        <div className="flex items-center gap-4">
          {/* 정렬 선택 */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* 필터 초기화 버튼 */}
          <Button variant="outline" size="sm" onClick={clearFilters}>
            필터 초기화
          </Button>
        </div>
      </div>
      
      {/* 5️⃣ 검색 결과 정보 */}
      <div className="text-sm text-gray-600">
        {searchQuery ? (
          <span>'{searchQuery}' 검색결과 {filteredProducts.length}개</span>
        ) : (
          <span>전체 {filteredProducts.length}개 상품</span>
        )}
      </div>
      
      {/* 6️⃣ 상품 그리드 */}
      <ProductGrid products={filteredProducts} isLoading={isLoading} />
    </div>
  )
}
```

**🔑 학습 포인트**:
- 한 페이지에서 여러 컴포넌트와 스토어 조합하기
- `as SortOption` 타입 단언 사용하기
- 반응형 레이아웃 (`flex-col sm:flex-row`)

---

## 🎯 7단계: 타입 안전성

### 타입 정의 (`src/types/product.ts`)

```tsx
// 1️⃣ 기본 인터페이스 정의
export interface Product {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number    // ?는 선택적 속성 (없을 수도 있음)
  discountRate?: number
  images: string[]          // 배열 타입
  sizes: Size[]
  colors: Color[]
  isNew: boolean
  isBest: boolean
  // ... 기타 속성들
}

// 2️⃣ 중첩된 인터페이스
export interface Size {
  id: string
  name: string
  available: boolean
}

// 3️⃣ 유니온 타입 (여러 값 중 하나)
export type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating'

// 4️⃣ 제네릭 타입
export interface ApiResponse<T> {
  success: boolean
  data: T                   // T는 실제 사용할 때 결정됨
  message?: string
}

// 사용 예시: ApiResponse<Product[]> = Product 배열을 담은 API 응답
```

**🔑 학습 포인트**:
- `interface` = 객체의 모양 정의
- `type` = 타입 별칭, 유니온 타입 등
- `?` = 선택적 속성 (undefined일 수 있음)
- `[]` = 배열 타입
- `<T>` = 제네릭 (재사용 가능한 타입)

---

## 🚀 8단계: 실제 적용해보기

### 초급자 연습 과제

1. **새로운 Badge 컴포넌트 만들기**
   ```tsx
   // src/components/ui/NewBadge.tsx
   interface NewBadgeProps {
     text: string
     color: 'red' | 'blue' | 'green'
   }
   
   export default function NewBadge({ text, color }: NewBadgeProps) {
     // 여기서 구현해보세요!
   }
   ```

2. **카테고리 필터 기능 추가하기**
   ```tsx
   // useProductStore.ts에 새 함수 추가
   setCategory: (category: string) => {
     // 카테고리별 필터링 로직 구현해보세요!
   }
   ```

3. **로딩 스켈레톤 UI 만들기**
   ```tsx
   // ProductGrid에서 isLoading일 때 보여줄 스켈레톤
   function ProductSkeleton() {
     return (
       <div className="animate-pulse">
         <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
         <div className="h-4 bg-gray-200 rounded mb-2"></div>
         <div className="h-3 bg-gray-200 rounded w-1/2"></div>
       </div>
     )
   }
   ```

---

## 📝 9단계: 핵심 개념 정리

### 🔑 꼭 기억해야 할 것들

1. **컴포넌트 설계 원칙**
   - 한 가지 책임만 갖기
   - Props로 외부에서 제어 가능하게 만들기
   - 재사용 가능하게 만들기

2. **상태관리 패턴**
   - UI 상태 = 컴포넌트 내부 (`useState`)
   - 전역 상태 = Zustand 스토어
   - 서버 상태 = API 호출 결과

3. **TypeScript 활용**
   - Props 인터페이스 정의하기
   - 이벤트 핸들러 타입 지정하기
   - API 응답 타입 정의하기

4. **Tailwind CSS 패턴**
   - 반응형: `sm:`, `md:`, `lg:`
   - 상태: `hover:`, `focus:`, `active:`
   - 그룹: `group`, `group-hover:`

### 🎯 다음 학습 단계

1. **중급 과정**
   - API 연동 (fetch, axios)
   - 폼 validation (react-hook-form)
   - 이미지 최적화

2. **고급 과정**
   - 서버 사이드 렌더링 (SSR)
   - 성능 최적화 (memo, useMemo)
   - 테스트 작성 (Jest, Testing Library)

---

## 📚 추가 학습 자료

### 공식 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

### 유용한 도구들
- [VS Code](https://code.visualstudio.com/) - 코드 에디터
- [React Developer Tools](https://react.dev/learn/react-developer-tools) - 브라우저 확장
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - VS Code 확장

---

이 가이드를 따라하면 초급 개발자도 현대적인 React 쇼핑몰을 만들 수 있습니다! 🎉

**Happy Coding! 💻✨**