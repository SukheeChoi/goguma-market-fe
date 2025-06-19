'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Size, Color } from '@/types'
import { Button, Badge } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { useProductStore, useCartStore, useUserStore } from '@/store'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  
  const { selectedProduct, isLoading, error, fetchProductById } = useProductStore()
  const { addItem } = useCartStore()
  const { isInWishlist, toggleWishlist, addToRecentlyViewed } = useUserStore()
  
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  
  useEffect(() => {
    fetchProductById(productId)
  }, [productId, fetchProductById])

  useEffect(() => {
    if (selectedProduct) {
      setSelectedSize(selectedProduct.sizes.find(size => size.available) || null)
      setSelectedColor(selectedProduct.colors.find(color => color.available) || null)
      addToRecentlyViewed(productId)
    }
  }, [selectedProduct, productId, addToRecentlyViewed])
  
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>상품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchProductById(productId)}>다시 시도</Button>
        </div>
      </div>
    )
  }

  // 상품이 없는 경우
  if (!selectedProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
          <Button onClick={() => router.back()}>
            이전 페이지로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  const product = selectedProduct
  
  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert('사이즈와 색상을 선택해주세요.')
      return
    }
    
    addItem(product, selectedSize, selectedColor, quantity)
    alert('장바구니에 추가되었습니다.')
  }
  
  const handleBuyNow = () => {
    if (!selectedSize || !selectedColor) {
      alert('사이즈와 색상을 선택해주세요.')
      return
    }
    
    addItem(product, selectedSize, selectedColor, quantity)
    // TODO: 구매 페이지로 이동
    alert('구매 기능은 추후 구현 예정입니다.')
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 뒤로 가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        뒤로 가기
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 상품 이미지 */}
        <div className="space-y-4">
          {/* 메인 이미지 */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={product.images[selectedImageIndex]}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* 썸네일 이미지들 */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? 'border-black' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* 상품 정보 */}
        <div className="space-y-6">
          {/* 브랜드 및 상품명 */}
          <div>
            <p className="text-lg text-gray-600 mb-2">{product.brand}</p>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          </div>
          
          {/* 배지들 */}
          <div className="flex gap-2">
            {product.isNew && <Badge variant="new">NEW</Badge>}
            {product.isBest && <Badge variant="best">BEST</Badge>}
            {product.isOnSale && <Badge variant="sale">SALE</Badge>}
          </div>
          
          {/* 가격 */}
          <div className="space-y-2">
            {product.originalPrice && product.discountRate ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                </div>
                <p className="text-red-600 font-medium">
                  {product.discountRate}% 할인
                </p>
              </>
            ) : (
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          {/* 평점 및 리뷰 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {product.rating}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              리뷰 {product.reviewCount}개
            </span>
          </div>
          
          {/* 색상 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">색상</h3>
            <div className="flex gap-2">
              {product.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => color.available && setSelectedColor(color)}
                  disabled={!color.available}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor?.id === color.id
                      ? 'border-black'
                      : 'border-gray-300'
                  } ${!color.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: color.code }}
                  title={color.name}
                />
              ))}
            </div>
            {selectedColor && (
              <p className="text-sm text-gray-600 mt-2">선택된 색상: {selectedColor.name}</p>
            )}
          </div>
          
          {/* 사이즈 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">사이즈</h3>
            <div className="grid grid-cols-6 gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => size.available && setSelectedSize(size)}
                  disabled={!size.available}
                  className={`px-3 py-2 border text-sm font-medium rounded-md ${
                    selectedSize?.id === size.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  } ${!size.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 수량 선택 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">수량</h3>
            <div className="flex items-center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 border border-gray-300 rounded-l-md hover:bg-gray-50"
              >
                -
              </button>
              <span className="px-4 py-2 border-t border-b border-gray-300 bg-white text-center min-w-[60px]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 border border-gray-300 rounded-r-md hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>
          
          {/* 구매 버튼들 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1"
              >
                장바구니 담기
              </Button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <svg 
                  className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
              </button>
            </div>
            <Button
              onClick={handleBuyNow}
              className="w-full"
            >
              바로 구매하기
            </Button>
          </div>
          
          {/* 상품 설명 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">상품 설명</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>
          
          {/* 태그 */}
          {product.tags.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">태그</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}