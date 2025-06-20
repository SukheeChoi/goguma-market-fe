# 📦 주문 및 결제 시스템 구현 가이드

이 문서는 고구마 마켓의 주문 및 결제 시스템 구현 방법을 상세히 설명합니다.

## 📋 목차

1. [주문 프로세스 플로우](#주문-프로세스-플로우)
2. [주문 타입 정의](#주문-타입-정의)
3. [주문 Store 구현](#주문-store-구현)
4. [주문서 페이지 구현](#주문서-페이지-구현)
5. [결제 연동](#결제-연동)

---

## 주문 프로세스 플로우

```
장바구니 → 주문서 작성 → 배송지 입력 → 결제 수단 선택 → 결제 진행 → 주문 완료
```

---

## 주문 타입 정의

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
  PENDING = 'PENDING',           // 주문 대기중
  CONFIRMED = 'CONFIRMED',       // 주문 확인됨
  PREPARING = 'PREPARING',       // 상품 준비중
  SHIPPED = 'SHIPPED',          // 배송중
  DELIVERED = 'DELIVERED',      // 배송 완료
  CANCELLED = 'CANCELLED',      // 주문 취소
  REFUNDED = 'REFUNDED'         // 환불 완료
}

export enum PaymentMethod {
  CARD = 'CARD',                          // 신용카드
  BANK_TRANSFER = 'BANK_TRANSFER',        // 계좌이체
  KAKAO_PAY = 'KAKAO_PAY',               // 카카오페이
  NAVER_PAY = 'NAVER_PAY',               // 네이버페이
  TOSS = 'TOSS'                          // 토스페이
}

export enum PaymentStatus {
  PENDING = 'PENDING',         // 결제 대기중
  COMPLETED = 'COMPLETED',     // 결제 완료
  FAILED = 'FAILED',          // 결제 실패
  CANCELLED = 'CANCELLED',     // 결제 취소
  REFUNDED = 'REFUNDED'       // 환불 완료
}
```

---

## 주문 Store 구현

### 🛒 useOrderStore.ts 완전 해설 - 초급 개발자용 가이드

#### 1. 📋 기본 구조 이해하기

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

#### 2. 🏪 Store 인터페이스 정의

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

#### 3. 📝 완전한 TypeScript 구현

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

#### 4. 🔄 전체 주문 플로우

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

---

## 주문서 페이지 구현

### 🎯 체크아웃 페이지 코드 완전 해설 - 초급 개발자용

#### 1. 📋 코드 한 줄씩 상세 분석

```typescript
// src/app/checkout/page.tsx - 각 라인별 완전 설명

// 1행: 'use client' 
'use client'
// 🔍 의미: "이 컴포넌트는 브라우저에서 실행해 주세요"
// - Next.js는 기본적으로 서버에서 컴포넌트를 렌더링함
// - 하지만 사용자 상호작용(클릭, 입력 등)이 필요하면 브라우저에서 실행해야 함
// - useRouter, useState 같은 훅을 쓰려면 필수

// 3행: import 문 - 타입 가져오기
import {PaymentMethod, ShippingAddress} from "@/types/order";
// 🔍 의미: 다른 파일에서 타입을 가져오기
// - PaymentMethod: 결제 방법 타입 (카드, 계좌이체 등)
// - ShippingAddress: 배송 주소 타입 (이름, 주소, 전화번호 등)
// - @/types/order에서 가져옴 (@는 src 폴더를 의미)

// 4행: JSX 타입 import
import {JSX} from "react";
// 🔍 의미: JSX 관련 타입을 React에서 가져오기
// - JSX.Element: 함수가 반환하는 JSX의 타입을 명시할 때 사용

// 5행: Next.js 라우터 import
import {useRouter} from "next/navigation";
// 🔍 의미: 페이지 이동 기능을 가져오기
// - useRouter: 다른 페이지로 이동할 때 사용하는 훅
// - 예: 주문 완료 후 완료 페이지로 이동

// 6행: Cart Store import
import {useCartStore} from "@/store";
// 🔍 의미: 장바구니 상태 관리 훅 가져오기
// - items: 장바구니에 담긴 상품들
// - getTotalItems: 장바구니 총 상품 개수

// 7행: Order Store import
import {useOrderStore} from "@/store/useOrderStore";
// 🔍 의미: 주문 상태 관리 훅 가져오기
// - createOrder: 장바구니에서 주문 생성
// - setShippingAddress: 배송지 설정
// - setPaymentMethod: 결제 방법 설정
// - submitOrder: 서버로 주문 전송

// 9-11행: 인터페이스 정의
interface FormData extends ShippingAddress {
    paymentMethod: PaymentMethod
}
// 🔍 의미: 폼에서 사용할 데이터 구조 정의
// - FormData: 체크아웃 폼의 모든 데이터
// - extends ShippingAddress: 배송 주소의 모든 필드를 상속
// - paymentMethod: 결제 방법 필드를 추가
// - 결과: 배송 주소 + 결제 방법이 합쳐진 타입

// 13행: 컴포넌트 함수 시작
export default function CheckoutPage(): JSX.Element {
// 🔍 의미: 체크아웃 페이지 컴포넌트
// - export default: 이 함수를 다른 곳에서 사용할 수 있게 내보내기
// - CheckoutPage: 컴포넌트 이름
// - (): JSX.Element: 이 함수는 JSX를 반환한다는 의미

// 14행: 페이지 이동 기능 사용
const router = useRouter()
// 🔍 의미: 페이지 이동 기능을 router 변수에 저장
// - router.push('/success'): 성공 페이지로 이동
// - router.back(): 이전 페이지로 돌아가기

// 15행: 장바구니 상태 가져오기
const { items, getTotalItems } = useCartStore()
// 🔍 의미: 장바구니 store에서 필요한 데이터와 함수 가져오기
// - items: 장바구니에 담긴 상품 배열
// - getTotalItems: 장바구니 총 상품 개수를 계산하는 함수
// - 구조 분해 할당으로 필요한 것만 추출

// 16행: 주문 상태 가져오기
const { createOrder, setShippingAddress, setPaymentMethod, submitOrder, shippingAddress } = useOrderStore();
// 🔍 의미: 주문 store에서 필요한 함수들 가져오기
// - createOrder: 장바구니 상품들로 주문 생성
// - setShippingAddress: 배송지 정보 저장
// - setPaymentMethod: 결제 방법 저장
// - submitOrder: 서버로 주문 전송
// - shippingAddress: 저장된 배송지 정보
```

#### 2. 💡 각 코드의 역할과 연결 관계

```
🔄 데이터 흐름:
장바구니(useCartStore) → 주문 생성(createOrder) → 폼 입력 → 서버 전송(submitOrder)

📱 사용자 인터랙션:
1. 사용자가 배송지 입력
2. 결제 방법 선택  
3. "결제하기" 버튼 클릭
4. submitOrder() 실행
5. 결제 페이지로 이동(router.push)
```

#### 3. 🚀 아직 작성해야 할 부분들

```typescript
// 앞으로 추가해야 할 코드들:

// 1. useState로 폼 상태 관리
const [formData, setFormData] = useState<FormData>({
  recipient: '',
  phone: '',
  // ... 기타 필드들
})

// 2. 폼 제출 처리 함수
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // 주문 생성 및 제출 로직
}

// 3. JSX 반환 (UI 구성)
return (
  <div>
    <form onSubmit={handleSubmit}>
      {/* 배송지 입력 필드들 */}
      {/* 결제 방법 선택 */}
      {/* 제출 버튼 */}
    </form>
  </div>
)
```

#### 4. 🎯 초급 개발자 핵심 포인트

1. **'use client'**: 브라우저 기능 사용시 필수
2. **import**: 필요한 타입과 함수들을 가져오는 것
3. **interface extends**: 기존 타입에 새 필드 추가
4. **const { } = store()**: 필요한 것만 추출해서 사용
5. **JSX.Element**: 반환 타입을 명확히 하는 것

```typescript
// src/app/checkout/page.tsx - 완전한 예시
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
        {/* 주문 정보 입력 폼 */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 배송지 정보 섹션 */}
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">배송지 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    받는 사람
                  </label>
                  <input
                    type="text"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleInputChange}
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
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
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
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
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
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg mb-2"
                    required
                  />
                  <input
                    type="text"
                    name="detailAddress"
                    value={formData.detailAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="상세주소"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    배송 메모
                  </label>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                    placeholder="배송 시 요청사항을 입력해주세요"
                  />
                </div>
              </div>
            </section>
            
            {/* 결제 수단 섹션 */}
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
                      onChange={(e) => setFormData({
                        ...formData, 
                        paymentMethod: e.target.value as PaymentMethod
                      })}
                      className="mr-2"
                    />
                    <span>{getPaymentMethodLabel(method)}</span>
                  </label>
                ))}
              </div>
            </section>
            
            <Button
              type="submit"
              className="w-full lg:hidden"
              size="lg"
              loading={loading}
            >
              결제하기
            </Button>
          </form>
        </div>
        
        {/* 주문 요약 사이드바 */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-4">
            <h2 className="text-lg font-semibold mb-4">주문 요약</h2>
            
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div 
                  key={`${item.productId}-${item.selectedSize.id}-${item.selectedColor.id}`} 
                  className="flex justify-between"
                >
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.selectedSize.name} / {item.selectedColor.name} / {item.quantity}개
                    </p>
                  </div>
                  <p className="font-medium">
                    {(item.product.price * item.quantity).toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span>{getTotalPrice().toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span>{getTotalPrice() >= 50000 ? '무료' : '3,000원'}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>총 결제 금액</span>
                <span>
                  {(getTotalPrice() + (getTotalPrice() >= 50000 ? 0 : 3000)).toLocaleString()}원
                </span>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full mt-6 hidden lg:block"
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

---

## Order Service 구현

### 🛠️ orderService.ts - 주문 API 통신 레이어

```typescript
// src/services/orderService.ts
import { api } from '@/lib/api'
import type { Order, OrderStatus } from '@/types/order'

/**
 * 주문 관련 API 서비스
 * useOrderStore에서 사용하는 실제 API 통신 로직
 */

// 주문 생성 (서버로 주문 정보 전송)
export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  try {
    const response = await api.post<Order>('/orders', orderData)
    return response.data
  } catch (error) {
    console.error('주문 생성 실패:', error)
    throw new Error('주문을 생성할 수 없습니다.')
  }
}

// 주문 목록 조회
export async function getOrders(): Promise<Order[]> {
  try {
    const response = await api.get<Order[]>('/orders')
    return response.data
  } catch (error) {
    console.error('주문 목록 조회 실패:', error)
    throw new Error('주문 목록을 불러올 수 없습니다.')
  }
}

// 특정 주문 조회
export async function getOrder(orderId: string): Promise<Order> {
  try {
    const response = await api.get<Order>(`/orders/${orderId}`)
    return response.data
  } catch (error) {
    console.error('주문 조회 실패:', error)
    throw new Error('주문 정보를 불러올 수 없습니다.')
  }
}

// 주문 취소
export async function cancelOrder(orderId: string): Promise<void> {
  try {
    await api.patch(`/orders/${orderId}/cancel`, {
      status: OrderStatus.CANCELLED
    })
  } catch (error) {
    console.error('주문 취소 실패:', error)
    throw new Error('주문을 취소할 수 없습니다.')
  }
}

// 주문 상태 업데이트
export async function updateOrderStatus(
  orderId: string, 
  status: OrderStatus
): Promise<Order> {
  try {
    const response = await api.patch<Order>(`/orders/${orderId}/status`, {
      status
    })
    return response.data
  } catch (error) {
    console.error('주문 상태 업데이트 실패:', error)
    throw new Error('주문 상태를 업데이트할 수 없습니다.')
  }
}
```

---

## 결제 연동

### 🎯 토스페이먼츠 테스트 환경 구현 가이드

토스페이먼츠 테스트 API를 사용하면 **실제 결제 없이** 전체 결제 플로우를 구현하고 테스트할 수 있습니다.

#### 1. 📋 사전 준비

1. **토스페이먼츠 가입 및 테스트 키 발급**
   - [토스페이먼츠 개발자센터](https://developers.tosspayments.com) 가입
   - 테스트 API 키 발급 (무료)
   - Client Key: `test_ck_...` (test_로 시작)
   - Secret Key: `test_sk_...` (test_로 시작)

2. **환경 변수 설정**
   ```bash
   # .env.local
   NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_테스트클라이언트키
   TOSS_SECRET_KEY=test_sk_테스트시크릿키
   ```

3. **패키지 설치**
   ```bash
   npm install @tosspayments/payment-sdk
   ```

#### 2. 🛠️ Payment Service 구현

```typescript
// src/services/paymentService.ts
import { loadTossPayments } from '@tosspayments/payment-sdk'
import type { Order } from '@/types/order'

class PaymentService {
  private tossPayments: any
  private clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

  async initialize() {
    if (!this.tossPayments) {
      this.tossPayments = await loadTossPayments(this.clientKey)
    }
  }

  async requestPayment(order: Order) {
    await this.initialize()

    // 토스페이먼츠 결제창 호출
    await this.tossPayments.requestPayment('카드', {
      amount: order.totalAmount,
      orderId: order.orderNumber,
      orderName: this.generateOrderName(order),
      customerName: order.shippingAddress.recipient,
      customerEmail: 'test@test.com', // 테스트용 이메일
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    })
  }

  private generateOrderName(order: Order): string {
    const firstItem = order.items[0]
    if (order.items.length === 1) {
      return firstItem.product.name
    }
    return `${firstItem.product.name} 외 ${order.items.length - 1}건`
  }
}

export const paymentService = new PaymentService()
```

#### 3. 🔧 백엔드 API 구현 (Next.js API Routes)

```typescript
// src/app/api/payments/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as orderService from '@/services/orderService'

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json()

    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY!
    const encryptedSecretKey = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: encryptedSecretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    const paymentData = await tossResponse.json()

    if (!tossResponse.ok) {
      console.error('토스페이먼츠 에러:', paymentData)
      return NextResponse.json(
        { error: paymentData.message || '결제 승인 실패' },
        { status: tossResponse.status }
      )
    }

    // 주문 상태 업데이트
    await orderService.updateOrderStatus(orderId, 'COMPLETED')

    return NextResponse.json({
      success: true,
      payment: paymentData,
    })
  } catch (error) {
    console.error('결제 확인 에러:', error)
    return NextResponse.json(
      { error: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

#### 4. 📄 결제 페이지 구현

```typescript
// src/app/payment/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { paymentService } from '@/services/paymentService'
import { orderService } from '@/services/orderService'
import type { Order } from '@/types/order'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [params.id])

  const loadOrder = async () => {
    try {
      const orderData = await orderService.getOrder(params.id as string)
      setOrder(orderData)
    } catch (error) {
      console.error('주문 조회 실패:', error)
      alert('주문 정보를 불러올 수 없습니다.')
      router.push('/checkout')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!order || processing) return

    setProcessing(true)
    try {
      await paymentService.requestPayment(order)
      // 결제창이 열리면 사용자가 결제를 진행
      // 성공/실패는 successUrl/failUrl로 리다이렉트됨
    } catch (error) {
      console.error('결제 요청 실패:', error)
      alert('결제 요청 중 오류가 발생했습니다.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>주문 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">결제하기</h1>
      
      {/* 주문 정보 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">주문 정보</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">주문번호</span>
            <span className="font-medium">{order?.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">주문자</span>
            <span className="font-medium">{order?.shippingAddress.recipient}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">배송지</span>
            <span className="font-medium text-right">
              {order?.shippingAddress.address} {order?.shippingAddress.detailAddress}
            </span>
          </div>
        </div>
      </div>

      {/* 결제 금액 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">결제 금액</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">상품 금액</span>
            <span>{order?.totalAmount.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">배송비</span>
            <span>{order?.shippingFee.toLocaleString()}원</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>총 결제 금액</span>
              <span className="text-blue-600">
                {((order?.totalAmount || 0) + (order?.shippingFee || 0)).toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 테스트 결제 안내 */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <span className="text-yellow-600 mr-2">ℹ️</span>
          <div>
            <p className="font-semibold text-yellow-800">테스트 결제 안내</p>
            <p className="text-sm text-yellow-700 mt-1">
              실제 결제가 이루어지지 않는 테스트 환경입니다.
            </p>
            <div className="mt-3 text-sm text-yellow-700">
              <p className="font-medium mb-1">테스트 카드 정보:</p>
              <ul className="space-y-1 ml-4">
                <li>• 카드번호: 4242-4242-4242-4242</li>
                <li>• 유효기간: 아무 미래 날짜 (예: 12/25)</li>
                <li>• CVC: 아무 3자리 숫자 (예: 123)</li>
                <li>• 비밀번호: 아무 2자리 숫자 (예: 00)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        disabled={processing}
        className={`w-full py-4 rounded-lg font-medium transition-colors ${
          processing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
            처리 중...
          </span>
        ) : (
          '토스페이로 결제하기'
        )}
      </button>

      {/* 취소 버튼 */}
      <button
        onClick={() => router.push('/checkout')}
        className="w-full mt-3 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
      >
        주문서로 돌아가기
      </button>
    </div>
  )
}
```

#### 5. ✅ 결제 성공 페이지

```typescript
// src/app/payment/success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')

  useEffect(() => {
    confirmPayment()
  }, [])

  const confirmPayment = async () => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      setStatus('error')
      return
    }

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      })

      if (response.ok) {
        setStatus('success')
        // 3초 후 주문 완료 페이지로 이동
        setTimeout(() => {
          router.push(`/order/complete/${orderId}`)
        }, 3000)
      } else {
        throw new Error('결제 승인 실패')
      }
    } catch (error) {
      console.error('결제 확인 실패:', error)
      setStatus('error')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">결제를 처리하고 있습니다</h2>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">결제가 완료되었습니다</h2>
            <p className="text-gray-600">주문 완료 페이지로 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">결제 처리 중 오류가 발생했습니다</h2>
            <button
              onClick={() => router.push('/checkout')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              주문서로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

#### 6. ❌ 결제 실패 페이지

```typescript
// src/app/payment/fail/page.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function PaymentFailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('code')
  const errorMessage = searchParams.get('message')

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold mb-2">결제에 실패했습니다</h2>
        
        {errorMessage && (
          <p className="text-gray-600 mb-4">{errorMessage}</p>
        )}
        
        {errorCode && (
          <p className="text-sm text-gray-500 mb-6">오류 코드: {errorCode}</p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도하기
          </button>
          
          <button
            onClick={() => router.push('/checkout')}
            className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            주문서로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### 7. 🧪 테스트 시나리오

**정상 결제 테스트**
1. 테스트 카드 정보 입력
2. 결제 진행
3. 성공 페이지로 이동

**결제 실패 테스트**
- 카드번호: 4000-0000-0000-0002 (잔액 부족)
- 카드번호: 4000-0000-0000-0069 (유효기간 오류)

**테스트 환경 특징**
- 실제 돈이 이동하지 않음
- 토스페이먼츠 대시보드에서 테스트 결제 내역 확인 가능
- 웹훅 테스트 가능
- 다양한 결제 시나리오 테스트 가능

### 결제 성공/실패 페이지

```typescript
// src/app/payment/success/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { paymentService } from '@/services/paymentService'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')

      if (!paymentKey || !orderId || !amount) {
        router.push('/payment/fail')
        return
      }

      try {
        await paymentService.confirmPayment(
          paymentKey,
          orderId,
          Number(amount)
        )
        
        router.push(`/order/complete/${orderId}`)
      } catch (error) {
        console.error('결제 확인 실패:', error)
        router.push('/payment/fail')
      }
    }

    confirmPayment()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>결제를 처리하고 있습니다...</p>
    </div>
  )
}
```

---

## 💡 구현 팁

### 1. 보안 고려사항
- 결제 정보는 절대 프론트엔드에 저장하지 않음
- 결제 승인은 반드시 백엔드에서 처리
- HTTPS 환경에서만 결제 기능 제공

### 2. UX 개선
- 주문 과정 중 이탈 방지를 위한 진행 상태 표시
- 자동 저장 기능으로 입력 내용 유지
- 명확한 에러 메시지 제공

### 3. 테스트
- 각 결제 수단별 테스트 케이스 작성
- 실패 시나리오 대응 (네트워크 오류, 잔액 부족 등)
- 결제 취소/환불 프로세스 테스트

### 4. 모니터링
- 결제 성공률 추적
- 에러 로그 수집 및 분석
- 사용자 피드백 수집

---

## 🚀 다음 단계

1. 주문 관리 페이지 구현
2. 주문 상태 추적 기능
3. 배송 추적 연동
4. 주문 취소/교환/환불 프로세스
5. 영수증 발급 기능

이 가이드를 따라 구현하면 완전한 주문 및 결제 시스템을 갖출 수 있습니다.