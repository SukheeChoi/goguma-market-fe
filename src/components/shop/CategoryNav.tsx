'use client'

import { useState } from 'react'
import { categories } from '@/data'
import { useProductStore } from '@/store'

export default function CategoryNav() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { setFilters } = useProductStore()
  
  const handleCategoryClick = (categoryId: string) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null)
      setFilters({ category: undefined })
    } else {
      setActiveCategory(categoryId)
      setFilters({ category: categoryId })
    }
  }
  
  return (
    <div className="border-b border-gray-200">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8 overflow-x-auto">
          <button
            onClick={() => {
              setActiveCategory(null)
              setFilters({ category: undefined })
            }}
            className={`flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeCategory === null
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            전체
          </button>
          
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeCategory === category.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}