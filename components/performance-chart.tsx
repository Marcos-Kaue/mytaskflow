'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Habit, HabitCompletion } from '@/lib/types'

interface PerformanceChartProps {
  habits: Habit[]
  completions: HabitCompletion[]
}

export function PerformanceChart({ habits, completions }: PerformanceChartProps) {
  const last7Days = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }, [])

  const dailyData = useMemo(() => {
    const activeHabits = habits.filter(h => h.is_active)
    const totalTarget = activeHabits.reduce((sum, h) => sum + h.target_count, 0)

    return last7Days.map(date => {
      const dayCompletions = completions.filter(
        c => c.completed_at.split('T')[0] === date
      )
      const completed = dayCompletions.length
      const percentage = totalTarget > 0 ? Math.round((completed / totalTarget) * 100) : 0

      const dayName = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })

      return {
        date,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        completed,
        target: totalTarget,
        percentage: Math.min(percentage, 100),
      }
    })
  }, [habits, completions, last7Days])

  const habitBreakdown = useMemo(() => {
    const activeHabits = habits.filter(h => h.is_active)
    
    return activeHabits.map(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id)
      const last7Completions = habitCompletions.filter(c => 
        last7Days.includes(c.completed_at.split('T')[0])
      )
      const percentage = Math.round((last7Completions.length / (habit.target_count * 7)) * 100)

      return {
        name: habit.name.length > 12 ? habit.name.substring(0, 12) + '...' : habit.name,
        fullName: habit.name,
        completions: last7Completions.length,
        target: habit.target_count * 7,
        percentage: Math.min(percentage, 100),
      }
    })
  }, [habits, completions, last7Days])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Desempenho Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress">Progresso Diario</TabsTrigger>
            <TabsTrigger value="habits">Por Habito</TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress" className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="dayName" 
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Progresso']}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#colorPercentage)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="habits" className="h-[250px]">
            {habitBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    type="number" 
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string, props: { payload: { fullName: string } }) => [
                      `${value}%`, 
                      props.payload.fullName
                    ]}
                  />
                  <Bar 
                    dataKey="percentage" 
                    fill="var(--color-primary)" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Adicione habitos para ver o grafico
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
