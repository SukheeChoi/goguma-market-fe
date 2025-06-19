import { Product, Size, Color } from '@/types'

const commonSizes: Size[] = [
  { id: 'xs', name: 'XS', available: true },
  { id: 's', name: 'S', available: true },
  { id: 'm', name: 'M', available: true },
  { id: 'l', name: 'L', available: true },
  { id: 'xl', name: 'XL', available: true },
  { id: 'xxl', name: 'XXL', available: false }
]

const commonColors: Color[] = [
  { id: 'black', name: '블랙', code: '#000000', available: true },
  { id: 'white', name: '화이트', code: '#FFFFFF', available: true },
  { id: 'gray', name: '그레이', code: '#808080', available: true },
  { id: 'navy', name: '네이비', code: '#000080', available: true },
  { id: 'beige', name: '베이지', code: '#F5F5DC', available: false }
]

export const products: Product[] = [
  {
    id: '1',
    name: '에어포스 1 로우',
    brand: 'Nike',
    price: 119000,
    originalPrice: 139000,
    discountRate: 14,
    images: [
      '/products/nike-airforce1-1.jpg',
      '/products/nike-airforce1-2.jpg',
      '/products/nike-airforce1-3.jpg'
    ],
    category: 'shoes',
    subcategory: 'men-shoes',
    description: '클래식한 디자인의 나이키 에어포스 1 로우 스니커즈입니다.',
    sizes: commonSizes,
    colors: commonColors,
    tags: ['스니커즈', '클래식', '데일리'],
    rating: 4.5,
    reviewCount: 128,
    isNew: false,
    isBest: true,
    isOnSale: true,
    stock: 50,
    isSoldoutSoon: true,  // 품절임박 배지 추가
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: '우니클로 기본 티셔츠',
    brand: 'Uniqlo',
    price: 19900,
    images: [
      '/products/uniqlo-tshirt-1.jpg',
      '/products/uniqlo-tshirt-2.jpg'
    ],
    category: 'tops',
    subcategory: 'men-tops',
    description: '부드러운 면 소재의 기본 티셔츠입니다.',
    sizes: commonSizes,
    colors: commonColors,
    tags: ['베이직', '데일리', '면'],
    rating: 4.2,
    reviewCount: 89,
    isNew: true,
    isBest: false,
    isOnSale: false,
    stock: 100,
    isEvent: true,  // 이벤트 배지 추가
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    name: '챔피언 후드 집업',
    brand: 'Champion',
    price: 89000,
    originalPrice: 109000,
    discountRate: 18,
    images: [
      '/products/champion-hoodie-1.jpg',
      '/products/champion-hoodie-2.jpg',
      '/products/champion-hoodie-3.jpg'
    ],
    category: 'outer',
    subcategory: 'men-outer',
    description: '편안한 착용감의 챔피언 후드 집업입니다.',
    sizes: commonSizes,
    colors: commonColors.slice(0, 3),
    tags: ['후드', '집업', '스포츠'],
    rating: 4.3,
    reviewCount: 67,
    isNew: false,
    isBest: false,
    isOnSale: true,
    stock: 0,  // 재고 0으로 변경
    isSoldout: true,  // 품절 배지 추가
    createdAt: '2024-01-10'
  },
  {
    id: '4',
    name: '자라 슬림핏 청바지',
    brand: 'Zara',
    price: 59900,
    images: [
      '/products/zara-jeans-1.jpg',
      '/products/zara-jeans-2.jpg'
    ],
    category: 'bottoms',
    subcategory: 'men-bottoms',
    description: '모던한 슬림핏 청바지입니다.',
    sizes: commonSizes,
    colors: [
      { id: 'indigo', name: '인디고', code: '#4B0082', available: true },
      { id: 'black', name: '블랙', code: '#000000', available: true }
    ],
    tags: ['청바지', '슬림핏', '데님'],
    rating: 4.1,
    reviewCount: 45,
    isNew: true,
    isBest: true,
    isOnSale: false,
    stock: 80,
    createdAt: '2024-01-25'
  },
  {
    id: '5',
    name: 'H&M 크루넥 스웨터',
    brand: 'H&M',
    price: 29900,
    images: [
      '/products/hm-sweater-1.jpg',
      '/products/hm-sweater-2.jpg'
    ],
    category: 'tops',
    subcategory: 'men-tops',
    description: '따뜻한 크루넥 스웨터입니다.',
    sizes: commonSizes,
    colors: commonColors.slice(0, 4),
    tags: ['스웨터', '크루넥', '겨울'],
    rating: 3.9,
    reviewCount: 32,
    isNew: false,
    isBest: false,
    isOnSale: false,
    stock: 60,
    createdAt: '2024-01-05'
  },
  {
    id: '6',
    name: '아디다스 스탠스미스',
    brand: 'Adidas',
    price: 109000,
    images: [
      '/products/adidas-stansmith-1.jpg',
      '/products/adidas-stansmith-2.jpg',
      '/products/adidas-stansmith-3.jpg'
    ],
    category: 'shoes',
    subcategory: 'men-shoes',
    description: '아이코닉한 아디다스 스탠스미스 스니커즈입니다.',
    sizes: commonSizes,
    colors: [
      { id: 'white-green', name: '화이트/그린', code: '#FFFFFF', available: true },
      { id: 'white-navy', name: '화이트/네이비', code: '#FFFFFF', available: true }
    ],
    tags: ['스니커즈', '클래식', '아이코닉'],
    rating: 4.6,
    reviewCount: 156,
    isNew: false,
    isBest: true,
    isOnSale: false,
    stock: 40,
    createdAt: '2024-01-12'
  }
]