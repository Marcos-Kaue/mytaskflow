'use client'

import React from "react"

import { useState, useMemo } from 'react'
import { Target, Trophy, TrendingUp, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MonthlyGoal as MonthlyGoalType, Habit, HabitCompletion } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MonthlyGoalProps {
  goal: MonthlyGoalType | null
  habits: Habit[]
  completions: HabitCompletion[]
  onCreateGoal: (targetPercentage: number) => void
  onUpdateGoal: (goalId: string, achievedPercentage: number) => void
}

export function MonthlyGoal({ goal, habits, completions, onCreateGoal, onUpdateGoal }: MonthlyGoalProps) {
  const [open, setOpen] = useState(false)
  const [targetPercentage, setTargetPercentage] = useState(goal?.target_percentage || 80)

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  
  const monthlyStats = useMemo(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    const activeHabits = habits.filter(h => h.is_active)
    if (activeHabits.length === 0) return { percentage: 0, completedDays: 0, totalDays: 0 }
    
    let totalExpected = 0
    let totalCompleted = 0
    
    const dayCount = today.getDate()
    
    for (let d = 0; d < dayCount; d++) {
      const date = new Date(firstDay)
      date.setDate(firstDay.getDate() + d)
      const dateStr = date.toISOString().split('T')[0]
      
      activeHabits.forEach(habit => {
        totalExpected += habit.target_count
        const dayCompletions = completions.filter(
          c => c.habit_id === habit.id && c.completed_at.split('T')[0] === dateStr
        )
        totalCompleted += Math.min(dayCompletions.length, habit.target_count)
      })
    }
    
    const percentage = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0
    
    return {
      percentage,
      completedDays: totalCompleted,
      totalDays: totalExpected,
    }
  }, [habits, completions])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateGoal(targetPercentage)
    setOpen(false)
  }

  const isGoalMet = goal ? monthlyStats.percentage >= goal.target_percentage : false

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isGoalMet && "ring-2 ring-primary"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Meta Mensal
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Meta Mensal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-percentage">Meta de Conclusao (%)</Label>
                <Input
                  id="target-percentage"
                  type="number"
                  min={1}
                  max={100}
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Defina a porcentagem de habitos que voce quer completar este mes
                </p>
              </div>
              <Button type="submit" className="w-full">
                Salvar Meta
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm capitalize text-muted-foreground">{currentMonth}</p>
        
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-foreground">
              {monthlyStats.percentage}%
            </span>
            {goal && (
              <span className="text-sm text-muted-foreground">
                Meta: {goal.target_percentage}%
              </span>
            )}
          </div>
          <Progress 
            value={monthlyStats.percentage} 
            className="h-3"
          />
          {goal && (
            <div 
              className="relative -mt-3 h-3"
              style={{ paddingLeft: `${goal.target_percentage}%` }}
            >
              <div className="absolute top-0 h-3 w-0.5 bg-foreground/50" />
            </div>
          )}
        </div>

        {isGoalMet ? (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-primary">Meta atingida!</p>
              <p className="text-xs text-muted-foreground">
                Parabens! Voce ganhou pontos de bonus
              </p>
            </div>
          </div>
        ) : goal ? (
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                Faltam {goal.target_percentage - monthlyStats.percentage}% para a meta
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
            <Target className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Configure uma meta mensal para acompanhar seu progresso
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
