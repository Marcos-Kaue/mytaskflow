'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Edit2, GripVertical, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Habit } from '@/lib/types'
import { cn } from '@/lib/utils'

type HabitSortableListProps = {
  habits: Habit[]
  selectedDateStr: string
  selectedIsFuture: boolean
  isCompleted: (habitId: string, dateStr: string) => boolean
  onToggleHabit: (habitId: string, date: string, shouldComplete: boolean) => Promise<void>
  onEditHabit: (habit: Habit) => void
  onDeleteHabit: (habitId: string) => void
  onReorderHabits: (orderedIds: string[]) => void
}

function SortableHabitRow({
  habit,
  selectedIsFuture,
  completed,
  onToggle,
  onEdit,
  onDelete,
}: {
  habit: Habit
  selectedIsFuture: boolean
  completed: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1.5 rounded-xl border border-border/60 p-2 bg-card',
        isDragging && 'opacity-90 shadow-md z-10',
      )}
    >
      <button
        type="button"
        className="h-10 w-7 flex items-center justify-center text-muted-foreground touch-none"
        aria-label={`Reordenar ${habit.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={selectedIsFuture}
        onClick={onToggle}
        className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
          completed && 'bg-green-500 text-white shadow-sm',
          !completed && !selectedIsFuture && 'bg-muted hover:bg-muted/80',
          selectedIsFuture && 'bg-muted/40 text-muted-foreground cursor-not-allowed',
        )}
        aria-label={`Marcar ${habit.name}`}
      >
        {completed ? <Check className="h-4 w-4" /> : null}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="text-sm font-medium truncate">{habit.name}</div>
          {habit.counts_for_points === false && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-normal">
              Sem pontos
            </Badge>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {selectedIsFuture ? 'Dia futuro' : completed ? 'Concluído' : 'Pendente'}
        </div>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          aria-label={`Editar ${habit.name}`}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label={`Excluir ${habit.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function HabitSortableList({
  habits,
  selectedDateStr,
  selectedIsFuture,
  isCompleted,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
  onReorderHabits,
}: HabitSortableListProps) {
  const [items, setItems] = useState(habits)

  useEffect(() => {
    setItems(habits)
  }, [habits])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      const next = arrayMove(prev, oldIndex, newIndex)
      onReorderHabits(next.map((item) => item.id))
      return next
    })
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        Nenhum hábito ainda. Adicione o primeiro abaixo.
      </p>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((habit) => (
            <SortableHabitRow
              key={habit.id}
              habit={habit}
              selectedIsFuture={selectedIsFuture}
              completed={isCompleted(habit.id, selectedDateStr)}
              onToggle={() =>
                !selectedIsFuture &&
                void onToggleHabit(
                  habit.id,
                  selectedDateStr,
                  !isCompleted(habit.id, selectedDateStr),
                )
              }
              onEdit={() => onEditHabit(habit)}
              onDelete={() => {
                if (confirm(`Deseja deletar o hábito "${habit.name}"?`)) {
                  onDeleteHabit(habit.id)
                }
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
