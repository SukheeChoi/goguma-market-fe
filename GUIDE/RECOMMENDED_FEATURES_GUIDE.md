# 고구마 마켓 추가 기능 구현 가이드

이 문서는 현재 프로젝트에서 추가로 구현하면 좋을 기능들과 구현 방법을 설명합니다.

## 목차
1. [우선순위 높은 기능](#1-우선순위-높은-기능)
2. [주문 및 결제 시스템](#2-주문-및-결제-시스템)
3. [리뷰 및 평점 시스템](#3-리뷰-및-평점-시스템)
4. [실시간 알림 시스템](#4-실시간-알림-시스템)
5. [고급 필터링 및 정렬](#5-고급-필터링-및-정렬)
6. [상품 비교 기능](#6-상품-비교-기능)
7. [쿠폰 및 포인트 시스템](#7-쿠폰-및-포인트-시스템)
8. [상품 상세 개선](#8-상품-상세-개선)
9. [검색 고도화](#9-검색-고도화)
10. [PWA 구현](#10-pwa-구현)
11. [관리자 대시보드](#11-관리자-대시보드)
12. [AI 추천 시스템](#12-ai-추천-시스템)

---

## 1. 우선순위 높은 기능

### 구현 우선순위 및 예상 개발 시간

| 순위 | 기능 | 중요도 | 난이도 | 예상 시간 | 비즈니스 임팩트 |
|------|------|--------|--------|-----------|-----------------|
| 1 | 주문/결제 시스템 | ⭐⭐⭐⭐⭐ | 🔥🔥🔥🔥 | 2-3주 | 매출 직접 연결 |
| 2 | 리뷰 시스템 | ⭐⭐⭐⭐⭐ | 🔥🔥🔥 | 1-2주 | 구매 전환율 30% ↑ |
| 3 | 고급 필터링 | ⭐⭐⭐⭐ | 🔥🔥 | 3-5일 | UX 개선 |
| 4 | PWA | ⭐⭐⭐⭐ | 🔥🔥🔥 | 1주 | 모바일 사용성 ↑ |
| 5 | 쿠폰/포인트 | ⭐⭐⭐⭐ | 🔥🔥🔥 | 1-2주 | 재구매율 25% ↑ |
| 6 | 실시간 알림 | ⭐⭐⭐ | 🔥🔥 | 1주 | 사용자 인게이지먼트 ↑ |
| 7 | 상품 비교 | ⭐⭐⭐ | 🔥🔥 | 3-5일 | 구매 결정 도움 |
| 8 | 검색 고도화 | ⭐⭐⭐ | 🔥🔥🔥 | 1-2주 | 상품 발견성 ↑ |

---

## 2. 주문 및 결제 시스템

### 주문 프로세스 플로우

```
장바구니 → 주문서 작성 → 배송지 입력 → 결제 수단 선택 → 결제 진행 → 주문 완료
```

### 주문 타입 정의

```typescript
// src/types/order.ts
import type { Product, Size, Color } from './product'

export interface ShippingAddress {
  recipient: string         // 수령인 이름
  phone: string            // 연락처
  zipCode: string          // 우편번호
  address: string          // 기본 주소
  detailAddress: string    // 상세 주소
  memo?: string            // 배송 메모 (선택사항)
}

export interface OrderItem {
  productId: string        // 상품 ID
  product: Product         // 상품 정보
  selectedSize: Size       // 선택한 사이즈
  selectedColor: Color     // 선택한 색상
  quantity: number         // 수량
  price: number           // 단가
}

export interface Order {
  id: string                      // 주문 고유 ID
  orderNumber: string            // 주문 번호
  userId: string                 // 사용자 ID
  items: OrderItem[]             // 주문 상품 목록
  shippingAddress: ShippingAddress  // 배송지 정보
  paymentMethod: PaymentMethod      // 결제 방법
  paymentStatus: PaymentStatus      // 결제 상태
  orderStatus: OrderStatus          // 주문 상태
  totalAmount: number              // 총 금액
  shippingFee: number             // 배송비
  discountAmount: number          // 할인 금액
  pointsUsed: number              // 사용 포인트
  couponUsed?: string             // 사용 쿠폰 코드 (선택사항)
  createdAt: string               // 생성일시
  updatedAt: string               // 수정일시
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  KAKAO_PAY = 'KAKAO_PAY',
  NAVER_PAY = 'NAVER_PAY',
  TOSS = 'TOSS'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}
```

### 주문 Store 구현

## 🛒 useOrderStore.ts 완전 해설 - 초급 개발자용 가이드

### 1. 📋 기본 구조 이해하기

```typescript
// src/store/useOrderStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 🎯 useOrderStore는 주문과 관련된 모든 상태와 동작을 관리하는 저장소입니다
// Zustand의 create 함수로 만들어지며, persist 미들웨어로 데이터를 localStorage에 저장합니다
```

**💡 왜 Zustand를 사용하나요?**
- Redux보다 간단하고 보일러플레이트 코드가 적음
- TypeScript 지원이 우수함
- persist 미들웨어로 새로고침해도 데이터 유지 가능

### 2. 🏗️ 타입 정의 (Types)

```typescript
// 🏷️ 배송 주소 정보를 담는 인터페이스
interface ShippingAddress {
  recipient: string      // 받는 사람 이름
  phone: string         // 전화번호
  zipCode: string       // 우편번호
  address: string       // 기본 주소
  detailAddress: string // 상세 주소
  memo?: string         // 배송 메모 (선택사항)
}

// 🛍️ 주문할 상품 정보를 담는 인터페이스
interface OrderItem {
  productId: string     // 상품 고유 ID
  product: Product      // 상품 전체 정보
  selectedSize: Size    // 선택한 사이즈
  selectedColor: Color  // 선택한 색상
  quantity: number      // 주문 수량
  price: number         // 상품 가격
}

// 📄 완성된 주문 정보를 담는 인터페이스
interface Order {
  id: string                    // 주문 고유 ID
  orderNumber: string          // 주문번호 (예: ORD-20241215-001)
  userId: string               // 주문한 사용자 ID
  items: OrderItem[]           // 주문 상품 목록
  shippingAddress: ShippingAddress  // 배송지 정보
  paymentMethod: PaymentMethod // 결제 방법
  paymentStatus: PaymentStatus // 결제 상태
  orderStatus: OrderStatus     // 주문 상태
  totalAmount: number          // 총 주문 금액
  shippingFee: number         // 배송비
  discountAmount: number      // 할인 금액
  pointsUsed: number          // 사용한 포인트
  couponUsed?: string         // 사용한 쿠폰 (선택사항)
  createdAt: string           // 주문 생성 시간
  updatedAt: string           // 주문 수정 시간
}
```

### 3. 🔢 Enum 상수 정의

```typescript
// 📦 주문 상태를 나타내는 열거형
export enum OrderStatus {
  PENDING = 'PENDING',       // 주문 대기중
  CONFIRMED = 'CONFIRMED',   // 주문 확인됨
  PREPARING = 'PREPARING',   // 상품 준비중
  SHIPPED = 'SHIPPED',       // 배송중
  DELIVERED = 'DELIVERED',   // 배송 완료
  CANCELLED = 'CANCELLED',   // 주문 취소
  REFUNDED = 'REFUNDED'      // 환불 완료
}

// 💳 결제 방법을 나타내는 열거형
export enum PaymentMethod {
  CARD = 'CARD',                   // 신용카드
  BANK_TRANSFER = 'BANK_TRANSFER', // 계좌이체
  KAKAO_PAY = 'KAKAO_PAY',        // 카카오페이
  NAVER_PAY = 'NAVER_PAY',        // 네이버페이
  TOSS = 'TOSS'                   // 토스페이
}

// 💰 결제 상태를 나타내는 열거형
export enum PaymentStatus {
  PENDING = 'PENDING',     // 결제 대기중
  COMPLETED = 'COMPLETED', // 결제 완료
  FAILED = 'FAILED',       // 결제 실패
  CANCELLED = 'CANCELLED', // 결제 취소
  REFUNDED = 'REFUNDED'    // 환불 완료
}
```

**💡 Enum을 사용하는 이유:**
- 오타 방지 (자동완성 지원)
- 코드 가독성 향상
- 유지보수 용이성

### 4. 🏪 Store 인터페이스 정의

```typescript
interface OrderState {
  // 📊 상태(State) - 데이터를 저장하는 공간
  currentOrder: Partial<Order> | null  // 현재 진행중인 주문 (일부 정보만 있을 수 있음)
  orders: Order[]                      // 완료된 주문 목록
  shippingAddress: ShippingAddress | null  // 기본 배송지 정보
  
  // 🎬 액션(Actions) - 상태를 변경하는 함수들
  createOrder: (items: CartItem[]) => void              // 장바구니에서 주문 생성
  setShippingAddress: (address: ShippingAddress) => void // 배송지 설정
  setPaymentMethod: (method: PaymentMethod) => void      // 결제 방법 설정
  submitOrder: () => Promise<Order>                      // 주문 제출 (서버로 전송)
  getOrders: () => Promise<Order[]>                      // 주문 목록 조회
  getOrder: (id: string) => Promise<Order>               // 특정 주문 조회
  cancelOrder: (id: string) => Promise<void>             // 주문 취소
}
```

### 5. 🏗️ Store 구현 - 핵심 로직

```typescript
// 필요한 import 추가
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCartStore } from './useCartStore'
import * as orderService from '@/services/orderService'

export const useOrderStore = create<OrderState>()(
  // 🔄 persist 미들웨어로 데이터 영속성 보장
  persist(
    (set, get) => ({
      // 🏁 초기 상태값들
      currentOrder: null,     // 진행중인 주문 없음
      orders: [],            // 빈 주문 목록
      shippingAddress: null, // 저장된 배송지 없음
      
      // 🛒 createOrder: 장바구니 아이템들을 주문으로 변환
      createOrder: (items: CartItem[]): void => {
        // 1️⃣ 장바구니 아이템을 주문 아이템 형태로 변환
        const orderItems: OrderItem[] = items.map((item: CartItem) => ({
          productId: item.productId,
          product: item.product,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
          price: item.product.price  // 현재 상품 가격 저장
        }))
        
        // 2️⃣ 총 주문 금액 계산 (상품가격 × 수량의 합)
        const totalAmount: number = orderItems.reduce(
          (sum: number, item: OrderItem) => sum + (item.price * item.quantity), 
          0
        )
        
        // 3️⃣ 배송비 계산 (5만원 이상 무료배송)
        const shippingFee: number = totalAmount >= 50000 ? 0 : 3000
        
        // 4️⃣ 현재 주문 정보 저장
        set({
          currentOrder: {
            items: orderItems,
            totalAmount,
            shippingFee,
            discountAmount: 0,    // 초기값: 할인 없음
            pointsUsed: 0         // 초기값: 포인트 사용 없음
          } as Partial<Order>
        })
      },
      
      // 🏠 setShippingAddress: 배송지 정보 설정
      setShippingAddress: (address: ShippingAddress): void => {
        set((state: OrderState) => ({
          shippingAddress: address,  // 기본 배송지로 저장
          currentOrder: state.currentOrder ? {
            ...state.currentOrder,    // 기존 주문 정보 유지
            shippingAddress: address  // 배송지만 업데이트
          } : null
        }))
      },
      
      // 💳 setPaymentMethod: 결제 방법 설정
      setPaymentMethod: (method: PaymentMethod): void => {
        set((state: OrderState) => ({
          currentOrder: state.currentOrder ? {
            ...state.currentOrder,     // 기존 주문 정보 유지
            paymentMethod: method      // 결제 방법만 업데이트
          } : null
        }))
      },
```

### 6. 🚀 비동기 작업 처리 (Async Actions)

```typescript
      // 📤 submitOrder: 서버로 주문 전송 및 처리
      submitOrder: async (): Promise<Order> => {
        const { currentOrder } = get()  // 현재 상태에서 주문 정보 가져오기
        
        // ❌ 주문 정보가 없으면 에러 발생
        if (!currentOrder) throw new Error('No current order')
        
        try {
          // 🌐 서버 API 호출하여 주문 생성
          const response: Order = await orderService.createOrder(currentOrder)
          
          // ✅ 주문 성공 후 상태 업데이트
          set({
            currentOrder: null,                    // 진행중인 주문 초기화
            orders: [...get().orders, response]   // 완료된 주문 목록에 추가
          })
          
          // 🛒 주문 완료 후 장바구니 비우기
          useCartStore.getState().clearCart()
          
          return response  // 생성된 주문 정보 반환
          
        } catch (error) {
          // 🚨 에러 발생 시 적절한 처리
          console.error('주문 제출 실패:', error)
          throw error  // 에러를 호출한 곳으로 전달
        }
      },
      
      // 📋 getOrders: 사용자의 모든 주문 목록 조회
      getOrders: async (): Promise<Order[]> => {
        try {
          const orders: Order[] = await orderService.getOrders()  // 서버에서 주문 목록 가져오기
          set({ orders })  // 상태에 저장
          return orders    // 주문 목록 반환
        } catch (error) {
          console.error('주문 목록 조회 실패:', error)
          throw error
        }
      },
      
      // 🔍 getOrder: 특정 주문의 상세 정보 조회
      getOrder: async (id: string): Promise<Order> => {
        try {
          return await orderService.getOrder(id)  // 서버에서 특정 주문 조회
        } catch (error) {
          console.error('주문 조회 실패:', error)
          throw error
        }
      },
      
      // ❌ cancelOrder: 주문 취소 처리
      cancelOrder: async (id: string): Promise<void> => {
        try {
          await orderService.cancelOrder(id)  // 서버에 취소 요청
          
          // 로컬 상태에서도 주문 상태를 취소로 변경
          const orders: Order[] = get().orders.map((order: Order) =>
            order.id === id 
              ? { ...order, orderStatus: OrderStatus.CANCELLED }  // 해당 주문만 취소 상태로
              : order  // 다른 주문들은 그대로 유지
          )
          set({ orders })  // 업데이트된 주문 목록 저장
          
        } catch (error) {
          console.error('주문 취소 실패:', error)
          throw error
        }
      }
    }),
```

### 7. 💾 데이터 영속성 (Persistence) 설정

```typescript
    {
      name: 'order-storage',  // localStorage에 저장될 키 이름
      partialize: (state: OrderState) => ({ 
        shippingAddress: state.shippingAddress  // 배송지 정보만 저장 (보안상 주문 정보는 제외)
      })
    }
  )
)
```

**💡 왜 배송지만 저장하나요?**
- 보안: 주문 정보는 민감한 데이터이므로 브라우저에 저장하지 않음
- 편의성: 자주 사용하는 배송지는 저장해서 재사용
- 성능: 필요한 데이터만 저장하여 용량 절약

### 8. 🎯 실제 사용 예제

```typescript
// 필요한 import
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrderStore } from '@/store/useOrderStore'
import { useCartStore } from '@/store/useCartStore'
import type { Order } from '@/types/order'

// 주문서 페이지에서 사용하는 방법
function CheckoutPage(): JSX.Element {
  const router = useRouter()
  
  const { 
    currentOrder,           // 현재 주문 정보
    createOrder,           // 주문 생성 함수
    setShippingAddress,    // 배송지 설정 함수
    setPaymentMethod,      // 결제 방법 설정 함수
    submitOrder            // 주문 제출 함수
  } = useOrderStore()
  
  const { items } = useCartStore()  // 장바구니 아이템들
  
  // 🛒 장바구니에서 주문 생성
  useEffect(() => {
    if (items.length > 0) {
      createOrder(items)
    }
  }, [items, createOrder])
  
  // 📋 주문 제출 핸들러
  const handleSubmitOrder = async (): Promise<void> => {
    try {
      const order: Order = await submitOrder()
      console.log('주문 완료:', order)
      // 주문 완료 페이지로 이동
      router.push(`/order-complete/${order.id}`)
    } catch (error) {
      console.error('주문 실패:', error)
      alert('주문 처리 중 오류가 발생했습니다.')
    }
  }
  
  return (
    <div>
      {/* 주문 정보 표시 */}
      {currentOrder && (
        <div>
          <h2>주문 정보</h2>
          <p>총 금액: {currentOrder.totalAmount?.toLocaleString()}원</p>
          <p>배송비: {currentOrder.shippingFee?.toLocaleString()}원</p>
        </div>
      )}
      
      {/* 주문 제출 버튼 */}
      <button onClick={handleSubmitOrder}>
        주문하기
      </button>
    </div>
  )
}
```

### 9. 🔄 전체 주문 플로우

```
1. 🛒 장바구니에서 "주문하기" 클릭
   ↓
2. 📋 createOrder() 호출 → currentOrder 생성
   ↓
3. 🏠 배송지 입력 → setShippingAddress() 호출
   ↓
4. 💳 결제 방법 선택 → setPaymentMethod() 호출
   ↓
5. 🚀 "결제하기" 클릭 → submitOrder() 호출
   ↓
6. ✅ 서버 처리 완료 → orders 배열에 추가
   ↓
7. 🛒 장바구니 자동 비우기
   ↓
8. 📄 주문 완료 페이지로 이동
```

**💡 핵심 포인트:**
- **상태 관리**: Zustand로 주문 관련 모든 상태를 중앙 집중 관리
- **타입 안전성**: TypeScript로 모든 데이터 타입을 명확히 정의
- **에러 처리**: try-catch로 API 호출 시 발생할 수 있는 오류 처리
- **데이터 영속성**: 새로고침해도 배송지 정보는 유지
- **보안**: 민감한 주문 정보는 localStorage에 저장하지 않음

### 10. 📝 완전한 TypeScript 구현 예제

```typescript
// src/store/useOrderStore.ts - 전체 코드
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCartStore } from './useCartStore'
import * as orderService from '@/services/orderService'
import type { 
  Order, 
  OrderItem, 
  ShippingAddress, 
  OrderStatus, 
  PaymentMethod, 
  PaymentStatus,
  CartItem 
} from '@/types'

interface OrderState {
  // State
  currentOrder: Partial<Order> | null
  orders: Order[]
  shippingAddress: ShippingAddress | null
  
  // Actions
  createOrder: (items: CartItem[]) => void
  setShippingAddress: (address: ShippingAddress) => void
  setPaymentMethod: (method: PaymentMethod) => void
  submitOrder: () => Promise<Order>
  getOrders: () => Promise<Order[]>
  getOrder: (id: string) => Promise<Order>
  cancelOrder: (id: string) => Promise<void>
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentOrder: null,
      orders: [],
      shippingAddress: null,
      
      // Create order from cart items
      createOrder: (items: CartItem[]): void => {
        const orderItems: OrderItem[] = items.map((item: CartItem) => ({
          productId: item.productId,
          product: item.product,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
          price: item.product.price
        }))
        
        const totalAmount: number = orderItems.reduce(
          (sum: number, item: OrderItem) => sum + (item.price * item.quantity), 
          0
        )
        
        const shippingFee: number = totalAmount >= 50000 ? 0 : 3000
        
        set({
          currentOrder: {
            items: orderItems,
            totalAmount,
            shippingFee,
            discountAmount: 0,
            pointsUsed: 0
          } as Partial<Order>
        })
      },
      
      // Set shipping address
      setShippingAddress: (address: ShippingAddress): void => {
        set((state: OrderState) => ({
          shippingAddress: address,
          currentOrder: state.currentOrder ? {
            ...state.currentOrder,
            shippingAddress: address
          } : null
        }))
      },
      
      // Set payment method
      setPaymentMethod: (method: PaymentMethod): void => {
        set((state: OrderState) => ({
          currentOrder: state.currentOrder ? {
            ...state.currentOrder,
            paymentMethod: method
          } : null
        }))
      },
      
      // Submit order to server
      submitOrder: async (): Promise<Order> => {
        const { currentOrder } = get()
        
        if (!currentOrder) {
          throw new Error('No current order')
        }
        
        try {
          const response: Order = await orderService.createOrder(currentOrder)
          
          set({
            currentOrder: null,
            orders: [...get().orders, response]
          })
          
          useCartStore.getState().clearCart()
          
          return response
        } catch (error) {
          console.error('주문 제출 실패:', error)
          throw error
        }
      },
      
      // Get all orders
      getOrders: async (): Promise<Order[]> => {
        try {
          const orders: Order[] = await orderService.getOrders()
          set({ orders })
          return orders
        } catch (error) {
          console.error('주문 목록 조회 실패:', error)
          throw error
        }
      },
      
      // Get single order
      getOrder: async (id: string): Promise<Order> => {
        try {
          return await orderService.getOrder(id)
        } catch (error) {
          console.error('주문 조회 실패:', error)
          throw error
        }
      },
      
      // Cancel order
      cancelOrder: async (id: string): Promise<void> => {
        try {
          await orderService.cancelOrder(id)
          
          const orders: Order[] = get().orders.map((order: Order) =>
            order.id === id 
              ? { ...order, orderStatus: OrderStatus.CANCELLED }
              : order
          )
          set({ orders })
        } catch (error) {
          console.error('주문 취소 실패:', error)
          throw error
        }
      }
    }),
    {
      name: 'order-storage',
      partialize: (state: OrderState) => ({ 
        shippingAddress: state.shippingAddress
      })
    }
  )
)
```

### 주문서 페이지 구현

```typescript
// src/app/checkout/page.tsx
'use client'

import { useCartStore, useOrderStore, useUserStore } from '@/store'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { PaymentMethod } from '@/types/order'
import type { ShippingAddress, Order } from '@/types/order'

interface FormData extends ShippingAddress {
  paymentMethod: PaymentMethod
}

export default function CheckoutPage(): JSX.Element {
  const router = useRouter()
  const { items, getTotalPrice } = useCartStore()
  const { createOrder, setShippingAddress, setPaymentMethod, submitOrder, shippingAddress } = useOrderStore()
  const { user } = useUserStore()
  
  const [loading, setLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState<FormData>({
    recipient: user?.name || '',
    phone: user?.phone || '',
    zipCode: '',
    address: '',
    detailAddress: '',
    memo: '',
    paymentMethod: PaymentMethod.CARD
  })
  
  // 저장된 배송지 정보 불러오기
  useEffect(() => {
    if (shippingAddress) {
      setFormData(prev => ({
        ...prev,
        ...shippingAddress
      }))
    }
  }, [shippingAddress])
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 주문 생성
      createOrder(items)
      
      // 배송지 설정
      const addressData: ShippingAddress = {
        recipient: formData.recipient,
        phone: formData.phone,
        zipCode: formData.zipCode,
        address: formData.address,
        detailAddress: formData.detailAddress,
        memo: formData.memo
      }
      setShippingAddress(addressData)
      
      // 결제 수단 설정
      setPaymentMethod(formData.paymentMethod)
      
      // 주문 제출
      const order: Order = await submitOrder()
      
      // 결제 페이지로 이동
      router.push(`/payment/${order.id}`)
    } catch (error) {
      console.error('주문 실패:', error)
      alert('주문 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">주문/결제</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 주문 정보 입력 */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 배송지 정보 */}
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">배송지 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    받는 사람
                  </label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    연락처
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    우편번호
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      className="flex-1 px-4 py-2 border rounded-lg"
                      required
                    />
                    <Button type="button" variant="outline">
                      우편번호 찾기
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg mb-2"
                    required
                  />
                  <input
                    type="text"
                    value={formData.detailAddress}
                    onChange={(e) => setFormData({...formData, detailAddress: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="상세주소"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    배송 메모
                  </label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({...formData, memo: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                    placeholder="배송 시 요청사항을 입력해주세요"
                  />
                </div>
              </div>
            </section>
            
            {/* 결제 수단 */}
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">결제 수단</h2>
              
              <div className="space-y-2">
                {Object.values(PaymentMethod).map((method) => (
                  <label key={method} className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={formData.paymentMethod === method}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                      className="mr-2"
                    />
                    <span>{getPaymentMethodLabel(method)}</span>
                  </label>
                ))}
              </div>
            </section>
          </form>
        </div>
        
        {/* 주문 요약 */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-4">
            <h2 className="text-lg font-semibold mb-4">주문 요약</h2>
            
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={`${item.productId}-${item.selectedSize.id}-${item.selectedColor.id}`} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.selectedSize.name} / {item.selectedColor.name} / {item.quantity}개
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span>{getTotalPrice() >= 50000 ? '무료' : '3,000원'}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>총 결제 금액</span>
                <span>{formatPrice(getTotalPrice() + (getTotalPrice() >= 50000 ? 0 : 3000))}</span>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              loading={loading}
              onClick={handleSubmit}
            >
              결제하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels = {
    [PaymentMethod.CARD]: '신용/체크카드',
    [PaymentMethod.BANK_TRANSFER]: '무통장입금',
    [PaymentMethod.KAKAO_PAY]: '카카오페이',
    [PaymentMethod.NAVER_PAY]: '네이버페이',
    [PaymentMethod.TOSS]: '토스'
  }
  return labels[method]
}
```

### 결제 연동 (토스페이먼츠 예시)

```typescript
// src/services/paymentService.ts
import { loadTossPayments } from '@tosspayments/payment-sdk'

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

export class PaymentService {
  private tossPayments: any

  async initialize() {
    this.tossPayments = await loadTossPayments(clientKey)
  }

  async requestPayment(order: Order) {
    if (!this.tossPayments) {
      await this.initialize()
    }

    await this.tossPayments.requestPayment('카드', {
      amount: order.totalAmount,
      orderId: order.orderNumber,
      orderName: `${order.items[0].product.name} 외 ${order.items.length - 1}건`,
      customerName: order.shippingAddress.recipient,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    })
  }

  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    const response = await fetch('/api/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    if (!response.ok) {
      throw new Error('결제 승인 실패')
    }

    return response.json()
  }
}

export const paymentService = new PaymentService()
```

---

## 3. 리뷰 및 평점 시스템

### 리뷰 타입 정의

```typescript
// src/types/review.ts
export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number // 1-5
  title: string
  content: string
  images?: string[]
  isVerifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

export interface ReviewStats {
  averageRating: number
  totalCount: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}
```

### 리뷰 컴포넌트

```typescript
// src/components/shop/ReviewSection.tsx
'use client'

import { useState } from 'react'
import { Button, Badge } from '@/components/ui'
import { useUserStore } from '@/store'

interface ReviewSectionProps {
  productId: string
  reviews: Review[]
  stats: ReviewStats
}

export default function ReviewSection({ productId, reviews, stats }: ReviewSectionProps) {
  const [sortBy, setSortBy] = useState<'latest' | 'helpful' | 'rating'>('latest')
  const { user } = useUserStore()
  
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'helpful':
        return b.helpfulCount - a.helpfulCount
      case 'rating':
        return b.rating - a.rating
      default:
        return 0
    }
  })
  
  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">상품 리뷰 ({stats.totalCount})</h2>
        {user && (
          <Button variant="outline">리뷰 작성하기</Button>
        )}
      </div>
      
      {/* 평점 통계 */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</p>
            <div className="flex justify-center my-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(stats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-gray-600">{stats.totalCount}개 리뷰</p>
          </div>
          
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2 mb-1">
                <span className="text-sm w-4">{rating}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${(stats.ratingDistribution[rating] / stats.totalCount) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {stats.ratingDistribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 정렬 옵션 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy('latest')}
          className={`px-4 py-2 rounded ${sortBy === 'latest' ? 'bg-black text-white' : 'bg-gray-200'}`}
        >
          최신순
        </button>
        <button
          onClick={() => setSortBy('helpful')}
          className={`px-4 py-2 rounded ${sortBy === 'helpful' ? 'bg-black text-white' : 'bg-gray-200'}`}
        >
          도움순
        </button>
        <button
          onClick={() => setSortBy('rating')}
          className={`px-4 py-2 rounded ${sortBy === 'rating' ? 'bg-black text-white' : 'bg-gray-200'}`}
        >
          평점순
        </button>
      </div>
      
      {/* 리뷰 목록 */}
      <div className="space-y-6">
        {sortedReviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}

function ReviewItem({ review }: { review: Review }) {
  const [isHelpful, setIsHelpful] = useState(false)
  
  return (
    <div className="border-b pb-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="font-semibold">{review.userName}</span>
            {review.isVerifiedPurchase && (
              <Badge variant="new" className="text-xs">구매 인증</Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {formatDate(review.createdAt, 'short')}
          </p>
        </div>
      </div>
      
      {review.title && (
        <h4 className="font-semibold mb-2">{review.title}</h4>
      )}
      
      <p className="text-gray-700 mb-4">{review.content}</p>
      
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`리뷰 이미지 ${index + 1}`}
              className="w-20 h-20 object-cover rounded"
            />
          ))}
        </div>
      )}
      
      <button
        onClick={() => setIsHelpful(!isHelpful)}
        className={`text-sm ${isHelpful ? 'text-blue-600' : 'text-gray-600'}`}
      >
        👍 도움이 됐어요 ({review.helpfulCount + (isHelpful ? 1 : 0)})
      </button>
    </div>
  )
}
```

### 리뷰 작성 모달

```typescript
// src/components/shop/ReviewModal.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface ReviewModalProps {
  productId: string
  onClose: () => void
  onSubmit: (review: any) => void
}

export default function ReviewModal({ productId, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData()
    formData.append('productId', productId)
    formData.append('rating', rating.toString())
    formData.append('title', title)
    formData.append('content', content)
    
    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image)
    })
    
    onSubmit(formData)
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">리뷰 작성</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 별점 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">평점</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl"
                >
                  <svg
                    className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="리뷰 제목을 입력하세요"
            />
          </div>
          
          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium mb-2">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              rows={5}
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요"
              required
            />
          </div>
          
          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium mb-2">사진 첨부</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files || []))}
              className="w-full"
            />
          </div>
          
          {/* 버튼 */}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              리뷰 등록
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## 4. 실시간 알림 시스템

### 알림 타입 정의

```typescript
// src/types/notification.ts
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
}

export enum NotificationType {
  RESTOCK = 'RESTOCK',
  SALE_START = 'SALE_START',
  ORDER_STATUS = 'ORDER_STATUS',
  WISHLIST_SALE = 'WISHLIST_SALE',
  REVIEW_RESPONSE = 'REVIEW_RESPONSE',
  COUPON = 'COUPON'
}
```

### 웹 푸시 알림 설정

```typescript
// src/lib/pushNotification.ts
export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null

  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported')
      return
    }

    try {
      // 서비스 워커 등록
      this.registration = await navigator.serviceWorker.register('/sw.js')
      
      // 알림 권한 요청
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission denied')
        return
      }
      
      // 푸시 구독
      await this.subscribeToPush()
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
    }
  }

  private async subscribeToPush() {
    if (!this.registration) return

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        )
      })

      // 서버에 구독 정보 전송
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      })
    } catch (error) {
      console.error('Failed to subscribe to push:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  async showNotification(title: string, options: NotificationOptions) {
    if (!this.registration) return

    await this.registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      ...options
    })
  }
}

export const pushNotificationService = new PushNotificationService()
```

### 서비스 워커

```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {}
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: data.data,
    actions: data.actions || []
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})
```

### 알림 Store

```typescript
// src/store/useNotificationStore.ts
import { create } from 'zustand'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  
  // Actions
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))
    
    // 브라우저 알림 표시
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png'
      })
    }
  },
  
  markAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))
  },
  
  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }))
  },
  
  deleteNotification: (id) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === id)
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: notification && !notification.read 
          ? state.unreadCount - 1 
          : state.unreadCount
      }
    })
  },
  
  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
  }
}))
```

---

## 5. 고급 필터링 및 정렬

### 필터 컴포넌트

```typescript
// src/components/shop/AdvancedFilter.tsx
'use client'

