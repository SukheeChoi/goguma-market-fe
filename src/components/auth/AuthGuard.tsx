'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, initialize } = useUserStore()

  useEffect(() => {
    const initAuth = async () => {
      await initialize()
    }
    initAuth()
  }, [initialize])

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?returnUrl=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [isAuthenticated, requireAuth, redirectTo, router])

  // 인증이 필요한데 인증되지 않은 경우 로딩 표시
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}