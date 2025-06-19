# ⭐ 리뷰 및 평점 시스템 구현 가이드

이 문서는 고구마 마켓의 리뷰 및 평점 시스템 구현 방법을 상세히 설명합니다.

## 📋 목차

1. [리뷰 타입 정의](#리뷰-타입-정의)
2. [리뷰 컴포넌트](#리뷰-컴포넌트)
3. [리뷰 작성 모달](#리뷰-작성-모달)
4. [리뷰 Store 구현](#리뷰-store-구현)
5. [API 연동](#api-연동)

---

## 리뷰 타입 정의

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

export interface ReviewForm {
  productId: string
  rating: number
  title?: string
  content: string
  images?: File[]
}
```

---

## 리뷰 컴포넌트

```typescript
// src/components/shop/ReviewSection.tsx
'use client'

import { useState } from 'react'
import { Button, Badge } from '@/components/ui'
import { useUserStore } from '@/store'
import type { Review, ReviewStats } from '@/types/review'

interface ReviewSectionProps {
  productId: string
  reviews: Review[]
  stats: ReviewStats
}

export default function ReviewSection({ productId, reviews, stats }: ReviewSectionProps) {
  const [sortBy, setSortBy] = useState<'latest' | 'helpful' | 'rating'>('latest')
  const [showReviewModal, setShowReviewModal] = useState(false)
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
          <Button 
            variant="outline" 
            onClick={() => setShowReviewModal(true)}
          >
            리뷰 작성하기
          </Button>
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
                  className={`w-5 h-5 ${
                    i < Math.round(stats.averageRating) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
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
                      width: `${(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalCount) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
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
          className={`px-4 py-2 rounded ${
            sortBy === 'latest' ? 'bg-black text-white' : 'bg-gray-200'
          }`}
        >
          최신순
        </button>
        <button
          onClick={() => setSortBy('helpful')}
          className={`px-4 py-2 rounded ${
            sortBy === 'helpful' ? 'bg-black text-white' : 'bg-gray-200'
          }`}
        >
          도움순
        </button>
        <button
          onClick={() => setSortBy('rating')}
          className={`px-4 py-2 rounded ${
            sortBy === 'rating' ? 'bg-black text-white' : 'bg-gray-200'
          }`}
        >
          평점순
        </button>
      </div>
      
      {/* 리뷰 목록 */}
      <div className="space-y-6">
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>아직 리뷰가 없습니다.</p>
            <p>첫 번째 리뷰를 작성해보세요!</p>
          </div>
        )}
      </div>
      
      {/* 리뷰 작성 모달 */}
      {showReviewModal && (
        <ReviewModal
          productId={productId}
          onClose={() => setShowReviewModal(false)}
          onSubmit={() => {
            setShowReviewModal(false)
            // 리뷰 목록 새로고침 로직
          }}
        />
      )}
    </div>
  )
}

function ReviewItem({ review }: { review: Review }) {
  const [isHelpful, setIsHelpful] = useState(false)
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return (
    <div className="border-b pb-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="font-semibold">{review.userName}</span>
            {review.isVerifiedPurchase && (
              <Badge variant="secondary" className="text-xs">구매 인증</Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {formatDate(review.createdAt)}
          </p>
        </div>
      </div>
      
      {review.title && (
        <h4 className="font-semibold mb-2">{review.title}</h4>
      )}
      
      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.content}</p>
      
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`리뷰 이미지 ${index + 1}`}
              className="w-20 h-20 object-cover rounded flex-shrink-0"
            />
          ))}
        </div>
      )}
      
      <button
        onClick={() => setIsHelpful(!isHelpful)}
        className={`text-sm ${isHelpful ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600`}
      >
        👍 도움이 됐어요 ({review.helpfulCount + (isHelpful ? 1 : 0)})
      </button>
    </div>
  )
}
```

---

## 리뷰 작성 모달

```typescript
// src/components/shop/ReviewModal.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import type { ReviewForm } from '@/types/review'

interface ReviewModalProps {
  productId: string
  onClose: () => void
  onSubmit: (review: ReviewForm) => Promise<void>
}

