import { Category } from '@/types'

export const categories: Category[] = [
  {
    id: 'men',
    name: '남성',
    subcategories: [
      { id: 'men-tops', name: '상의' },
      { id: 'men-bottoms', name: '하의' },
      { id: 'men-outer', name: '아우터' },
      { id: 'men-shoes', name: '신발' },
      { id: 'men-accessories', name: '액세서리' }
    ]
  },
  {
    id: 'women',
    name: '여성',
    subcategories: [
      { id: 'women-tops', name: '상의' },
      { id: 'women-bottoms', name: '하의' },
      { id: 'women-outer', name: '아우터' },
      { id: 'women-shoes', name: '신발' },
      { id: 'women-accessories', name: '액세서리' }
    ]
  },
  {
    id: 'sports',
    name: '스포츠',
    subcategories: [
      { id: 'sports-wear', name: '스포츠웨어' },
      { id: 'sports-shoes', name: '운동화' },
      { id: 'sports-equipment', name: '운동용품' }
    ]
  },
  {
    id: 'bags',
    name: '가방',
    subcategories: [
      { id: 'backpack', name: '백팩' },
      { id: 'crossbag', name: '크로스백' },
      { id: 'totebag', name: '토트백' }
    ]
  }
]