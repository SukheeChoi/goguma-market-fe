import { api } from '@/lib/api';
import {Order, OrderStatus} from "@/types/order";

// 주문 생성
export async function createOrder(orderData: Partial<Order>): Promise<Order> {
    try {
        const response = await api.post<Order>('/orders', orderData);
        return response.data;
    } catch (error) {
        console.error('주문 생성 실패: ', error);
        throw new Error('주문을 생성할 수 없습니다.');
    }
}

// 주문 목록 조회
export async function getOrders(): Promise<Order[]> {
    try {
        const response = await api.get<Order[]>('/orders');
        return response.data;
    } catch (error) {
        console.error('주문 목록 조회 실패: ', error);
        throw new Error('주문 목록을 불러올 수 없습니다.');
    }
}

// 특정 주문 조회
export async function getOrder(orderId: string): Promise<Order> {
    try {
        const response = await api.get<Order>(`/order/${orderId}`);
        return response.data;
    } catch (error) {
        console.error('주문 조회 실패: ', error);
        throw new Error('주문을 불러올 수 없습니다.');
    }
}

// 주문 취소
export async function cancelOrder(orderId: string): Promise<void> {
    try {
        await api.patch(`/orders/${orderId}/cancel`);
    } catch (error) {
        console.error('주문 취소 실패: ', error);
        throw new Error('주문을 취소할 수 없습니다.');
    }
}

// 주문 상태 업데이트
export async function updateOrderStatus(orderId: string,
                                        status: OrderStatus
): Promise<Order> {
    try {
        const response = await api.patch<Order>(`/orders/${orderId}/status`, {status});
        return response.data;
    } catch (error) {
        console.error('주문 상태 업데이트 실패: ', error);
        throw new Error('주문 상태를 업데이트할 수 없습니다.');
    }
}