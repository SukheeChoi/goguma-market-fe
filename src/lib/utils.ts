import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원'
}

export function formatDiscountRate(rate: number): string {
  return `${rate}%`
}

export function getDiscountedPrice(originalPrice: number, discountRate: number): number {
  return Math.floor(originalPrice * (1 - discountRate / 100))
}