import { useState } from 'react'
import { useProductStore } from '@/store'
import { Button } from '@/components/ui'

export default function AdvancedFilter() {
  const { filters, setFilters, categories, brands } = useProductStore()
  const [isOpen, setIsOpen] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 1000000])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  
  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sizes: selectedSizes,
      colors: selectedColors
    })
    setIsOpen(false)
  }
  
  const handleResetFilters = () => {
    setPriceRange([0, 1000000])
    setSelectedSizes([])
    setSelectedColors([])
    setFilters({})
  }
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        필터
      </Button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white shadow-lg rounded-lg p-6 w-80 z-50">
          <h3 className="font-semibold mb-4">상세 필터</h3>
          
          {/* 가격 범위 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">가격 범위</label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>
          </div>
          
          {/* 사이즈 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">사이즈</label>
            <div className="grid grid-cols-4 gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSizes(
                      selectedSizes.includes(size)
                        ? selectedSizes.filter(s => s !== size)
                        : [...selectedSizes, size]
                    )
                  }}
                  className={`py-1 px-2 border rounded text-sm ${
                    selectedSizes.includes(size)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          {/* 색상 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">색상</label>
            <div className="grid grid-cols-6 gap-2">
              {[
                { id: 'black', hex: '#000000' },
                { id: 'white', hex: '#FFFFFF' },
                { id: 'gray', hex: '#808080' },
                { id: 'navy', hex: '#000080' },
                { id: 'beige', hex: '#F5F5DC' },
                { id: 'brown', hex: '#8B4513' }
              ].map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    setSelectedColors(
                      selectedColors.includes(color.id)
                        ? selectedColors.filter(c => c !== color.id)
                        : [...selectedColors, color.id]
                    )
                  }}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColors.includes(color.id)
                      ? 'border-blue-500'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>
          
          {/* 버튼 */}
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="flex-1">
              필터 적용
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              초기화
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 6. 상품 비교 기능

