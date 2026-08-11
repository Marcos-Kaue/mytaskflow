'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number
  className?: string
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  const progressPercentage = Math.round(Math.min(Math.max(0, progress), 100))
  
  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500 progress-indicator",
        className
      )}
      data-progress={progressPercentage}
    />
  )
}
