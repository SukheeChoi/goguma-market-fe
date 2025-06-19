import { create } from "zustand";
import { persist } from "zustand/middleware";
import {CartItem} from "@/types";
import {Order, OrderItem, OrderStatus, PaymentMethod, ShippingAddress} from "@/types/order";
import {useCartStore} from "@/store/useCartStore";

interface OrderState {
    currentOrder: Partial<Order> | null
    orders: Order[]
    shippingAddress: ShippingAddress | null

    createOrder: (items: CartItem[]) => void // 장바구니 아이템들을 주문으로 변환
    setShippingAddress: (address: ShippingAddress) => void // 배송지 정보 설정
    setPaymentMethod: (method: PaymentMethod) => void // 결제 방법 설정
    submitOrder: () => Promise<Order> // 서버로 주문 전송 및 처리
    getOrders: () => Promise<Order[]>
    getOrder: (id: string) => Promise<Order>
    cancelOrder: (id: string) => Promise<void>
}

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            currentOrder: null,
            orders: [],
            shippingAddress: null,

            createOrder: (items: CartItem[]): void => {
                const orderItems = items.map((item: CartItem) => ({
                    productId: item.productId,
                    product: item.product,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor,
                    quantity: item.quantity,
                    price: item.product.price
                }))

                const totalAmount: number = orderItems.reduce(
                    (sum: number, item: OrderItem): number => sum + (item.price * item.quantity), 0
                )

                const shippingFee: number = totalAmount >= 50000 ? 0 : 3000

                set({
                    currentOrder: {
                        items: orderItems,
                        totalAmount,
                        shippingFee,
                        discountAmount: 0,
                        pointsUsed: 0
                    } as Partial<Order>
                })
            }, // createOrder

            setShippingAddress: (address: ShippingAddress): void => {
                set(state => ({
                    shippingAddress: address,
                    currentOrder: state.currentOrder ? {
                        ...state.currentOrder,
                        shippingAddress: address
                    } : null
                }))
            },

            setPaymentMethod: (method: PaymentMethod): void => {
                set((state: OrderState) => ({
                    currentOrder: state.currentOrder ? {
                        ...state.currentOrder,
                        paymentMethod: method
                    } : null
                }))
            },

            submitOrder: async (): Promise<Order> => {
                const { currentOrder } = get()
                if(!currentOrder) throw Error('No current order')

                try {
                    const response = await orderService.createOrder(currentOrder)

                    set({
                        currentOrder: null,
                        orders: [...get().orders, response]
                    })

                useCartStore.getState().clearCart()

                return response

                } catch (error) {
                    console.error('주문 제출 실패: ', error)
                    throw error
                }
            },

            getOrders: async (): Promise<Order[]> => {
                try {
                    const orders = await orderService.createOrder()
                    set({ orders })
                    return orders
                } catch (error) {
                    console.error('주문 목록 조회 실패: ', error)
                    throw error
                }
            },

            getOrder: async (id: string): Promise<Order> => {
                try {
                    return await orderService.getOrder(id)
                } catch (error) {
                    console.error('주문 조회 실패: ', error)
                    throw error
                }
            },

            cancelOrder: async (id: string): Promise<void> => {
                try{
                    await orderService.cancelOrder(id)

                    const orders: Order[] = get().orders.map(order =>
                        order.id === id
                           ? { ...order, orderStatus: OrderStatus.CANCELED }
                            : order
                    )

                    set({ orders})

                } catch(error) {
                    console.error()
                    throw error
                }
            }

        }),
        {
            name: 'order-storage',
            partialize: (state: OrderState) => ({
                shippingAddress: state.shippingAddress
            })
        }
    )
)