### 비교 Store

```typescript
// src/store/useCompareStore.ts
import { create } from 'zustand'
import { Product } from '@/types'

interface CompareState {
  items: Product[]
  isOpen: boolean
  
  // Actions
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  clearAll: () => void
  toggleCompare: () => void
}

export const useCompareStore = create<CompareState>((set, get) => ({
  items: [],
  isOpen: false,
  
  addItem: (product) => {
    const { items } = get()
    if (items.length >= 3) {
      alert('최대 3개까지 비교할 수 있습니다.')
      return
    }
    
    if (items.find(item => item.id === product.id)) {
      alert('이미 비교함에 있는 상품입니다.')
      return
    }
    
    set({ items: [...items, product], isOpen: true })
  },
  
  removeItem: (productId) => {
    set(state => ({
      items: state.items.filter(item => item.id !== productId)
    }))
  },
  
  clearAll: () => {
    set({ items: [], isOpen: false })
  },
  
  toggleCompare: () => {
    set(state => ({ isOpen: !state.isOpen }))
  }
}))
```

### 비교 테이블 컴포넌트

```typescript
// src/components/shop/CompareTable.tsx
'use client'

import { useCompareStore } from '@/store'
import { Button } from '@/components/ui'

export default function CompareTable() {
  const { items, removeItem, clearAll, isOpen, toggleCompare } = useCompareStore()
  
  if (!isOpen || items.length === 0) return null
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">상품 비교 ({items.length}/3)</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearAll}>
              전체 삭제
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleCompare}>
              닫기
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2">항목</th>
                {items.map((item) => (
                  <th key={item.id} className="p-2">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover mx-auto mb-2"
                      />
                      <h4 className="text-sm font-medium">{item.name}</h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-0 right-0 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 font-medium">가격</td>
                {items.map((item) => (
                  <td key={item.id} className="p-2 text-center">
                    {formatPrice(item.price)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 font-medium">브랜드</td>
                {items.map((item) => (
                  <td key={item.id} className="p-2 text-center">
                    {item.brand}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 font-medium">평점</td>
                {items.map((item) => (
                  <td key={item.id} className="p-2 text-center">
                    ⭐ {item.rating} ({item.reviewCount})
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 font-medium">배송</td>
                {items.map((item) => (
                  <td key={item.id} className="p-2 text-center">
                    무료배송
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

---

## 7. 쿠폰 및 포인트 시스템

### 쿠폰 타입 정의

```typescript
// src/types/coupon.ts
export interface Coupon {
  id: string
  code: string
  name: string
  type: CouponType
  value: number // 할인율 또는 할인 금액
  minOrderAmount?: number
  maxDiscountAmount?: number
  validFrom: string
  validUntil: string
  isUsed: boolean
  usedAt?: string
}

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE', // 퍼센트 할인
  FIXED = 'FIXED' // 정액 할인
}

