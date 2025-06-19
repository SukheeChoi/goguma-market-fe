# 📱 PWA 및 모바일 최적화 구현 가이드

이 문서는 고구마 마켓의 PWA(Progressive Web App) 및 모바일 최적화 구현 방법을 상세히 설명합니다.

## 📋 목차

1. [PWA 기본 설정](#pwa-기본-설정)
2. [Service Worker 구현](#service-worker-구현)
3. [오프라인 지원](#오프라인-지원)
4. [모바일 UI 최적화](#모바일-ui-최적화)
5. [설치 유도 기능](#설치-유도-기능)

---

## PWA 기본 설정

### Web App Manifest 설정

```json
// public/manifest.json
{
  "name": "고구마 마켓",
  "short_name": "고구마마켓",
  "description": "패션 전문 온라인 쇼핑몰",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "scope": "/",
  "lang": "ko",
  "dir": "ltr",
  "categories": ["shopping", "lifestyle"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "장바구니",
      "short_name": "장바구니",
      "description": "장바구니로 바로 이동",
      "url": "/cart",
      "icons": [
        {
          "src": "/icons/cart-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "위시리스트",
      "short_name": "위시리스트",
      "description": "위시리스트로 바로 이동",
      "url": "/wishlist",
      "icons": [
        {
          "src": "/icons/heart-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "홈페이지 데스크톱 화면"
    },
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "375x667",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "홈페이지 모바일 화면"
    }
  ]
}
```

### HTML 메타 태그 설정

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: '고구마 마켓 - 온라인 쇼핑몰',
  description: 'Musinsa 스타일의 패션 쇼핑몰',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '고구마 마켓'
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    title: '고구마 마켓',
    description: '패션 전문 온라인 쇼핑몰',
    url: 'https://goguma-market.com',
    siteName: '고구마 마켓',
    images: [
      {
        url: 'https://goguma-market.com/og-image.png',
        width: 1200,
        height: 630
      }
    ],
    locale: 'ko_KR',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: '고구마 마켓',
    description: '패션 전문 온라인 쇼핑몰',
    images: ['https://goguma-market.com/twitter-image.png']
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}
```

---

## Service Worker 구현

```javascript
// public/sw.js
const CACHE_NAME = 'goguma-market-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'
const IMAGE_CACHE = 'images-v1'

// 캐시할 정적 파일들
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('Service Worker 설치 중...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('정적 파일 캐싱 중...')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('Service Worker 활성화 중...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('오래된 캐시 삭제:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// 요청 가로채기
self.addEventListener('fetch', event => {
  event.respondWith(handleFetch(event.request))
})

async function handleFetch(request) {
  const url = new URL(request.url)
  
  // API 요청 처리
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request)
  }
  
  // 이미지 요청 처리
  if (request.destination === 'image') {
    return handleImageRequest(request)
  }
  
  // HTML 페이지 처리
  if (request.mode === 'navigate') {
    return handleNavigationRequest(request)
  }
  
  // 기타 정적 파일 처리
  return handleStaticRequest(request)
}

// API 요청 처리 (Network First)
async function handleApiRequest(request) {
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('네트워크 오류, 캐시에서 응답:', error)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 오프라인 응답
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: '네트워크 연결을 확인해주세요'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// 이미지 요청 처리 (Cache First)
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      const cache = await caches.open(IMAGE_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('이미지 로드 실패:', error)
    
    // 기본 이미지 반환
    return caches.match('/images/placeholder.jpg')
  }
}

// 네비게이션 요청 처리
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    console.log('페이지 로드 실패, 오프라인 페이지 표시:', error)
    
    const offlinePage = await caches.match('/offline')
    return offlinePage || new Response('Offline', { status: 503 })
  }
}

// 정적 파일 처리 (Cache First)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('정적 파일 로드 실패:', error)
    throw error
  }
}

// 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('백그라운드 동기화 실행')
  
  // 오프라인 중 저장된 데이터 동기화
  const db = await openDB()
  const pendingData = await db.getAll('pending-actions')
  
  for (const action of pendingData) {
    try {
      await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      })
      
      await db.delete('pending-actions', action.id)
    } catch (error) {
      console.log('동기화 실패:', error)
    }
  }
}

