# 🔔 실시간 알림 시스템 구현 가이드

이 문서는 고구마 마켓의 실시간 알림 시스템 구현 방법을 상세히 설명합니다.

## 📋 목차

1. [알림 타입 정의](#알림-타입-정의)
2. [WebSocket 연결](#websocket-연결)
3. [푸시 알림](#푸시-알림)
4. [알림 센터 UI](#알림-센터-ui)
5. [알림 Store 구현](#알림-store-구현)

---

## 알림 타입 정의

```typescript
// src/types/notification.ts
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: any
  isRead: boolean
  userId: string
  createdAt: string
}

export enum NotificationType {
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',     // 주문 확인
  ORDER_SHIPPED = 'ORDER_SHIPPED',         // 배송 시작
  ORDER_DELIVERED = 'ORDER_DELIVERED',     // 배송 완료
  PRODUCT_RESTOCK = 'PRODUCT_RESTOCK',     // 재입고 알림
  PROMOTION = 'PROMOTION',                 // 프로모션
  REVIEW_REPLY = 'REVIEW_REPLY',          // 리뷰 답글
  COUPON_EXPIRY = 'COUPON_EXPIRY',        // 쿠폰 만료 임박
  POINT_EARNED = 'POINT_EARNED'           // 포인트 적립
}

export interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  orderUpdates: boolean
  promotions: boolean
  restockAlerts: boolean
}
```

---

## WebSocket 연결

```typescript
// src/services/websocketService.ts
import { useUserStore } from '@/store'
import { useNotificationStore } from '@/store'

class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(userId: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/notifications?userId=${userId}`
    this.socket = new WebSocket(wsUrl)

    this.socket.onopen = () => {
      console.log('WebSocket 연결 성공')
      this.reconnectAttempts = 0
    }

    this.socket.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data)
        this.handleNotification(notification)
      } catch (error) {
        console.error('알림 파싱 오류:', error)
      }
    }

    this.socket.onclose = () => {
      console.log('WebSocket 연결 종료')
      this.attemptReconnect(userId)
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket 오류:', error)
    }
  }

  private handleNotification(notification: Notification) {
    const { addNotification } = useNotificationStore.getState()
    addNotification(notification)

    // 브라우저 알림 표시
    this.showBrowserNotification(notification)
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png'
      })
    }
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
        this.connect(userId)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  sendMessage(message: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }
}

export const webSocketService = new WebSocketService()
```

---

## 푸시 알림

```typescript
// src/services/pushNotificationService.ts
export class PushNotificationService {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('푸시 알림이 지원되지 않습니다.')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        )
      })

      // 서버에 구독 정보 전송
      await this.sendSubscriptionToServer(subscription)
      
      return subscription
    } catch (error) {
      console.error('푸시 구독 실패:', error)
      return null
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    })
  }
}

export const pushNotificationService = new PushNotificationService()
```

---

## 알림 센터 UI

```typescript
// src/components/ui/NotificationCenter.tsx
'use client'

