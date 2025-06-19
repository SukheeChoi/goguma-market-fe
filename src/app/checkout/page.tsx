'use client'

import {Order, PaymentMethod, ShippingAddress} from "@/types/order";
import {JSX, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useCartStore, useUserStore} from "@/store";
import {useOrderStore} from "@/store/useOrderStore";

interface FormData extends ShippingAddress {
    paymentMethod: PaymentMethod
}

export default function CheckoutPage(): JSX.Element {
    const router = useRouter();
    const { items, getTotalPrice } = useCartStore();
    const { createOrder, setShippingAddress, setPaymentMethod, submitOrder, shippingAddress } = useOrderStore();
    const { user } = useUserStore();

    const [loading, setLoading] = useState<boolean>(false);
    const [formData, setFormData] = useState<FormData>({
        recipient: user?.name || '',
        phone: user?.phone || '',
        zipCode: '',
        address: '',
        detailAddress: '',
        memo: '',
        paymentMethod: PaymentMethod.CARD
    });

    useEffect(() => {
        if (shippingAddress) {
            setFormData(prev => ({
                ...prev,
                ...shippingAddress
            }))
        }
    }, [shippingAddress]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);

        try {
            createOrder(items);

            const addressData: ShippingAddress = {
                recipient: formData.recipient,
                phone: formData.phone,
                zipCode: formData.zipCode,
                address: formData.address,
                detailAddress: formData.detailAddress,
                memo: formData.memo
            }
            setShippingAddress(addressData);

            setPaymentMethod(formData.paymentMethod);

            const order: Order = await submitOrder();

            router.push(`/payment/${order.id}`);
        } catch (error) {
            console.error('주문 실패: ', error);
            alert('주문 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">주문/결제</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 주문 정보 입력 폼 */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 배송지 정보 섹션 */}
                        <section className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold mb-4">배송지 정보</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        받는 사람
                                    </label>
                                    <input
                                        type="text"
                                        name="recipient"
                                        value={formData.recipient}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        연락처
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        우편번호
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            className="flex-1 px-4 py-2 border rounded-lg"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            우편번호 찾기
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        주소
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg mb-2"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="detailAddress"
                                        value={formData.detailAddress}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="상세주소"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        배송 메모
                                    </label>
                                    <textarea
                                        name="memo"
                                        value={formData.memo || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        rows={3}
                                        placeholder="배송 시 요청사항을 입력해주세요"
                                    />
                                </div>
                            </div>
                        </section>
                        
                        {/* 결제 수단 섹션 */}
                        <section className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold mb-4">결제 수단</h2>
                            
                            <div className="space-y-2">
                                {Object.values(PaymentMethod).map((method) => (
                                    <label key={method} className="flex items-center">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={method}
                                            checked={formData.paymentMethod === method}
                                            onChange={(e) => setFormData({
                                                ...formData, 
                                                paymentMethod: e.target.value as PaymentMethod
                                            })}
                                            className="mr-2"
                                        />
                                        <span>{getPaymentMethodLabel(method)}</span>
                                    </label>
                                ))}
                            </div>
                        </section>
                        
                        <button
                            type="submit"
                            className="w-full lg:hidden bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? '처리중...' : '결제하기'}
                        </button>
                    </form>
                </div>
                
                {/* 주문 요약 사이드바 */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow sticky top-4">
                        <h2 className="text-lg font-semibold mb-4">주문 요약</h2>
                        
                        <div className="space-y-4 mb-6">
                            {items.map((item) => (
                                <div 
                                    key={`${item.productId}-${item.selectedSize.id}-${item.selectedColor.id}`} 
                                    className="flex justify-between"
                                >
                                    <div>
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {item.selectedSize.name} / {item.selectedColor.name} / {item.quantity}개
                                        </p>
                                    </div>
                                    <p className="font-medium">
                                        {(item.product.price * item.quantity).toLocaleString()}원
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between">
                                <span>상품 금액</span>
                                <span>{getTotalPrice().toLocaleString()}원</span>
                            </div>
                            <div className="flex justify-between">
                                <span>배송비</span>
                                <span>{getTotalPrice() >= 50000 ? '무료' : '3,000원'}</span>
                            </div>
                            <div className="flex justify-between text-lg font-semibold">
                                <span>총 결제 금액</span>
                                <span>
                                    {(getTotalPrice() + (getTotalPrice() >= 50000 ? 0 : 3000)).toLocaleString()}원
                                </span>
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full mt-6 hidden lg:block bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? '처리중...' : '결제하기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function getPaymentMethodLabel(method: PaymentMethod): string {
    const labels = {
        [PaymentMethod.CARD]: '신용/체크카드',
        [PaymentMethod.BANK_TRANSFER]: '무통장입금',
        [PaymentMethod.KAKAO_PAY]: '카카오페이',
        [PaymentMethod.NAVER_PAY]: '네이버페이',
        [PaymentMethod.TOSS]: '토스'
    }
    return labels[method]
}

