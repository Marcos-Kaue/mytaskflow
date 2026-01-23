'use client'

import { Trophy, Flame, Star, Target } from 'lucide-react'
import { UserStats } from '@/lib/types'

interface HeaderProps {
  stats: UserStats | null
}

export function Header({ stats }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">HabitFlow</h1>
            <p className="text-xs text-muted-foreground">Construa habitos melhores</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-foreground">
              {stats?.current_streak || 0} dias
            </span>
          </div>
          
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {stats?.total_points || 0} pts
            </span>
          </div>
          
          <div className="hidden items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 sm:flex">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-foreground">
              {stats?.longest_streak || 0} recorde
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
