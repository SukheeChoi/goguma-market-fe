# 🎟️ 쿠폰 및 포인트 시스템 구현 가이드

이 문서는 고구마 마켓의 쿠폰 및 포인트 시스템 구현 방법을 상세히 설명합니다.

## 📋 목차

1. [쿠폰 및 포인트 타입 정의](#쿠폰-및-포인트-타입-정의)
2. [쿠폰 시스템 구현](#쿠폰-시스템-구현)
3. [포인트 시스템 구현](#포인트-시스템-구현)
4. [쿠폰 및 포인트 UI](#쿠폰-및-포인트-ui)
5. [적용 로직 구현](#적용-로직-구현)

---

## 쿠폰 및 포인트 타입 정의

```typescript
// src/types/promotion.ts
export interface Coupon {
  id: string
  code: string
  name: string
  description: string
  type: CouponType
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number
  validFrom: string
  validTo: string
  usageLimit: number
  usedCount: number
  isActive: boolean
  applicableCategories: string[]
  applicableProducts: string[]
  excludeCategories: string[]
  excludeProducts: string[]
  createdAt: string
}

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',     // 퍼센트 할인
  FIXED_AMOUNT = 'FIXED_AMOUNT', // 정액 할인
  FREE_SHIPPING = 'FREE_SHIPPING' // 무료배송
}

export interface UserCoupon {
  id: string
  couponId: string
  coupon: Coupon
  userId: string
  isUsed: boolean
  usedAt?: string
  obtainedAt: string
}

export interface PointTransaction {
  id: string
  userId: string
  type: PointTransactionType
  amount: number
  balance: number
  description: string
  relatedOrderId?: string
  relatedCouponId?: string
  createdAt: string
}

export enum PointTransactionType {
  EARN_PURCHASE = 'EARN_PURCHASE',       // 구매 적립
  EARN_REVIEW = 'EARN_REVIEW',           // 리뷰 적립
  EARN_SIGNUP = 'EARN_SIGNUP',           // 가입 적립
  EARN_EVENT = 'EARN_EVENT',             // 이벤트 적립
  USE_ORDER = 'USE_ORDER',               // 주문 사용
  EXPIRE = 'EXPIRE',                     // 만료
  REFUND = 'REFUND'                      // 환불
}

export interface PointSettings {
  earnRate: number              // 적립률 (%)
  minEarnAmount: number         // 최소 적립 주문 금액
  maxEarnAmount: number         // 최대 적립 금액
  minUseAmount: number          // 최소 사용 포인트
  maxUseAmount: number          // 최대 사용 포인트
  maxUseRate: number           // 최대 사용 비율 (%)
  expiryMonths: number         // 포인트 유효기간 (개월)
}
```

---

## 쿠폰 시스템 구현

```typescript
// src/store/useCouponStore.ts
import { create } from 'zustand'
import type { Coupon, UserCoupon } from '@/types/promotion'
import * as couponService from '@/services/couponService'

interface CouponState {
  availableCoupons: Coupon[]
  userCoupons: UserCoupon[]
  isLoading: boolean
  
  // Actions
  fetchAvailableCoupons: () => Promise<void>
  fetchUserCoupons: () => Promise<void>
  applyCouponCode: (code: string) => Promise<UserCoupon>
  validateCoupon: (couponId: string, orderAmount: number, items: any[]) => boolean
  calculateDiscount: (coupon: Coupon, orderAmount: number) => number
  useCoupon: (couponId: string, orderId: string) => Promise<void>
}

export const useCouponStore = create<CouponState>((set, get) => ({
  availableCoupons: [],
  userCoupons: [],
  isLoading: false,
  
  fetchAvailableCoupons: async (): Promise<void> => {
    set({ isLoading: true })
    try {
      const coupons = await couponService.getAvailableCoupons()
      set({ availableCoupons: coupons })
    } catch (error) {
      console.error('쿠폰 조회 실패:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  fetchUserCoupons: async (): Promise<void> => {
    set({ isLoading: true })
    try {
      const userCoupons = await couponService.getUserCoupons()
      set({ userCoupons })
    } catch (error) {
      console.error('사용자 쿠폰 조회 실패:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  applyCouponCode: async (code: string): Promise<UserCoupon> => {
    try {
      const userCoupon = await couponService.applyCouponCode(code)
      set(state => ({
        userCoupons: [...state.userCoupons, userCoupon]
      }))
      return userCoupon
    } catch (error) {
      console.error('쿠폰 적용 실패:', error)
      throw error
    }
  },
  
  validateCoupon: (couponId: string, orderAmount: number, items: any[]): boolean => {
    const { userCoupons } = get()
    const userCoupon = userCoupons.find(uc => uc.couponId === couponId && !uc.isUsed)
    
    if (!userCoupon) return false
    
    const coupon = userCoupon.coupon
    const now = new Date()
    const validFrom = new Date(coupon.validFrom)
    const validTo = new Date(coupon.validTo)
    
    // 기본 검증
    if (!coupon.isActive || now < validFrom || now > validTo) {
      return false
    }
    
    // 최소 주문 금액 검증
    if (orderAmount < coupon.minOrderAmount) {
      return false
    }
    
    // 사용 횟수 제한 검증
    if (coupon.usedCount >= coupon.usageLimit) {
      return false
    }
    
    // 적용 가능한 카테고리/상품 검증
    if (coupon.applicableCategories.length > 0 || coupon.applicableProducts.length > 0) {
      const hasApplicableItem = items.some(item => {
        const categoryMatch = coupon.applicableCategories.length === 0 || 
          coupon.applicableCategories.includes(item.product.category)
        const productMatch = coupon.applicableProducts.length === 0 || 
          coupon.applicableProducts.includes(item.productId)
        return categoryMatch || productMatch
      })
      
      if (!hasApplicableItem) return false
    }
    
    // 제외 카테고리/상품 검증
    const hasExcludedItem = items.some(item => {
      return coupon.excludeCategories.includes(item.product.category) ||
             coupon.excludeProducts.includes(item.productId)
    })
    
    if (hasExcludedItem) return false
    
    return true
  },
  
  calculateDiscount: (coupon: Coupon, orderAmount: number): number => {
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        const percentageDiscount = Math.floor(orderAmount * coupon.discountValue / 100)
        return coupon.maxDiscountAmount 
          ? Math.min(percentageDiscount, coupon.maxDiscountAmount)
          : percentageDiscount
      
      case CouponType.FIXED_AMOUNT:
        return Math.min(coupon.discountValue, orderAmount)
      
      case CouponType.FREE_SHIPPING:
        return 0 // 배송비는 별도 처리
      
      default:
        return 0
    }
  },
  
  useCoupon: async (couponId: string, orderId: string): Promise<void> => {
    try {
      await couponService.useCoupon(couponId, orderId)
      set(state => ({
        userCoupons: state.userCoupons.map(uc =>
          uc.couponId === couponId
            ? { ...uc, isUsed: true, usedAt: new Date().toISOString() }
            : uc
        )
      }))
    } catch (error) {
      console.error('쿠폰 사용 실패:', error)
      throw error
    }
  }
}))
```

---

## 포인트 시스템 구현

```typescript
// src/store/usePointStore.ts
import { create } from 'zustand'
import type { PointTransaction, PointSettings } from '@/types/promotion'
import * as pointService from '@/services/pointService'

interface PointState {
  balance: number
  transactions: PointTransaction[]
  settings: PointSettings
  isLoading: boolean
  
  // Actions
  fetchBalance: () => Promise<void>
  fetchTransactions: (page?: number) => Promise<void>
  fetchSettings: () => Promise<void>
  earnPoints: (type: PointTransactionType, amount: number, description: string, relatedId?: string) => Promise<void>
  usePoints: (amount: number, orderId: string) => Promise<void>
  calculateEarnablePoints: (orderAmount: number) => number
  getMaxUsablePoints: (orderAmount: number) => number
}

export const usePointStore = create<PointState>((set, get) => ({
  balance: 0,
  transactions: [],
  settings: {
    earnRate: 1,
    minEarnAmount: 10000,
    maxEarnAmount: 10000,
    minUseAmount: 1000,
    maxUseAmount: 100000,
    maxUseRate: 50,
    expiryMonths: 12
  },
  isLoading: false,
  
  fetchBalance: async (): Promise<void> => {
    try {
      const balance = await pointService.getBalance()
      set({ balance })
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error)
    }
  },
  
  fetchTransactions: async (page = 1): Promise<void> => {
    set({ isLoading: true })
    try {
      const transactions = await pointService.getTransactions(page)
      set(state => ({
        transactions: page === 1 ? transactions : [...state.transactions, ...transactions]
      }))
    } catch (error) {
      console.error('포인트 내역 조회 실패:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  fetchSettings: async (): Promise<void> => {
    try {
      const settings = await pointService.getSettings()
      set({ settings })
    } catch (error) {
      console.error('포인트 설정 조회 실패:', error)
    }
  },
  
  earnPoints: async (
    type: PointTransactionType, 
    amount: number, 
    description: string, 
    relatedId?: string
  ): Promise<void> => {
    try {
      const transaction = await pointService.earnPoints({
        type,
        amount,
        description,
        relatedOrderId: type === PointTransactionType.EARN_PURCHASE ? relatedId : undefined,
        relatedCouponId: type === PointTransactionType.EARN_EVENT ? relatedId : undefined
      })
      
      set(state => ({
        balance: state.balance + amount,
        transactions: [transaction, ...state.transactions]
      }))
    } catch (error) {
      console.error('포인트 적립 실패:', error)
      throw error
    }
  },
  
  usePoints: async (amount: number, orderId: string): Promise<void> => {
    const { balance } = get()
    
    if (amount > balance) {
      throw new Error('사용 가능한 포인트가 부족합니다')
    }
    
    try {
      const transaction = await pointService.usePoints(amount, orderId)
      
      set(state => ({
        balance: state.balance - amount,
        transactions: [transaction, ...state.transactions]
      }))
    } catch (error) {
      console.error('포인트 사용 실패:', error)
      throw error
    }
  },
  
  calculateEarnablePoints: (orderAmount: number): number => {
    const { settings } = get()
    
    if (orderAmount < settings.minEarnAmount) {
      return 0
    }
    
    const earnedPoints = Math.floor(orderAmount * settings.earnRate / 100)
    return Math.min(earnedPoints, settings.maxEarnAmount)
  },
  
  getMaxUsablePoints: (orderAmount: number): number => {
    const { balance, settings } = get()
    
    // 최대 사용 비율 적용
    const maxByRate = Math.floor(orderAmount * settings.maxUseRate / 100)
    
    // 설정된 최대 사용 금액과 비교
    const maxByAmount = Math.min(settings.maxUseAmount, maxByRate)
    
    // 실제 보유 포인트와 비교
    return Math.min(balance, maxByAmount)
  }
}))
```

---

## 쿠폰 및 포인트 UI

```typescript
// src/components/shop/CouponPointPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { useCouponStore, usePointStore } from '@/store'
import { Button, Input } from '@/components/ui'
import type { UserCoupon } from '@/types/promotion'

interface CouponPointPanelProps {
  orderAmount: number
  orderItems: any[]
  onCouponApply: (coupon: UserCoupon | null) => void
  onPointUse: (amount: number) => void
}

export default function CouponPointPanel({
  orderAmount,
  orderItems,
  onCouponApply,
  onPointUse
}: CouponPointPanelProps) {
  const [couponCode, setCouponCode] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [showCoupons, setShowCoupons] = useState(false)
  
  const {
    userCoupons,
    fetchUserCoupons,
    applyCouponCode,
    validateCoupon,
    calculateDiscount
  } = useCouponStore()
  
  const {
    balance,
    fetchBalance,
    getMaxUsablePoints,
    calculateEarnablePoints
  } = usePointStore()
  
  useEffect(() => {
    fetchUserCoupons()
    fetchBalance()
  }, [fetchUserCoupons, fetchBalance])
  
  const availableCoupons = userCoupons.filter(uc => 
    !uc.isUsed && validateCoupon(uc.couponId, orderAmount, orderItems)
  )
  
  const maxUsablePoints = getMaxUsablePoints(orderAmount)
  const earnablePoints = calculateEarnablePoints(orderAmount)
  
  const handleApplyCouponCode = async () => {
    if (!couponCode.trim()) return
    
    try {
      const userCoupon = await applyCouponCode(couponCode.trim())
      setCouponCode('')
      alert('쿠폰이 적용되었습니다!')
    } catch (error) {
      alert('유효하지 않은 쿠폰 코드입니다.')
    }
  }
  
  const handleSelectCoupon = (coupon: UserCoupon | null) => {
    setSelectedCoupon(coupon)
    onCouponApply(coupon)
  }
  
  const handlePointChange = (amount: number) => {
    const validAmount = Math.max(0, Math.min(amount, maxUsablePoints))
    setPointsToUse(validAmount)
    onPointUse(validAmount)
  }
  
  const formatCouponName = (coupon: UserCoupon): string => {
    const { type, discountValue } = coupon.coupon
    
    switch (type) {
      case 'PERCENTAGE':
        return `${discountValue}% 할인`
      case 'FIXED_AMOUNT':
        return `${discountValue.toLocaleString()}원 할인`
      case 'FREE_SHIPPING':
        return '무료배송'
      default:
        return coupon.coupon.name
    }
  }
  
  const getDiscountAmount = (coupon: UserCoupon): number => {
    return calculateDiscount(coupon.coupon, orderAmount)
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* 쿠폰 섹션 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">쿠폰</h3>
        
        {/* 쿠폰 코드 입력 */}
        <div className="flex gap-2 mb-4">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="쿠폰 코드를 입력하세요"
            className="flex-1"
          />
          <Button onClick={handleApplyCouponCode}>적용</Button>
        </div>
        
        {/* 보유 쿠폰 목록 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              사용 가능한 쿠폰 ({availableCoupons.length}개)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCoupons(!showCoupons)}
            >
              {showCoupons ? '접기' : '펼치기'}
            </Button>
          </div>
          
          {showCoupons && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="coupon"
                  checked={selectedCoupon === null}
                  onChange={() => handleSelectCoupon(null)}
                  className="mr-3"
                />
                <span className="text-sm">쿠폰 사용 안함</span>
              </label>
              
              {availableCoupons.map((userCoupon) => (
                <label
                  key={userCoupon.id}
                  className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="coupon"
                    checked={selectedCoupon?.id === userCoupon.id}
                    onChange={() => handleSelectCoupon(userCoupon)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{formatCouponName(userCoupon)}</div>
                    <div className="text-sm text-gray-600">
                      {userCoupon.coupon.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(userCoupon.coupon.validTo).toLocaleDateString()} 까지
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">
                      -{getDiscountAmount(userCoupon).toLocaleString()}원
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 포인트 섹션 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">포인트</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">보유 포인트</span>
            <span className="font-semibold">{balance.toLocaleString()}P</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={pointsToUse || ''}
              onChange={(e) => handlePointChange(Number(e.target.value) || 0)}
              placeholder="0"
              className="flex-1"
              min={0}
              max={maxUsablePoints}
            />
            <span className="text-sm text-gray-600">P</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePointChange(maxUsablePoints)}
            >
              전액 사용
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            최대 {maxUsablePoints.toLocaleString()}P까지 사용 가능
          </div>
          
          {earnablePoints > 0 && (
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-blue-800">
                💰 이번 주문으로 <strong>{earnablePoints.toLocaleString()}P</strong> 적립 예정
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 적용 로직 구현

```typescript
// src/hooks/useOrderCalculation.ts
import { useMemo } from 'react'
import { useCouponStore, usePointStore } from '@/store'
import type { UserCoupon } from '@/types/promotion'

interface OrderCalculationParams {
  items: any[]
  selectedCoupon: UserCoupon | null
  pointsToUse: number
  shippingFee: number
}

interface OrderCalculation {
  subtotal: number
  couponDiscount: number
  pointDiscount: number
  shippingDiscount: number
  finalShippingFee: number
  total: number
  earnablePoints: number
}

export const useOrderCalculation = ({
  items,
  selectedCoupon,
  pointsToUse,
  shippingFee
}: OrderCalculationParams): OrderCalculation => {
  const { calculateDiscount } = useCouponStore()
  const { calculateEarnablePoints } = usePointStore()
  
  return useMemo(() => {
    // 상품 총액 계산
    const subtotal = items.reduce(
      (sum, item) => sum + (item.product.price * item.quantity), 
      0
    )
    
    // 쿠폰 할인 계산
    let couponDiscount = 0
    let shippingDiscount = 0
    
    if (selectedCoupon) {
      if (selectedCoupon.coupon.type === 'FREE_SHIPPING') {
        shippingDiscount = shippingFee
      } else {
        couponDiscount = calculateDiscount(selectedCoupon.coupon, subtotal)
      }
    }
    
    // 포인트 할인 계산
    const pointDiscount = Math.min(pointsToUse, subtotal - couponDiscount)
    
    // 최종 배송비 계산
    const finalShippingFee = Math.max(0, shippingFee - shippingDiscount)
    
    // 최종 결제 금액 계산
    const total = Math.max(0, subtotal - couponDiscount - pointDiscount + finalShippingFee)
    
    // 적립 예정 포인트 계산 (할인 후 금액 기준)
    const earnablePoints = calculateEarnablePoints(subtotal - couponDiscount - pointDiscount)
    
    return {
      subtotal,
      couponDiscount,
      pointDiscount,
      shippingDiscount,
      finalShippingFee,
      total,
      earnablePoints
    }
  }, [
    items,
    selectedCoupon,
    pointsToUse,
    shippingFee,
    calculateDiscount,
    calculateEarnablePoints
  ])
}
```

---

## 💡 구현 팁

### 1. 쿠폰 관리
- 쿠폰 중복 사용 방지 로직
- 쿠폰 유효성 실시간 검증
- 카테고리/상품별 적용 조건 설정
- 쿠폰 사용 이력 추적

### 2. 포인트 관리
- 포인트 적립/사용 내역 투명성
- 포인트 유효기간 관리
- 포인트 환율 설정 (1P = 1원)
- 부정 사용 방지 시스템

### 3. 성능 최적화
- 쿠폰 검증 로직 캐싱
- 포인트 계산 최적화
- 배치 처리로 대량 쿠폰 발급
- 이벤트 기반 포인트 적립

### 4. 사용자 경험
- 할인 혜택 시각적 표시
- 쿠폰 추천 알고리즘
- 포인트 적립 알림
- 만료 예정 쿠폰/포인트 안내

---

## 🚀 확장 기능

1. **고급 쿠폰 기능**
   - 조건부 쿠폰 (첫 구매, N회 구매 시)
   - 친구 초대 쿠폰
   - 생일 쿠폰 자동 발급

2. **포인트 확장**
   - 포인트 선물 기능
   - 포인트 등급제 도입
   - 포인트 이벤트 게임

3. **마케팅 연동**
   - A/B 테스트를 통한 쿠폰 최적화
   - 개인화된 쿠폰 추천
   - 세그먼트별 포인트 정책

4. **분석 대시보드**
   - 쿠폰 사용률 분석
   - 포인트 적립/사용 패턴
   - ROI 측정 및 개선

이 가이드를 통해 사용자 충성도를 높이고 재구매를 유도하는 쿠폰 및 포인트 시스템을 구축할 수 있습니다.