'use client'

import { useState } from 'react'
import { HabitCard } from '@/components/habit-card'
import { HabitForm } from '@/components/habit-form'
import { Habit, HabitCompletion } from '@/lib/types'
import { CalendarDays, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HabitListProps {
  habits: Habit[]
  completions: HabitCompletion[]
  onToggleHabit: (habitId: string, isCompleted: boolean) => void
  onCreateHabit: (habit: Partial<Habit>) => void
  onUpdateHabit: (habit: Partial<Habit>) => void
  onDeleteHabit: (habitId: string) => void
}

export function HabitList({
  habits,
  completions,
  onToggleHabit,
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit,
}: HabitListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const activeHabits = habits.filter(h => h.is_active)

  const filteredHabits = activeHabits.filter(habit => {
    const todayCompletions = completions.filter(
      c => c.habit_id === habit.id && c.completed_at.split('T')[0] === today
    )
    const isCompleted = todayCompletions.length >= habit.target_count

    if (filter === 'pending') return !isCompleted
    if (filter === 'completed') return isCompleted
    return true
  })

  const completedCount = activeHabits.filter(habit => {
    const todayCompletions = completions.filter(
      c => c.habit_id === habit.id && c.completed_at.split('T')[0] === today
    )
    return todayCompletions.length >= habit.target_count
  }).length

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Habitos de Hoje</h2>
          </div>
          <p className="text-sm capitalize text-muted-foreground">{todayFormatted}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ListFilter className="h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <DropdownMenuRadioItem value="all">
                  Todos ({activeHabits.length})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">
                  Pendentes ({activeHabits.length - completedCount})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">
                  Completados ({completedCount})
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <HabitForm onSubmit={onCreateHabit} />
        </div>
      </div>

      {activeHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12">
          <p className="mb-2 text-lg font-medium text-foreground">Nenhum habito ainda</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Comece criando seu primeiro habito para acompanhar
          </p>
          <HabitForm onSubmit={onCreateHabit} />
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border py-8">
          <p className="text-sm text-muted-foreground">
            Nenhum habito {filter === 'pending' ? 'pendente' : 'completado'} hoje
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completions={completions.filter(c => c.habit_id === habit.id)}
              onToggle={onToggleHabit}
              onDelete={onDeleteHabit}
              onEdit={setEditingHabit}
            />
          ))}
        </div>
      )}

      {editingHabit && (
        <HabitForm
          editingHabit={editingHabit}
          onSubmit={onUpdateHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  )
}
