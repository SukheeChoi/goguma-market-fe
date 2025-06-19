import {Color, Product, Size} from "@/types/product";

export interface ShippingAddress {
    recipient: string
    phone: string
    zipCode: string
    address: string
    detailAddress: string
    memo?: string | undefined
}

export interface OrderItem {
    productId: string
    product: Product
    selectedSize: Size
    selectedColor: Color
    quantity: number
    price: number
}

export interface Order {
    id: string
    orderNumber: string
    userId: string
    items: OrderItem[]
    shippingAddress: ShippingAddress
    paymentMethod: PaymentMethod
    paymentStatus: PaymentStatus
    orderStatus: OrderStatus
    totalAmount: number
    shippingFee: number
    discountAmount: number
    pointsUsed: number
    couponUsed?: string
    createdAt: string
    updatedAt: string
}

export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    DELIVERING = 'DELIVERING',
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED'
}

export enum PaymentMethod {
    CARD = 'CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
    KAKAO_PAY = 'KAKAO PAY',
    NAVER_PAY = 'NAVER PAY',
    TOSS = 'TOSS'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELED = 'CANCELED',
    REFUNDED = 'REFUNDED'
}