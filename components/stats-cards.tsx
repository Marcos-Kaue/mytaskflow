'use client'

import { CheckCircle2, Target, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { UserStats, Habit, HabitCompletion } from '@/lib/types'

interface StatsCardsProps {
  stats: UserStats | null
  habits: Habit[]
  completions: HabitCompletion[]
}

export function StatsCards({ stats, habits, completions }: StatsCardsProps) {
  const today = new Date().toISOString().split('T')[0]
  const todayCompletions = completions.filter(
    c => c.completed_at.split('T')[0] === today
  )
  
  const activeHabits = habits.filter(h => h.is_active)
  const totalTargetToday = activeHabits.reduce((sum, h) => sum + h.target_count, 0)
  const completedToday = todayCompletions.length
  const percentageToday = totalTargetToday > 0 
    ? Math.round((completedToday / totalTargetToday) * 100) 
    : 0

  const cards = [
    {
      label: 'Completados Hoje',
      value: `${completedToday}/${totalTargetToday}`,
      icon: CheckCircle2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Progresso Diario',
      value: `${percentageToday}%`,
      icon: Target,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/50',
    },
    {
      label: 'Total de Habitos',
      value: activeHabits.length.toString(),
      icon: Calendar,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      label: 'Total Completados',
      value: stats?.total_completions?.toString() || '0',
      icon: TrendingUp,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
