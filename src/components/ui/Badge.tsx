import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'new' | 'best' | 'sale' | 'default'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

export default function Badge({ 
  variant = 'default', 
  size = 'sm',
  children, 
  className 
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full'
  
  const variants = {
    new: 'bg-blue-100 text-blue-800 border border-blue-200',
    best: 'bg-red-100 text-red-800 border border-red-200',
    sale: 'bg-orange-100 text-orange-800 border border-orange-200',
    default: 'bg-gray-100 text-gray-800 border border-gray-200'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }
  
  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}