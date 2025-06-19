import { Banner } from '@/types'

export const banners: Banner[] = [
  {
    id: '1',
    title: '신상 컬렉션 출시',
    subtitle: '최대 30% 할인',
    image: '/banners/banner1.jpg',
    link: '/category/new',
    isActive: true,
    order: 1
  },
  {
    id: '2',
    title: '스포츠웨어 특가',
    subtitle: '나이키, 아디다스 할인',
    image: '/banners/banner2.jpg',
    link: '/category/sports',
    isActive: true,
    order: 2
  },
  {
    id: '3',
    title: '겨울 아우터',
    subtitle: '따뜻한 겨울 준비',
    image: '/banners/banner3.jpg',
    link: '/category/outer',
    isActive: true,
    order: 3
  }
]