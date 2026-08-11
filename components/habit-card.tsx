'use client'

import { useState, useEffect } from 'react'
import { Check, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/progress-bar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Habit, HabitCompletion } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HabitCardProps {
  habit: Habit
  completions: HabitCompletion[]
  onToggle: (habitId: string, isCompleted: boolean) => void
  onDelete: (habitId: string) => void
  onEdit: (habit: Habit) => void
}

const iconMap: Record<string, string> = {
  exercise: '💪',
  water: '💧',
  reading: '📚',
  meditation: '🧘',
  sleep: '😴',
  coding: '💻',
  writing: '✍️',
  healthy_eating: '🥗',
  no_social_media: '📵',
  gratitude: '🙏',
  default: '✨',
}

export function HabitCard({ habit, completions, onToggle, onDelete, onEdit }: HabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  
  const today = new Date().toISOString().split('T')[0]
  const todayCompletions = completions.filter(
    c => c.completed_at.split('T')[0] === today
  )
  const isCompletedToday = todayCompletions.length >= habit.target_count
  const currentCount = todayCompletions.length
  
  useEffect(() => {
    if (!isAnimating) return
    
    const timeoutId = setTimeout(() => {
      setIsAnimating(false)
    }, 600)
    
    return () => clearTimeout(timeoutId)
  }, [isAnimating])
  
  const handleToggle = () => {
    if (!isCompletedToday) {
      setIsAnimating(true)
    }
    onToggle(habit.id, !isCompletedToday)
  }
  
  const icon = iconMap[habit.icon] || iconMap.default
  const progressPercentage = Math.min((currentCount / habit.target_count) * 100, 100)
  
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isCompletedToday && "ring-2 ring-primary/50 bg-primary/5",
        isAnimating && "scale-[1.02]"
      )}
    >
      <ProgressBar progress={progressPercentage} />
      
      <div className="flex items-center gap-4 p-4">
        <button
          onClick={handleToggle}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-all duration-300",
            isCompletedToday 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
              : "bg-secondary hover:bg-secondary/80"
          )}
        >
          {isCompletedToday ? (
            <Check className="h-6 w-6" />
          ) : (
            <span>{icon}</span>
          )}
        </button>
        
        <div className="min-w-0 flex-1">
          <h3 className={cn(
            "font-semibold truncate transition-colors",
            isCompletedToday && "text-primary"
          )}>
            {habit.name}
          </h3>
          {habit.description && (
            <p className="text-sm text-muted-foreground truncate">
              {habit.description}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentCount}/{habit.target_count} hoje
            </span>
            {habit.frequency !== 'daily' && (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                {habit.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
              </span>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(habit)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(habit.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