import { useState, useEffect } from 'react'
import { useNotificationStore } from '@/store'
import { Button } from '@/components/ui'
import type { Notification, NotificationType } from '@/types/notification'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    fetchNotifications 
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const getNotificationIcon = (type: NotificationType): string => {
    const icons = {
      [NotificationType.ORDER_CONFIRMED]: '📦',
      [NotificationType.ORDER_SHIPPED]: '🚚',
      [NotificationType.ORDER_DELIVERED]: '✅',
      [NotificationType.PRODUCT_RESTOCK]: '🔔',
      [NotificationType.PROMOTION]: '🎉',
      [NotificationType.REVIEW_REPLY]: '💬',
      [NotificationType.COUPON_EXPIRY]: '⏰',
      [NotificationType.POINT_EARNED]: '💰'
    }
    return icons[type] || '📢'
  }

  const getNotificationColor = (type: NotificationType): string => {
    const colors = {
      [NotificationType.ORDER_CONFIRMED]: 'bg-blue-100 text-blue-800',
      [NotificationType.ORDER_SHIPPED]: 'bg-yellow-100 text-yellow-800',
      [NotificationType.ORDER_DELIVERED]: 'bg-green-100 text-green-800',
      [NotificationType.PRODUCT_RESTOCK]: 'bg-purple-100 text-purple-800',
      [NotificationType.PROMOTION]: 'bg-pink-100 text-pink-800',
      [NotificationType.REVIEW_REPLY]: 'bg-gray-100 text-gray-800',
      [NotificationType.COUPON_EXPIRY]: 'bg-red-100 text-red-800',
      [NotificationType.POINT_EARNED]: 'bg-emerald-100 text-emerald-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`
    return `${Math.floor(diffMins / 1440)}일 전`
  }

  return (
    <div className="relative">
      {/* 알림 벨 아이콘 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">알림</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-sm"
              >
                모두 읽음
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                  getIcon={getNotificationIcon}
                  getColor={getNotificationColor}
                  formatTime={formatTimestamp}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>새로운 알림이 없습니다</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              모든 알림 보기
            </Button>
          </div>
        </div>
      )}

      {/* 배경 클릭시 닫기 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onRead: () => void
  getIcon: (type: NotificationType) => string
  getColor: (type: NotificationType) => string
  formatTime: (timestamp: string) => string
}

function NotificationItem({ 
  notification, 
  onRead, 
  getIcon, 
  getColor, 
  formatTime 
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead()
    }
    
    // 알림 타입에 따라 페이지 이동
    if (notification.data?.link) {
      window.location.href = notification.data.link
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${getColor(notification.type)}`}>
          <span className="text-lg">{getIcon(notification.type)}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${
              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <p className="text-xs text-gray-500 mt-2">
            {formatTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## 알림 Store 구현

```typescript
// src/store/useNotificationStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification, NotificationSettings } from '@/types/notification'
import * as notificationService from '@/services/notificationService'

interface NotificationState {
  notifications: Notification[]
  settings: NotificationSettings
  unreadCount: number
  isLoading: boolean
  
  // Actions
  fetchNotifications: () => Promise<void>
  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      settings: {
        pushNotifications: true,
        emailNotifications: true,
        orderUpdates: true,
        promotions: false,
        restockAlerts: true
      },
      unreadCount: 0,
      isLoading: false,
      
      fetchNotifications: async (): Promise<void> => {
        set({ isLoading: true })
        
        try {
          const notifications = await notificationService.getNotifications()
          const unreadCount = notifications.filter(n => !n.isRead).length
          
          set({ notifications, unreadCount })
        } catch (error) {
          console.error('알림 조회 실패:', error)
        } finally {
          set({ isLoading: false })
        }
      },
      
      addNotification: (notification: Notification): void => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: !notification.isRead 
            ? state.unreadCount + 1 
            : state.unreadCount
        }))
      },
      
      markAsRead: (notificationId: string): void => {
        set(state => {
          const notifications = state.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
          
          const unreadCount = notifications.filter(n => !n.isRead).length
          
          // 서버에 읽음 상태 전송
          notificationService.markAsRead(notificationId)
          
          return { notifications, unreadCount }
        })
      },
      
      markAllAsRead: (): void => {
        set(state => {
          const notifications = state.notifications.map(notification => ({
            ...notification,
            isRead: true
          }))
          
          // 서버에 모든 읽음 상태 전송
          notificationService.markAllAsRead()
          
          return { notifications, unreadCount: 0 }
        })
      },
      
      deleteNotification: (notificationId: string): void => {
        set(state => {
          const notification = state.notifications.find(n => n.id === notificationId)
          const notifications = state.notifications.filter(n => n.id !== notificationId)
          const unreadCount = !notification?.isRead 
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
          
          // 서버에서 삭제
          notificationService.deleteNotification(notificationId)
          
          return { notifications, unreadCount }
        })
      },
      
      updateSettings: async (newSettings: Partial<NotificationSettings>): Promise<void> => {
        const updatedSettings = { ...get().settings, ...newSettings }
        
        try {
          await notificationService.updateSettings(updatedSettings)
          set({ settings: updatedSettings })
        } catch (error) {
          console.error('알림 설정 업데이트 실패:', error)
          throw error
        }
      }
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({ 
        settings: state.settings 
      })
    }
  )
)
```

---

## Service Worker 설정

```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: '보기',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/close-icon.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('고구마 마켓', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
```

---

## 💡 구현 팁

### 1. 성능 최적화
- 알림 목록 가상화로 메모리 사용량 최적화
- 알림 개수 제한 (예: 최근 100개)
- 배치 처리로 서버 요청 최소화

### 2. 사용자 경험
- 알림 그룹화 (같은 타입의 알림들)
- 스와이프 제스처로 알림 삭제
- 알림 우선순위에 따른 표시 순서

### 3. 보안
- WebSocket 연결 시 인증 토큰 사용
- 알림 내용 XSS 방지
- 사용자별 알림 권한 관리

### 4. 오프라인 지원
- Service Worker로 오프라인 알림 저장
- 온라인 복구 시 누락된 알림 동기화

---

## 🚀 확장 기능

1. **알림 카테고리**
   - 주문, 프로모션, 시스템 등 카테고리별 관리
   - 카테고리별 설정 가능

2. **스마트 알림**
   - 사용자 행동 패턴 분석
   - 최적 시간대 알림 발송

3. **알림 템플릿**
   - 다양한 알림 타입별 템플릿
   - 다국어 지원

4. **알림 분석**
   - 알림 클릭률 추적
   - A/B 테스트 지원

이 가이드를 통해 사용자 경험을 향상시키는 실시간 알림 시스템을 구축할 수 있습니다.