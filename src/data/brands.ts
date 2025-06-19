import { Brand } from '@/types'

export const brands: Brand[] = [
  {
    id: 'nike',
    name: 'Nike',
    logo: '/brands/nike.png',
    description: '글로벌 스포츠 브랜드',
    isPopular: true
  },
  {
    id: 'adidas',
    name: 'Adidas',
    logo: '/brands/adidas.png',
    description: '독일 스포츠 브랜드',
    isPopular: true
  },
  {
    id: 'uniqlo',
    name: 'Uniqlo',
    logo: '/brands/uniqlo.png',
    description: '일본 캐주얼 브랜드',
    isPopular: true
  },
  {
    id: 'zara',
    name: 'Zara',
    logo: '/brands/zara.png',
    description: '스페인 패스트 패션',
    isPopular: true
  },
  {
    id: 'hm',
    name: 'H&M',
    logo: '/brands/hm.png',
    description: '스웨덴 패스트 패션',
    isPopular: false
  },
  {
    id: 'champion',
    name: 'Champion',
    logo: '/brands/champion.png',
    description: '미국 스포츠웨어',
    isPopular: false
  }
]