// 푸시 알림
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '보기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('고구마 마켓', options)
  )
})

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
```

---

## 오프라인 지원

```typescript
// src/app/offline/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 초기 상태 설정
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 text-6xl">📱</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            오프라인 상태
          </h1>
          <p className="text-gray-600">
            인터넷 연결을 확인해주세요. 연결이 복구되면 자동으로 동기화됩니다.
          </p>
        </div>

        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isOnline ? '온라인' : '오프라인'}
            </div>
          </div>

          <Button
            onClick={handleRetry}
            disabled={!isOnline}
            className="w-full"
          >
            다시 시도
          </Button>

          <div className="text-sm text-gray-500">
            <p>오프라인에서도 이용 가능한 기능:</p>
            <ul className="mt-2 space-y-1">
              <li>• 장바구니 보기</li>
              <li>• 위시리스트 보기</li>
              <li>• 최근 본 상품</li>
              <li>• 캐시된 상품 목록</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### PWA 상태 관리

```typescript
// src/hooks/usePWA.ts
import { useState, useEffect } from 'react'

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  deferredPrompt: any
}

export const usePWA = () => {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    deferredPrompt: null
  })

  useEffect(() => {
    // 설치 가능 상태 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setPWAState(prev => ({
        ...prev,
        isInstallable: true,
        deferredPrompt: e
      }))
    }

    // 설치 완료 감지
    const handleAppInstalled = () => {
      setPWAState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null
      }))
    }

    // 온라인/오프라인 상태 감지
    const handleOnline = () => {
      setPWAState(prev => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      setPWAState(prev => ({ ...prev, isOnline: false }))
    }

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 초기 상태 설정
    setPWAState(prev => ({
      ...prev,
      isOnline: navigator.onLine,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches
    }))

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const installPWA = async () => {
    if (pwaState.deferredPrompt) {
      pwaState.deferredPrompt.prompt()
      const { outcome } = await pwaState.deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setPWAState(prev => ({
          ...prev,
          isInstallable: false,
          deferredPrompt: null
        }))
      }
    }
  }

  return {
    ...pwaState,
    installPWA
  }
}
```

---

## 모바일 UI 최적화

```typescript
// src/components/mobile/MobileNavigation.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store'

export default function MobileNavigation() {
  const pathname = usePathname()
  const { getTotalItems } = useCartStore()
  const totalItems = getTotalItems()

  const navItems = [
    {
      href: '/',
      label: '홈',
      icon: '🏠',
      active: pathname === '/'
    },
    {
      href: '/categories',
      label: '카테고리',
      icon: '📁',
      active: pathname.startsWith('/categories')
    },
    {
      href: '/search',
      label: '검색',
      icon: '🔍',
      active: pathname === '/search'
    },
    {
      href: '/cart',
      label: '장바구니',
      icon: '🛒',
      active: pathname === '/cart',
      badge: totalItems > 0 ? totalItems : undefined
    },
    {
      href: '/profile',
      label: '내 정보',
      icon: '👤',
      active: pathname.startsWith('/profile')
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
              item.active ? 'text-black' : 'text-gray-500'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
            
            {item.badge && (
              <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

### 터치 제스처 지원

```typescript
// src/hooks/useSwipeGesture.ts
import { useState, useRef, TouchEvent } from 'react'

interface SwipeGestureConfig {
  threshold?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export const useSwipeGesture = ({
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown
}: SwipeGestureConfig) => {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 })

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd({ x: 0, y: 0 })
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEnd = () => {
    if (!touchStart.x || !touchStart.y || !touchEnd.x || !touchEnd.y) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > threshold
    const isRightSwipe = distanceX < -threshold
    const isUpSwipe = distanceY > threshold
    const isDownSwipe = distanceY < -threshold

    // 수평 스와이프가 수직 스와이프보다 큰 경우
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft()
      }
      if (isRightSwipe && onSwipeRight) {
        onSwipeRight()
      }
    } else {
      // 수직 스와이프가 수평 스와이프보다 큰 경우
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp()
      }
      if (isDownSwipe && onSwipeDown) {
        onSwipeDown()
      }
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}
```

---

## 설치 유도 기능

```typescript
// src/components/pwa/InstallPrompt.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { Button } from '@/components/ui'