export interface UserPoint {
  userId: string
  balance: number
  history: PointHistory[]
}

export interface PointHistory {
  id: string
  type: 'EARN' | 'USE' | 'EXPIRE'
  amount: number
  description: string
  createdAt: string
  expiresAt?: string
}
```

### 쿠폰 적용 컴포넌트

```typescript
// src/components/shop/CouponSelector.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface CouponSelectorProps {
  availableCoupons: Coupon[]
  orderAmount: number
  onApply: (coupon: Coupon) => void
}

export default function CouponSelector({ 
  availableCoupons, 
  orderAmount, 
  onApply 
}: CouponSelectorProps) {
  const [selectedCouponId, setSelectedCouponId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  
  const applicableCoupons = availableCoupons.filter(coupon => {
    if (coupon.isUsed) return false
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) return false
    
    const now = new Date()
    const validFrom = new Date(coupon.validFrom)
    const validUntil = new Date(coupon.validUntil)
    
    return now >= validFrom && now <= validUntil
  })
  
  const calculateDiscount = (coupon: Coupon): number => {
    if (coupon.type === CouponType.PERCENTAGE) {
      const discount = orderAmount * (coupon.value / 100)
      return coupon.maxDiscountAmount 
        ? Math.min(discount, coupon.maxDiscountAmount)
        : discount
    }
    return coupon.value
  }
  
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">쿠폰 적용</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          쿠폰 선택 ({applicableCoupons.length}개 사용 가능)
        </Button>
      </div>
      
      {isOpen && (
        <div className="mt-4 space-y-2">
          {applicableCoupons.map((coupon) => (
            <label
              key={coupon.id}
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="coupon"
                value={coupon.id}
                checked={selectedCouponId === coupon.id}
                onChange={(e) => setSelectedCouponId(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium">{coupon.name}</p>
                <p className="text-sm text-gray-600">
                  {coupon.type === CouponType.PERCENTAGE
                    ? `${coupon.value}% 할인`
                    : `${formatPrice(coupon.value)} 할인`}
                  {coupon.minOrderAmount && (
                    <span> (최소 {formatPrice(coupon.minOrderAmount)})</span>
                  )}
                </p>
                <p className="text-sm text-red-500">
                  할인 금액: {formatPrice(calculateDiscount(coupon))}
                </p>
                <p className="text-xs text-gray-500">
                  유효기간: {formatDate(coupon.validUntil, 'short')}까지
                </p>
              </div>
            </label>
          ))}
          
          <Button
            onClick={() => {
              const coupon = applicableCoupons.find(c => c.id === selectedCouponId)
              if (coupon) {
                onApply(coupon)
                setIsOpen(false)
              }
            }}
            disabled={!selectedCouponId}
            className="w-full"
          >
            쿠폰 적용
          </Button>
        </div>
      )}
    </div>
  )
}
```

---

## 8. 상품 상세 개선

### 이미지 줌 기능

```typescript
// src/components/shop/ImageZoom.tsx
'use client'

import { useState } from 'react'

interface ImageZoomProps {
  src: string
  alt: string
}

export default function ImageZoom({ src, alt }: ImageZoomProps) {
  const [isZooming, setIsZooming] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPosition({ x, y })
  }
  
  return (
    <div className="relative overflow-hidden">
      <div
        className="relative cursor-zoom-in"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
      >
        <img src={src} alt={alt} className="w-full" />
        
        {isZooming && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${src})`,
              backgroundPosition: `${position.x}% ${position.y}%`,
              backgroundSize: '200%',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
      </div>
    </div>
  )
}
```

### 사이즈 가이드 모달

```typescript
// src/components/shop/SizeGuide.tsx
export default function SizeGuide({ category }: { category: string }) {
  const sizeCharts = {
    tops: {
      headers: ['사이즈', '어깨', '가슴', '총장', '소매'],
      data: [
        ['S', '44', '96', '66', '58'],
        ['M', '46', '100', '68', '59'],
        ['L', '48', '104', '70', '60'],
        ['XL', '50', '108', '72', '61']
      ]
    },
    bottoms: {
      headers: ['사이즈', '허리', '엉덩이', '허벅지', '총장'],
      data: [
        ['S', '76', '94', '58', '100'],
        ['M', '80', '98', '60', '102'],
        ['L', '84', '102', '62', '104'],
        ['XL', '88', '106', '64', '106']
      ]
    }
  }
  
  const chart = sizeCharts[category] || sizeCharts.tops
  
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">사이즈 가이드</h3>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {chart.headers.map((header) => (
              <th key={header} className="border p-2 text-sm">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.data.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border p-2 text-center text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>• 위 치수는 상품 실측 사이즈입니다. (단위: cm)</p>
        <p>• 측정 방법에 따라 1-3cm 오차가 있을 수 있습니다.</p>
      </div>
    </div>
  )
}
```

---

## 9. 검색 고도화

### 자동완성 검색

```typescript
// src/components/shop/AutocompleteSearch.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { searchService } from '@/services/searchService'

export default function AutocompleteSearch() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([])
      return
    }
    
    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const results = await searchService.getSuggestions(debouncedQuery)
        setSuggestions(results)
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSuggestions()
  }, [debouncedQuery])
  
  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="상품, 브랜드 검색"
        className="w-full px-4 py-2 pl-10 border rounded-lg"
      />
      
      {/* 검색 아이콘 */}
      <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      
      {/* 자동완성 드롭다운 */}
      {suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50">
          {/* 인기 검색어 */}
          <div className="p-3 border-b">
            <p className="text-sm font-medium text-gray-600 mb-2">인기 검색어</p>
            <div className="flex flex-wrap gap-2">
              {['나이키', '아디다스', '반팔', '청바지'].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
          
          {/* 검색 제안 */}
          <div className="p-3">
            <p className="text-sm font-medium text-gray-600 mb-2">추천 검색어</p>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => setQuery(suggestion.term)}
                className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center justify-between">
                  <span>{suggestion.term}</span>
                  <span className="text-sm text-gray-500">
                    {suggestion.productCount}개 상품
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 검색 필터

```typescript
// src/components/shop/SearchFilter.tsx
export default function SearchFilter({ 
  results, 
  onFilterChange 
}: { 
  results: any[], 
  onFilterChange: (filters: any) => void 
}) {
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    priceRange: '',
    sortBy: 'relevance'
  })
  
  // 검색 결과에서 카테고리/브랜드 추출
  const categories = [...new Set(results.map(r => r.category))]
  const brands = [...new Set(results.map(r => r.brand))]
  
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  return (
    <div className="flex gap-4 mb-6">
      <select
        value={filters.category}
        onChange={(e) => handleFilterChange('category', e.target.value)}
        className="px-4 py-2 border rounded-lg"
      >
        <option value="">전체 카테고리</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      
      <select
        value={filters.brand}
        onChange={(e) => handleFilterChange('brand', e.target.value)}
        className="px-4 py-2 border rounded-lg"
      >
        <option value="">전체 브랜드</option>
        {brands.map((brand) => (
          <option key={brand} value={brand}>{brand}</option>
        ))}
      </select>
      
      <select
        value={filters.sortBy}
        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        className="px-4 py-2 border rounded-lg ml-auto"
      >
        <option value="relevance">관련도순</option>
        <option value="price_asc">가격 낮은순</option>
        <option value="price_desc">가격 높은순</option>
        <option value="rating">평점순</option>
        <option value="reviews">리뷰 많은순</option>
      </select>
    </div>
  )
}
```

---

## 10. PWA 구현

### 💡 PWA(Progressive Web App)란?
웹사이트를 스마트폰 앱처럼 사용할 수 있게 만드는 기술입니다.
- **설치 가능**: 홈 화면에 아이콘 추가
- **오프라인 작동**: 인터넷 없어도 기본 기능 사용
- **푸시 알림**: 앱처럼 알림 받기
- **빠른 로딩**: 캐싱으로 속도 향상

### Next.js PWA 설정

```javascript
// next.config.js

