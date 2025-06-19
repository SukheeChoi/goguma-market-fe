'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { CartIcon } from "@/components/ui"

export default function Header() {
    const { user, isAuthenticated, logout, initialize } = useUserStore()

    useEffect(() => {
        initialize()
    }, [initialize])

    const handleLogout = async () => {
        await logout()
    }

    return (
        <header className="w-full bg-gray-950 px-6 py-4 border-b border-gray-300">
            <div className="flex justify-between items-center">
                <Link href="/" className="hover:opacity-80">
                    <div>
                        <h1 className="text-xl font-bold text-gray-50">고구마 마켓</h1>
                        <p className="text-sm text-gray-400">React, Tailwind, TypeScript, Zustand 학습용</p>
                        <p className="text-sm text-gray-600">by 오랑우탄</p>
                    </div>
                </Link>

                <div className="flex items-center space-x-4 text-white">
                    {/* 인증된 사용자 메뉴 */}
                    {isAuthenticated && user ? (
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-300">
                                안녕하세요, {user.name}님
                            </span>
                            <Link 
                                href="/profile" 
                                className="text-sm text-gray-300 hover:text-white transition-colors"
                            >
                                프로필
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-300 hover:text-white transition-colors"
                            >
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        /* 비인증 사용자 메뉴 */
                        <div className="flex items-center space-x-4">
                            <Link 
                                href="/auth/login" 
                                className="text-sm text-gray-300 hover:text-white transition-colors"
                            >
                                로그인
                            </Link>
                            <Link 
                                href="/auth/signup" 
                                className="text-sm bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded transition-colors"
                            >
                                회원가입
                            </Link>
                        </div>
                    )}
                    
                    <CartIcon />
                </div>
            </div>
        </header>
    )
}