export default function InstallPrompt() {
  const { isInstallable, isInstalled, installPWA } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 이미 설치되었거나 거부한 경우 프롬프트 숨김
    if (isInstalled || dismissed) {
      setShowPrompt(false)
      return
    }

    // 설치 가능한 상태이고 일정 시간 후 프롬프트 표시
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // 5초 후 표시

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, dismissed])

  const handleInstall = async () => {
    try {
      await installPWA()
      setShowPrompt(false)
    } catch (error) {
      console.error('설치 실패:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    
    // 로컬 스토리지에 거부 상태 저장
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt || !isInstallable) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-80">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <img
            src="/icons/icon-72x72.png"
            alt="고구마 마켓"
            className="w-12 h-12 rounded-lg"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">
            고구마 마켓 설치
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            앱을 설치하면 더 빠르고 편리하게 쇼핑할 수 있어요!
          </p>
          
          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              onClick={handleInstall}
              className="text-xs"
            >
              설치하기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs"
            >
              나중에
            </Button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
```

### PWA 설치 가이드

```typescript
// src/components/pwa/InstallGuide.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

export default function InstallGuide() {
  const [currentStep, setCurrentStep] = useState(0)
  
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  const isIOS = typeof window !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  const steps = isIOS ? [
    {
      title: '공유 버튼 탭',
      description: 'Safari 하단의 공유 버튼을 탭하세요',
      icon: '📤'
    },
    {
      title: '홈 화면에 추가',
      description: '"홈 화면에 추가" 옵션을 선택하세요',
      icon: '➕'
    },
    {
      title: '추가 완료',
      description: '홈 화면에서 고구마 마켓 앱을 확인하세요',
      icon: '✅'
    }
  ] : [
    {
      title: '메뉴 버튼 탭',
      description: 'Chrome 우상단의 메뉴(⋮) 버튼을 탭하세요',
      icon: '⋮'
    },
    {
      title: '홈 화면에 추가',
      description: '"홈 화면에 추가" 옵션을 선택하세요',
      icon: '➕'
    },
    {
      title: '설치 완료',
      description: '홈 화면에서 고구마 마켓 앱을 확인하세요',
      icon: '✅'
    }
  ]

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2">앱 설치 가이드</h2>
        <p className="text-gray-600 text-sm">
          고구마 마켓을 홈 화면에 추가하세요
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              index === currentStep 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-gray-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              index === currentStep 
                ? 'bg-blue-500 text-white' 
                : index < currentStep 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{step.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{step.description}</p>
            </div>
            
            <div className="text-2xl">{step.icon}</div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex-1"
        >
          이전
        </Button>
        <Button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex-1"
        >
          {currentStep === steps.length - 1 ? '완료' : '다음'}
        </Button>
      </div>
    </div>
  )
}
```

---

## 💡 구현 팁

### 1. 성능 최적화
- 중요한 리소스 우선 캐싱
- 이미지 지연 로딩 및 WebP 포맷 사용
- Critical CSS 인라인 삽입
- 코드 스플리팅으로 번들 크기 최적화

### 2. 사용자 경험
- 오프라인 상태 명확한 표시
- 로딩 상태 스켈레톤 UI 제공
- 터치 친화적 버튼 크기 (최소 44px)
- 스와이프 제스처 지원

### 3. 접근성
- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 고대비 모드 지원
- 폰트 크기 조절 가능

### 4. SEO 최적화
- 메타 태그 적절한 설정
- 구조화된 데이터 마크업
- 사이트맵 제공
- robots.txt 설정

---

## 🚀 확장 기능

1. **고급 캐싱 전략**
   - 예측적 캐싱 (사용자 행동 패턴 기반)
   - 백그라운드 동기화
   - 캐시 우선순위 관리

2. **네이티브 앱 기능**
   - 웹 공유 API
   - 파일 시스템 액세스
   - 카메라 및 위치 서비스

3. **성능 모니터링**
   - Core Web Vitals 추적
   - 사용자 경험 메트릭
   - 오프라인 사용 패턴 분석

4. **개인화**
   - 사용자별 캐싱 전략
   - 맞춤형 오프라인 콘텐츠
   - 디바이스별 최적화

이 가이드를 통해 사용자에게 네이티브 앱과 같은 경험을 제공하는 PWA를 구축할 수 있습니다.