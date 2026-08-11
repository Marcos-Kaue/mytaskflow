'use client'

import { Trophy, Flame, Star } from 'lucide-react'
import { UserStats } from '@/lib/types'
import { Logo } from './logo'

interface HeaderProps {
  stats: UserStats | null
}

export function Header({ stats }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Logo size={40} className="flex-shrink-0" />
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">MyTaskFlow</h1>
            <p className="text-xs text-muted-foreground">Rastreie seus hábitos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-1 sm:gap-2 rounded-lg bg-accent/50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
            <span className="font-semibold text-foreground whitespace-nowrap">
              {stats?.current_streak || 0}
            </span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 rounded-lg bg-primary/10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
            <span className="font-semibold text-foreground whitespace-nowrap">
              {stats?.total_points || 0}
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-1 sm:gap-2 rounded-lg bg-accent/50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
            <span className="font-semibold text-foreground whitespace-nowrap">
              {stats?.longest_streak || 0}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
