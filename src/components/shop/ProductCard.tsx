'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { Badge, Button, NewBadge } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { useCartStore, useUserStore } from '@/store'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { isInWishlist, toggleWishlist } = useUserStore()
  const [isImageLoading, setIsImageLoading] = useState(true)
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 기본 사이즈와 컬러 선택 (첫 번째 사용 가능한 옵션)
    const defaultSize = product.sizes.find(size => size.available)
    const defaultColor = product.colors.find(color => color.available)
    
    if (defaultSize && defaultColor) {
      addItem(product, defaultSize, defaultColor, 1)
    }

    console.log(useCartStore.getState().getTotalItems());
    console.log(useCartStore.getState().items);

  }
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
  }
  
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {/* 배지들 */}
          <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
            {product.isNew && <Badge variant="new">NEW</Badge>}
            {product.isBest && <Badge variant="best">BEST</Badge>}
            {product.isOnSale && <Badge variant="sale">SALE</Badge>}
            {product.isSoldoutSoon && <NewBadge text="품절임박" type="soldout-soon" />}
            {product.isEvent && <NewBadge text="이벤트" type="event" />}
            {product.isSoldout && <NewBadge text="품절" type="soldout" />}
          </div>
          
          {/* 위시리스트 버튼 */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg 
              className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
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
          
          {/* 상품 이미지 */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              isImageLoading ? 'blur-sm' : 'blur-0'
            }`}
            onLoad={() => setIsImageLoading(false)}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* 호버 시 장바구니 버튼 */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={handleAddToCart}
              className="w-full"
              size="sm"
            >
              장바구니 담기
            </Button>
          </div>
        </div>
        
        {/* 상품 정보 */}
        <div className="mt-3 space-y-1">
          <p className="text-sm text-gray-500">{product.brand}</p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          
          <div className="flex items-center gap-2">
            {product.originalPrice && product.discountRate ? (
              <>
                <span className="text-sm font-bold text-red-600">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="text-xs text-red-600 font-medium">
                  {product.discountRate}%
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          {/* 평점 및 리뷰 */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs text-gray-500 ml-1">
                {product.rating} ({product.reviewCount})
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}