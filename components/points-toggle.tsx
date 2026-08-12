'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type PointsToggleProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  className?: string
}

/** Quadradinho no mesmo estilo do marcar hábito. */
export function PointsToggle({
  checked,
  onCheckedChange,
  id,
  className,
}: PointsToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? 'Vale pontuação' : 'Não vale pontuação'}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all touch-manipulation',
        checked && 'bg-green-500 text-white shadow-sm',
        !checked && 'bg-muted hover:bg-muted/80',
        className,
      )}
    >
      {checked ? <Check className="h-4 w-4" /> : null}
    </button>
  )
}
