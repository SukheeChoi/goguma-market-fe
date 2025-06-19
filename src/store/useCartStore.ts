import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, Size, Color } from '@/types'

interface CartState {
  items: CartItem[]
  isOpen: boolean
  
  // Actions
  addItem: (product: Product, size: Size, color: Color, quantity?: number) => void
  removeItem: (productId: string, sizeId: string, colorId: string) => void
  updateQuantity: (productId: string, sizeId: string, colorId: string, quantity: number) => void
  clearCart: () => void
  
  // Cart UI
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  
  // Getters
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemCount: (productId: string) => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (product, size, color, quantity = 1) => {
        const { items } = get()
        const existingItemIndex = items.findIndex(
          item => 
            item.productId === product.id && 
            item.selectedSize.id === size.id && 
            item.selectedColor.id === color.id
        )
        
        if (existingItemIndex > -1) {
          // 이미 존재하는 아이템의 수량 증가
          const updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += quantity
          set({ items: updatedItems })
        } else {
          // 새 아이템 추가
          const newItem: CartItem = {
            productId: product.id,
            product,
            selectedSize: size,
            selectedColor: color,
            quantity
          }
          set({ items: [...items, newItem] })
        }
      },
      
      removeItem: (productId, sizeId, colorId) => {
        const { items } = get()
        const updatedItems = items.filter(
          item => !(
            item.productId === productId && 
            item.selectedSize.id === sizeId && 
            item.selectedColor.id === colorId
          )
        )
        set({ items: updatedItems })
      },
      
      updateQuantity: (productId, sizeId, colorId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, sizeId, colorId)
          return
        }
        
        const { items } = get()
        const updatedItems = items.map(item => {
          if (
            item.productId === productId && 
            item.selectedSize.id === sizeId && 
            item.selectedColor.id === colorId
          ) {
            return { ...item, quantity }
          }
          return item
        })
        set({ items: updatedItems })
      },
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

        getTotalItems: () => {
            const { items } = get()
            return items.reduce((total, item) => total + item.quantity, 0)
        },
      
      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
      },
      
      getItemCount: (productId) => {
        const { items } = get()
        return items
          .filter(item => item.productId === productId)
          .reduce((total, item) => total + item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
)