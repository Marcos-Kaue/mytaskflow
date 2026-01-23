'use client'

import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Habit, HabitCompletion } from '@/lib/types'

interface HabitAnalysisTableProps {
  habits: Habit[]
  completions: HabitCompletion[]
}

export function HabitAnalysisTable({ habits, completions }: HabitAnalysisTableProps) {
  const rows = useMemo(() => {
    if (!habits.length) return []

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    return habits.map((habit) => {
      const completedThisMonth = completions.filter((c) => {
        if (c.habit_id !== habit.id) return false
        const date = new Date(c.completed_at)
        return date.getMonth() === month && date.getFullYear() === year
      }).length

      const goal = daysInMonth
      const progress = goal > 0 ? Math.round((completedThisMonth / goal) * 100) : 0

      return {
        id: habit.id,
        name: habit.name,
        goal,
        current: completedThisMonth,
        progress: Math.min(progress, 100),
      }
    })
  }, [habits, completions])

  if (!rows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analise Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Adicione habitos para ver a tabela de progresso mensal ao lado.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Analise Mensal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6">
        {/* Desktop Layout */}
        <div className="hidden sm:block space-y-2">
          <div className="grid grid-cols-[1.3fr,0.6fr,0.6fr,2fr] gap-2 text-xs font-medium text-muted-foreground px-2">
            <span>Habito</span>
            <span className="text-right">Obj</span>
            <span className="text-right">Atual</span>
            <span>Progresso</span>
          </div>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.3fr,0.6fr,0.6fr,2fr] gap-2 items-center text-xs px-2 py-1.5 rounded"
              >
                <span className="truncate font-medium">{row.name}</span>
                <span className="text-right text-muted-foreground">{row.goal}</span>
                <span className="text-right font-medium text-foreground">{row.current}</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={row.progress}
                    className="h-2 flex-1"
                  />
                  <span className="w-10 text-right text-xs text-muted-foreground">
                    {row.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Carousel Layout */}
        <div className="sm:hidden">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex-shrink-0 w-72 border rounded-lg p-4 space-y-3 bg-card snap-center"
              >
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">{row.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Meta: {row.goal} dias</span>
                    <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">
                      {row.progress}%
                    </span>
                  </div>
                </div>
                <Progress value={row.progress} className="h-2.5" />
                <div className="text-right">
                  <span className="text-sm font-semibold text-foreground">{row.current}</span>
                  <span className="text-xs text-muted-foreground ms-1">concluído</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">↔️ Deslize para ver mais</p>
        </div>
      </CardContent>
    </Card>
  )
}