// 💡 next-pwa 라이브러리 설정
// 먼저 설치: npm install next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',         // 서비스 워커 파일이 생성될 위치
  register: true,         // 서비스 워커 자동 등록
  skipWaiting: true,      // 새 버전 즉시 활성화
  disable: process.env.NODE_ENV === 'development'  // 개발 중엔 비활성화
})

module.exports = withPWA({
  // 기존 Next.js 설정
})
```

### Manifest 파일

```json
// public/manifest.json
{
  "name": "고구마 마켓",
  "short_name": "고구마마켓",
  "description": "온라인 패션 쇼핑몰",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 오프라인 지원

```javascript
// public/sw.js
const CACHE_NAME = 'goguma-market-v1'
const urlsToCache = [
  '/',
  '/offline',
  '/styles/globals.css',
  '/images/logo.png'
]

// 💡 서비스 워커의 생명주기
// 1. install: 서비스 워커가 처음 설치될 때
// 2. activate: 서비스 워커가 활성화될 때
// 3. fetch: 네트워크 요청이 발생할 때

// 📦 설치 이벤트 - 캐시에 파일 저장
self.addEventListener('install', (event) => {
  // 💡 event.waitUntil()이란?
  // 비동기 작업이 완료될 때까지 설치를 기다립니다
  event.waitUntil(
    caches.open(CACHE_NAME)  // 캐시 저장소 열기
      .then((cache) => cache.addAll(urlsToCache))  // 파일들을 캐시에 추가
  )
})

// 페치 이벤트
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시 응답
        if (response) {
          return response
        }
        
        // 네트워크 요청
        return fetch(event.request).catch(() => {
          // 오프라인 페이지 반환
          if (event.request.destination === 'document') {
            return caches.match('/offline')
          }
        })
      })
  )
})
```

### 설치 프롬프트

```typescript
// src/hooks/usePWA.ts
import { useState, useEffect } from 'react'

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  
  useEffect(() => {
    // 설치 프롬프트 이벤트 캡처
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    
    // 설치 상태 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
  
  const install = async () => {
    if (!installPrompt) return
    
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    
    setInstallPrompt(null)
  }
  
  return { install, isInstalled, canInstall: !!installPrompt }
}
```

---

## 11. 관리자 대시보드

### 대시보드 레이아웃

```typescript
// src/app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-xl font-bold">관리자 대시보드</h1>
        </div>
        <nav className="mt-8">
          <Link href="/admin" className="block px-4 py-2 hover:bg-gray-100">
            대시보드
          </Link>
          <Link href="/admin/products" className="block px-4 py-2 hover:bg-gray-100">
            상품 관리
          </Link>
          <Link href="/admin/orders" className="block px-4 py-2 hover:bg-gray-100">
            주문 관리
          </Link>
          <Link href="/admin/users" className="block px-4 py-2 hover:bg-gray-100">
            회원 관리
          </Link>
          <Link href="/admin/analytics" className="block px-4 py-2 hover:bg-gray-100">
            통계 분석
          </Link>
        </nav>
      </aside>
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

### 상품 관리 페이지

```typescript
// src/app/admin/products/page.tsx
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">상품 관리</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          새 상품 등록
        </Button>
      </div>
      
      {/* 상품 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상품명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                브랜드
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                가격
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                재고
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover mr-3"
                    />
                    <span>{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.brand}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.stock > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock > 0 ? '판매중' : '품절'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setSelectedProduct(product)
                      setIsModalOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    수정
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 상품 등록/수정 모달 */}
      {isModalOpen && (
        <ProductModal
          product={selectedProduct}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProduct(null)
          }}
          onSave={(product) => {
            // 상품 저장 로직
            setIsModalOpen(false)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}
```

---

## 12. AI 추천 시스템

### 추천 알고리즘

```typescript
// src/services/recommendationService.ts
export class RecommendationService {
  // 💡 협업 필터링이란?
  // "나와 비슷한 취향의 사람들이 좋아한 상품"을 추천하는 방식
  // 예: 넷플릭스에서 "당신과 취향이 비슷한 사용자들이 본 영화"
  async getCollaborativeRecommendations(userId: string): Promise<Product[]> {
    // 1️⃣ 내가 뭘 샀는지, 뭘 봤는지 분석
    const userHistory = await this.getUserHistory(userId)
    
    // 2️⃣ 나와 비슷한 쇼핑 패턴을 가진 사람들 찾기
    // 예: 나이키 운동화를 산 사람들 중에 아디다스 운동복도 산 사람들
    const similarUsers = await this.findSimilarUsers(userId, userHistory)
    
    // 3️⃣ 그 사람들이 산 상품 중에 내가 안 본 상품 추천
    const recommendations = await this.getRecommendationsFromSimilarUsers(
      userId, 
      similarUsers
    )
    
    return recommendations
  }
  
  // 컨텐츠 기반 추천
  async getContentBasedRecommendations(productId: string): Promise<Product[]> {
    const product = await productService.getProduct(productId)
    
    // 상품 특성 추출
    const features = {
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      priceRange: this.getPriceRange(product.price),
      style: this.extractStyle(product)
    }
    
    // 유사한 상품 찾기
    const similarProducts = await this.findSimilarProducts(features)
    
    return similarProducts
  }
  
  // 하이브리드 추천
  async getHybridRecommendations(
    userId: string, 
    context?: { time?: string, weather?: string, season?: string }
  ): Promise<Product[]> {
    // 1. 협업 필터링 추천
    const collaborative = await this.getCollaborativeRecommendations(userId)
    
    // 2. 사용자 선호도 기반 추천
    const preferences = await this.getUserPreferences(userId)
    const contentBased = await this.getPreferenceBasedRecommendations(preferences)
    
    // 3. 컨텍스트 기반 조정
    const contextAdjusted = this.adjustForContext([...collaborative, ...contentBased], context)
    
    // 4. 점수 계산 및 정렬
    const scored = this.scoreRecommendations(contextAdjusted, userId)
    
    return scored.slice(0, 20)
  }
  
  private getPriceRange(price: number): string {
    if (price < 30000) return 'low'
    if (price < 100000) return 'medium'
    return 'high'
  }
  
  private extractStyle(product: Product): string[] {
    // 상품 설명, 카테고리 등에서 스타일 키워드 추출
    const keywords = []
    if (product.description.includes('캐주얼')) keywords.push('casual')
    if (product.description.includes('포멀')) keywords.push('formal')
    if (product.description.includes('스포티')) keywords.push('sporty')
    return keywords
  }
}
```

### 개인화된 홈페이지

```typescript
// src/components/shop/PersonalizedHome.tsx
export default function PersonalizedHome({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState({
    forYou: [],
    trending: [],
    recentlyViewed: [],
    similarToLiked: []
  })
  
  useEffect(() => {
    const loadRecommendations = async () => {
      const [forYou, trending, similar] = await Promise.all([
        recommendationService.getHybridRecommendations(userId),
        recommendationService.getTrendingProducts(),
        recommendationService.getSimilarToLikedProducts(userId)
      ])
      
      setRecommendations({
        forYou,
        trending,
        recentlyViewed: useUserStore.getState().recentlyViewed,
        similarToLiked: similar
      })
    }
    
    loadRecommendations()
  }, [userId])
  
  return (
    <div className="space-y-12">
      {/* 맞춤 추천 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">당신을 위한 추천</h2>
        <ProductCarousel products={recommendations.forYou} />
      </section>
      
      {/* 트렌딩 상품 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">지금 인기있는 상품</h2>
        <ProductGrid products={recommendations.trending} />
      </section>
      
      {/* 최근 본 상품과 유사한 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">최근 본 상품과 비슷한</h2>
        <ProductCarousel products={recommendations.similarToLiked} />
      </section>
    </div>
  )
}
```

---

## 구현 로드맵

### Phase 1 (1-2주)
1. ✅ 주문/결제 시스템 기본 구현
2. ✅ 결제 게이트웨이 연동
3. ✅ 주문 상태 관리

### Phase 2 (1주)
1. ✅ 리뷰 시스템 구현
2. ✅ 평점 및 통계
3. ✅ 포토 리뷰

### Phase 3 (1주)
1. ✅ PWA 설정
2. ✅ 오프라인 지원
3. ✅ 푸시 알림

### Phase 4 (1-2주)
1. ✅ 고급 필터링
2. ✅ 검색 고도화
3. ✅ 쿠폰/포인트 시스템

### Phase 5 (2주)
1. ✅ 관리자 대시보드
2. ✅ 상품/주문 관리
3. ✅ 통계 분석

### Phase 6 (2주)
1. ✅ AI 추천 시스템
2. ✅ 개인화 기능
3. ✅ A/B 테스트

---

## 마무리

이 가이드에 제시된 기능들을 구현하면 완성도 높은 이커머스 플랫폼을 만들 수 있습니다. 각 기능은 독립적으로 구현 가능하며, 비즈니스 우선순위에 따라 선택적으로 적용할 수 있습니다.

### 핵심 성공 요소
1. **사용자 경험**: 직관적이고 빠른 쇼핑 경험
2. **성능 최적화**: 빠른 로딩과 반응성
3. **신뢰성**: 안정적인 결제와 배송
4. **개인화**: AI 기반 맞춤 추천
5. **모바일 최적화**: PWA로 앱 같은 경험

### 🎯 초급 개발자를 위한 학습 팁

#### 1. 작은 기능부터 시작하기
- ❌ 한 번에 모든 기능을 구현하려고 하지 마세요
- ✅ 리뷰 시스템 → 필터링 → 주문/결제 순으로 점진적 구현

#### 2. 코드 이해하고 작성하기
- ❌ 코드를 그대로 복사-붙여넣기만 하지 마세요
- ✅ 각 줄이 무엇을 하는지 이해하고, 주석을 달며 학습

#### 3. 에러를 두려워하지 않기
- ❌ 에러가 나면 포기하지 마세요
- ✅ 에러 메시지를 읽고, 구글링하고, 해결하는 과정이 성장입니다

#### 4. 문서화 습관
- ❌ 코드만 작성하고 끝내지 마세요
- ✅ 구현한 기능에 대한 문서를 작성하며 복습

#### 5. 커뮤니티 활용
- Stack Overflow, Reddit, 한국 개발자 커뮤니티 활용
- 질문할 때는 문제 상황을 구체적으로 설명

프로젝트의 성공을 위해 단계적으로 기능을 추가하고, 사용자 피드백을 바탕으로 지속적으로 개선해 나가시기 바랍니다. 화이팅! 🚀