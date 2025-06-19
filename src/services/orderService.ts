import type { Order, OrderStatus, PaymentStatus } from '@/types/order'

// 개발 환경용 Mock Service
// 실제 백엔드가 준비되면 API 호출로 교체

// 가짜 주문 데이터 생성
function generateMockOrder(orderData: Partial<Order>): Order {
  return {
    id: `order_${Date.now()}`,
    orderNumber: `ORD${Date.now()}`,
    userId: 'user_123',
    items: orderData.items || [],
    shippingAddress: orderData.shippingAddress!,
    paymentMethod: orderData.paymentMethod!,
    paymentStatus: PaymentStatus.PENDING,
    orderStatus: OrderStatus.PENDING,
    totalAmount: orderData.totalAmount || 0,
    shippingFee: orderData.shippingFee || 0,
    discountAmount: orderData.discountAmount || 0,
    pointsUsed: orderData.pointsUsed || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// Mock 주문 저장소 (localStorage 사용)
function getMockOrders(): Order[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('mock_orders')
  return stored ? JSON.parse(stored) : []
}

function saveMockOrders(orders: Order[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_orders', JSON.stringify(orders))
  }
}

// 주문 생성
export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  console.log('🧪 Mock: 주문 생성 중...', orderData)
  
  // 2초 딜레이로 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 5% 확률로 에러 발생 (테스트용)
  if (Math.random() < 0.05) {
    throw new Error('주문 처리 중 오류가 발생했습니다.')
  }
  
  const newOrder = generateMockOrder(orderData)
  const orders = getMockOrders()
  orders.push(newOrder)
  saveMockOrders(orders)
  
  console.log('✅ Mock: 주문 생성 완료', newOrder)
  return newOrder
}

// 주문 목록 조회
export async function getOrders(): Promise<Order[]> {
  console.log('🧪 Mock: 주문 목록 조회 중...')
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  const orders = getMockOrders()
  
  console.log('✅ Mock: 주문 목록 조회 완료', orders.length + '개')
  return orders
}

// 특정 주문 조회
export async function getOrder(orderId: string): Promise<Order> {
  console.log('🧪 Mock: 주문 조회 중...', orderId)
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  const orders = getMockOrders()
  const order = orders.find(o => o.id === orderId)
  
  if (!order) {
    throw new Error('주문을 찾을 수 없습니다.')
  }
  
  console.log('✅ Mock: 주문 조회 완료', order)
  return order
}

// 주문 취소
export async function cancelOrder(orderId: string): Promise<void> {
  console.log('🧪 Mock: 주문 취소 중...', orderId)
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const orders = getMockOrders()
  const order = orders.find(o => o.id === orderId)
  
  if (!order) {
    throw new Error('주문을 찾을 수 없습니다.')
  }
  
  order.orderStatus = OrderStatus.CANCELED
  order.updatedAt = new Date().toISOString()
  saveMockOrders(orders)
  
  console.log('✅ Mock: 주문 취소 완료')
}

// 주문 상태 업데이트
export async function updateOrderStatus(
  orderId: string, 
  status: OrderStatus
): Promise<Order> {
  console.log('🧪 Mock: 주문 상태 업데이트 중...', orderId, status)
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const orders = getMockOrders()
  const order = orders.find(o => o.id === orderId)
  
  if (!order) {
    throw new Error('주문을 찾을 수 없습니다.')
  }
  
  order.orderStatus = status
  order.updatedAt = new Date().toISOString()
  saveMockOrders(orders)
  
  console.log('✅ Mock: 주문 상태 업데이트 완료')
  return order
}