export default function ReviewModal({ productId, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!content.trim()) {
      alert('리뷰 내용을 입력해주세요.')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const reviewData: ReviewForm = {
        productId,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
        images: images.length > 0 ? images : undefined
      }
      
      await onSubmit(reviewData)
      onClose()
    } catch (error) {
      console.error('리뷰 작성 실패:', error)
      alert('리뷰 작성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || [])
    if (files.length > 5) {
      alert('이미지는 최대 5개까지 업로드 가능합니다.')
      return
    }
    setImages(files)
  }
  
  const removeImage = (index: number): void => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
        <h2 className="text-xl font-bold mb-4">리뷰 작성</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 별점 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">평점 *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  <svg
                    className={`w-8 h-8 ${
                      star <= rating 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating}점 - {['매우 불만족', '불만족', '보통', '만족', '매우 만족'][rating - 1]}
            </p>
          </div>
          
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="리뷰 제목을 입력하세요 (선택사항)"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>
          
          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium mb-2">내용 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요"
              required
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{content.length}/1000</p>
          </div>
          
          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              사진 첨부 (최대 5개)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm"
            />
            
            {/* 업로드된 이미지 미리보기 */}
            {images.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`미리보기 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? '등록 중...' : '리뷰 등록'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
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

## 리뷰 Store 구현

```typescript
// src/store/useReviewStore.ts
import { create } from 'zustand'
import type { Review, ReviewStats, ReviewForm } from '@/types/review'
import * as reviewService from '@/services/reviewService'

interface ReviewState {
  reviews: Review[]
  stats: ReviewStats | null
  isLoading: boolean
  
  // Actions
  fetchReviews: (productId: string) => Promise<void>
  createReview: (reviewData: ReviewForm) => Promise<void>
  updateReview: (reviewId: string, updates: Partial<Review>) => Promise<void>
  deleteReview: (reviewId: string) => Promise<void>
  toggleHelpful: (reviewId: string) => Promise<void>
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  stats: null,
  isLoading: false,
  
  fetchReviews: async (productId: string): Promise<void> => {
    set({ isLoading: true })
    
    try {
      const [reviews, stats] = await Promise.all([
        reviewService.getReviews(productId),
        reviewService.getReviewStats(productId)
      ])
      
      set({ reviews, stats })
    } catch (error) {
      console.error('리뷰 조회 실패:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  createReview: async (reviewData: ReviewForm): Promise<void> => {
    try {
      const newReview = await reviewService.createReview(reviewData)
      
      set(state => ({
        reviews: [newReview, ...state.reviews],
        stats: state.stats ? {
          ...state.stats,
          totalCount: state.stats.totalCount + 1
        } : null
      }))
    } catch (error) {
      console.error('리뷰 작성 실패:', error)
      throw error
    }
  },
  
  updateReview: async (reviewId: string, updates: Partial<Review>): Promise<void> => {
    try {
      const updatedReview = await reviewService.updateReview(reviewId, updates)
      
      set(state => ({
        reviews: state.reviews.map(review =>
          review.id === reviewId ? updatedReview : review
        )
      }))
    } catch (error) {
      console.error('리뷰 수정 실패:', error)
      throw error
    }
  },
  
  deleteReview: async (reviewId: string): Promise<void> => {
    try {
      await reviewService.deleteReview(reviewId)
      
      set(state => ({
        reviews: state.reviews.filter(review => review.id !== reviewId),
        stats: state.stats ? {
          ...state.stats,
          totalCount: Math.max(0, state.stats.totalCount - 1)
        } : null
      }))
    } catch (error) {
      console.error('리뷰 삭제 실패:', error)
      throw error
    }
  },
  
  toggleHelpful: async (reviewId: string): Promise<void> => {
    try {
      await reviewService.toggleHelpful(reviewId)
      
      set(state => ({
        reviews: state.reviews.map(review =>
          review.id === reviewId
            ? { ...review, helpfulCount: review.helpfulCount + 1 }
            : review
        )
      }))
    } catch (error) {
      console.error('도움되요 처리 실패:', error)
      throw error
    }
  }
}))
```

---

## API 연동

```typescript
// src/services/reviewService.ts
import { apiClient } from '@/lib/api'
import type { Review, ReviewStats, ReviewForm } from '@/types/review'

export const getReviews = async (productId: string): Promise<Review[]> => {
  const response = await apiClient.get(`/products/${productId}/reviews`)
  return response.data
}

export const getReviewStats = async (productId: string): Promise<ReviewStats> => {
  const response = await apiClient.get(`/products/${productId}/reviews/stats`)
  return response.data
}

export const createReview = async (reviewData: ReviewForm): Promise<Review> => {
  const formData = new FormData()
  
  formData.append('productId', reviewData.productId)
  formData.append('rating', reviewData.rating.toString())
  formData.append('content', reviewData.content)
  
  if (reviewData.title) {
    formData.append('title', reviewData.title)
  }
  
  if (reviewData.images) {
    reviewData.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image)
    })
  }
  
  const response = await apiClient.post('/reviews', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  
  return response.data
}

export const updateReview = async (
  reviewId: string, 
  updates: Partial<Review>
): Promise<Review> => {
  const response = await apiClient.patch(`/reviews/${reviewId}`, updates)
  return response.data
}

export const deleteReview = async (reviewId: string): Promise<void> => {
  await apiClient.delete(`/reviews/${reviewId}`)
}

export const toggleHelpful = async (reviewId: string): Promise<void> => {
  await apiClient.post(`/reviews/${reviewId}/helpful`)
}
```

---

## 💡 구현 팁

### 1. 평점 시각화
- 별점은 SVG를 사용하여 커스터마이징 가능
- 평점 분포는 막대 그래프로 직관적 표현
- 반응형 디자인으로 모바일에서도 잘 보이도록 구성

### 2. 이미지 처리
- 이미지 업로드 전 미리보기 제공
- 파일 크기 제한 (예: 5MB 이하)
- 이미지 최적화 (리사이징, 압축)
- CDN 사용으로 빠른 이미지 로딩

### 3. 사용자 경험
- 구매 인증 리뷰 강조 표시
- 도움이 된 리뷰 표시 기능
- 정렬 옵션 제공 (최신순, 도움순, 평점순)
- 무한 스크롤 또는 페이지네이션

### 4. 보안 및 검증
- 리뷰 작성 권한 확인 (구매 여부)
- 욕설 필터링 및 스팸 방지
- 이미지 파일 타입 검증
- XSS 공격 방지를 위한 내용 검증

---

## 🚀 확장 기능

1. **리뷰 신고 기능**
   - 부적절한 리뷰 신고 시스템
   - 관리자 검토 프로세스

2. **리뷰 답글**
   - 판매자 답글 기능
   - 구매자와 판매자 간 Q&A

3. **리뷰 추천**
   - AI 기반 리뷰 품질 평가
   - 유용한 리뷰 자동 추천

4. **리뷰 분석**
   - 감정 분석을 통한 리뷰 분류
   - 키워드 추출 및 태그 생성

이 가이드를 따라 구현하면 사용자들이 신뢰할 수 있는 리뷰 시스템을 구축할 수 있습니다.