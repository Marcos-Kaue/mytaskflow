'use client'

import { useMemo } from 'react'
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Habit, HabitCompletion } from '@/lib/types'

interface ProgressLineChartProps {
  habits: Habit[]
  completions: HabitCompletion[]
}

export function ProgressLineChart({ habits, completions }: ProgressLineChartProps) {
  const chartData = useMemo(() => {
    if (habits.length === 0) return []
    
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    const data = []
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const dateStr = date.toISOString().split('T')[0]
      
      const completedCount = habits.filter(habit => 
        completions.some(c => 
          c.habit_id === habit.id && c.completed_at.split('T')[0] === dateStr
        )
      ).length
      
      const progress = Math.round((completedCount / habits.length) * 100)
      
      data.push({
        day: i,
        progress: date <= today ? progress : null,
      })
    }
    
    return data
  }, [habits, completions])
  
  return (
    <Card>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-sm sm:text-base font-medium">Progresso do Mes</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[100px] sm:h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                width={30}
              />
              <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="progress" 
                stroke="var(--accent)" 
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-between text-[10px] sm:text-xs text-muted-foreground px-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </CardContent>
    </Card>
  )
}
