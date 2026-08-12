'use client'

import { cn } from '@/lib/utils'

type EmojiPickerProps = {
  value: string
  onChange: (emoji: string) => void
  options: readonly string[]
  label?: string
  className?: string
}

export function EmojiPicker({
  value,
  onChange,
  options,
  label = 'Emoji',
  className,
}: EmojiPickerProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium">{label}</span>
        <span className="text-lg leading-none" aria-hidden>
          {value}
        </span>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto rounded-xl border p-2">
        {options.map((emoji) => {
          const selected = value === emoji
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={cn(
                'h-10 w-full rounded-lg text-xl flex items-center justify-center transition-all touch-manipulation',
                selected
                  ? 'bg-primary/15 ring-2 ring-primary'
                  : 'hover:bg-muted bg-muted/40',
              )}
              aria-label={`Escolher emoji ${emoji}`}
              aria-pressed={selected}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}
