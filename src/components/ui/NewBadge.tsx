import { cn } from '@/lib/utils'

interface NewBadgeProps {
  text: string
  type: 'soldout-soon' | 'event' | 'soldout'
  className?: string
}

export default function NewBadge({ text, type, className }: NewBadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-sm'
  
  // 배지 타입별 색상 스타일
  const typeStyles = {
    'soldout-soon': 'bg-orange-500 text-white',  // 품절임박 - 주황색
    'event': 'bg-red-500 text-white',            // 이벤트 - 빨간색  
    'soldout': 'bg-gray-500 text-white'          // 품절 - 회색
  }
  
  return (
    <span
      className={cn(
        baseStyles,
        typeStyles[type],
        className
      )}
    >
      {text}
    </span>
  )
}