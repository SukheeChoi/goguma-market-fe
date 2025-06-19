import './globals.css'
import 'react-toastify/dist/ReactToastify.css'
import Header from '@/components/layout/Header'
import { CategoryNav } from '@/components/shop'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { ToastContainer } from 'react-toastify'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '고구마 마켓',
  description: '고구마고구마고구마',
  keywords: ['맛있는 고구마', '쇼핑몰', '감자', '고구마', '군고구마'],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Header />
        <CategoryNav />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  )
}
