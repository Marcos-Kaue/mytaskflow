'use client'

import { useState, useMemo } from 'react'
import { Plus, Check, Trash2, Edit2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Habit, HabitCompletion } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface HabitGridProps {
  habits: Habit[]
  completions: HabitCompletion[]
  onToggleHabit: (habitId: string, date: string, shouldComplete: boolean) => Promise<void>
  onCreateHabit: (habit: Partial<Habit>) => void
  onDeleteHabit: (habitId: string) => void
  onUpdateHabit: (habit: Partial<Habit>) => void
  selectedYear?: number
  selectedMonth?: number
  onMonthChange?: (year: number, month: number) => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTHS = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Função para formatar data local sem problemas de timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  const days: { date: number; weekday: number; dateStr: string; weekNum: number }[] = []
  let weekNum = 1
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    const weekday = date.getDay()
    
    // Start new week on Sunday
    if (weekday === 0 && i > 1) {
      weekNum++
    }
    
    days.push({
      date: i,
      weekday,
      dateStr: formatLocalDate(date), // Usar formatação local
      weekNum,
    })
  }
  
  return { days, daysInMonth, totalWeeks: weekNum }
}

export function HabitGrid({
  habits,
  completions,
  onToggleHabit,
  onCreateHabit,
  onDeleteHabit,
  onUpdateHabit,
  selectedYear,
  selectedMonth,
  onMonthChange,
}: HabitGridProps) {
  const [newHabitName, setNewHabitName] = useState('')
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [editName, setEditName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [processingCells, setProcessingCells] = useState<Set<string>>(new Set())
  const [mobileWeekIndex, setMobileWeekIndex] = useState(0)
  
  const today = new Date()
  const viewYear = selectedYear ?? today.getFullYear()
  const viewMonth = selectedMonth ?? today.getMonth()
  const todayStr = formatLocalDate(today) // Usar formatação local
  
  const { days, totalWeeks } = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth])
  
  const handlePreviousMonth = () => {
    const newDate = new Date(viewYear, viewMonth - 1, 1)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth())
  }
  
  const handleNextMonth = () => {
    const newDate = new Date(viewYear, viewMonth + 1, 1)
    onMonthChange?.(newDate.getFullYear(), newDate.getMonth())
  }
  
  const handleToday = () => {
    onMonthChange?.(today.getFullYear(), today.getMonth())
  }
  
  // Group days by week number
  const weekGroups = useMemo(() => {
    const groups: Record<number, typeof days> = {}
    days.forEach(day => {
      if (!groups[day.weekNum]) {
        groups[day.weekNum] = []
      }
      groups[day.weekNum].push(day)
    })
    return groups
  }, [days])
  
  const completionMap = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    completions.forEach(c => {
      const dateStr = c.completed_at.split('T')[0]
      if (!map[c.habit_id]) {
        map[c.habit_id] = new Set()
      }
      map[c.habit_id].add(dateStr)
    })
    return map
  }, [completions])
  
  const isCompleted = (habitId: string, dateStr: string) => {
    return completionMap[habitId]?.has(dateStr) || false
  }
  
  // Calculate total completions for the viewed month
  const totalCompletions = completions.filter(c => {
    const date = new Date(c.completed_at)
    return date.getMonth() === viewMonth && date.getFullYear() === viewYear
  }).length
  
  const handleCreateHabit = () => {
    if (!newHabitName.trim()) return
    onCreateHabit({
      name: newHabitName.trim(),
      icon: '',
      color: '#000000',
      frequency: 'daily',
      target_count: 1,
    })
    setNewHabitName('')
    setIsDialogOpen(false)
  }
  
  const handleEditHabit = () => {
    if (!editingHabit || !editName.trim()) return
    onUpdateHabit({
      id: editingHabit.id,
      name: editName.trim(),
    })
    setEditingHabit(null)
    setEditName('')
    setIsEditDialogOpen(false)
  }
  
  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit)
    setEditName(habit.name)
    setIsEditDialogOpen(true)
  }
  
  // Calculate stats per day
  const getDayStats = (dateStr: string) => {
    let done = 0
    habits.forEach(habit => {
      if (isCompleted(habit.id, dateStr)) {
        done++
      }
    })
    const progress = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0
    return { done, notDone: habits.length - done, progress }
  }

  // Filtrar dias para a semana atual no mobile
  const mobileWeekDays = useMemo(() => {
    const weekNumbers = Object.keys(weekGroups).map(Number).sort((a, b) => a - b)
    if (weekNumbers.length === 0) return []
    const currentWeek = Math.max(0, Math.min(mobileWeekIndex, weekNumbers.length - 1))
    return weekGroups[weekNumbers[currentWeek]] || []
  }, [weekGroups, mobileWeekIndex])
  
  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="flex justify-center gap-8 sm:gap-16 py-3 sm:py-4 border-b border-border px-2">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Numero de Habitos</div>
          <div className="text-2xl font-bold">{habits.length}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Habitos Completados</div>
          <div className="text-2xl font-bold">{totalCompletions}</div>
        </div>
      </div>
      
      {/* Month Header with Navigation */}
      <div className="bg-secondary py-2 sm:py-3">
        <div className="flex items-center justify-between px-2 sm:px-4 gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center min-w-0">
            <button
              onClick={handleToday}
              className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
              aria-label="Ir para hoje"
              title="Ir para o mês atual"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <h2 className="text-base sm:text-xl font-medium text-foreground text-center truncate">
              <span className="hidden sm:inline">{MONTHS[viewMonth]} {viewYear}</span>
              <span className="sm:hidden">{MONTHS[viewMonth].slice(0, 3)} {String(viewYear).slice(-2)}</span>
            </h2>
          </div>
          
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
      
      {/* Grid Container - Desktop Version */}
      <div className="hidden sm:block w-full overflow-x-auto pb-4 -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="min-w-min">
          <table 
            className="border-collapse text-xs w-full"
            role="table"
          >
          {/* Week Headers Row */}
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card border border-border p-1 min-w-[120px] sm:min-w-[150px]"></th>
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNum => {
                const weekDays = weekGroups[weekNum] || []
                return (
                  <th 
                    key={weekNum} 
                    colSpan={weekDays.length}
                    className="border border-border bg-secondary p-1 text-center font-medium text-xs"
                  >
                    <span className="hidden sm:inline">Semana {weekNum}</span>
                    <span className="sm:hidden">S{weekNum}</span>
                  </th>
                )
              })}
            </tr>
            {/* Day Names Row */}
            <tr>
              <th className="sticky left-0 z-10 bg-card border border-border p-1 min-w-[120px] sm:min-w-[150px]"></th>
              {days.map((day) => (
                <th 
                  key={day.dateStr}
                  className={`border border-border p-1 text-center w-7 sm:w-8 text-[10px] sm:text-xs ${
                    day.dateStr === todayStr ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  {WEEKDAYS[day.weekday]}
                </th>
              ))}
            </tr>
            {/* Day Numbers Row */}
            <tr>
              <th className="sticky left-0 z-10 bg-card border border-border p-1 text-left font-medium min-w-[120px] sm:min-w-[150px] text-[11px] sm:text-sm">
                Habitos
              </th>
              {days.map((day) => (
                <th 
                  key={day.dateStr}
                  className={`border border-border p-1 text-center w-7 sm:w-8 text-[10px] sm:text-xs ${
                    day.dateStr === todayStr ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  {day.date}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {/* Habits Rows */}
            {habits.map((habit) => (
              <tr key={habit.id} className="group">
                <td className="sticky left-0 z-10 bg-card border border-border p-1 min-w-[120px] sm:min-w-[150px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs sm:text-sm">{habit.name}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditDialog(habit)}
                        className="p-0.5 hover:bg-muted rounded touch-manipulation"
                        title="Editar hábito"
                      >
                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-0.5 hover:bg-muted rounded touch-manipulation"
                        title="Deletar hábito"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                </td>
                {days.map((day) => {
                  const completed = isCompleted(habit.id, day.dateStr)
                  const cellKey = `${habit.id}-${day.dateStr}`
                  const isProcessing = processingCells.has(cellKey)
                  
                  return (
                    <td 
                      key={day.dateStr}
                      className="border border-border p-0.5 sm:p-1 text-center w-7 sm:w-8"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          
                          if (isProcessing) {
                            console.log('Já processando, ignorando clique')
                            return
                          }
                          
                          setProcessingCells(prev => new Set(prev).add(cellKey))
                          
                          onToggleHabit(habit.id, day.dateStr, !completed)
                            .then(() => {
                              setProcessingCells(prev => {
                                const next = new Set(prev)
                                next.delete(cellKey)
                                return next
                              })
                            })
                            .catch((error) => {
                              console.error('Erro ao alternar hábito:', error)
                              setProcessingCells(prev => {
                                const next = new Set(prev)
                                next.delete(cellKey)
                                return next
                              })
                            })
                        }}
                        disabled={isProcessing}
                        className={`h-4 w-4 sm:h-5 sm:w-5 border rounded-sm flex items-center justify-center mx-auto transition-all cursor-pointer ${
                          isProcessing 
                            ? 'opacity-50 cursor-wait pointer-events-none' 
                            : completed 
                            ? 'bg-foreground border-foreground hover:opacity-90 active:scale-95' 
                            : 'border-border hover:border-muted-foreground bg-card hover:bg-muted active:scale-95'
                        }`}
                        aria-label={completed ? `Desmarcar ${habit.name} em ${day.dateStr}` : `Marcar ${habit.name} em ${day.dateStr}`}
                      >
                        {completed && <Check className="h-3 w-3 sm:h-3 sm:w-3 text-background" />}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            
            {/* Empty rows for visual consistency */}
            {habits.length < 10 && Array.from({ length: Math.max(0, 5 - habits.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="sticky left-0 z-10 bg-card border border-border p-1 h-7 min-w-[150px]"></td>
                {days.map((day) => (
                  <td key={day.dateStr} className="border border-border p-0.5 h-7">
                    <div className="h-5 w-5 border border-border rounded-sm mx-auto bg-card"></div>
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Progress Row */}
            <tr className="bg-secondary">
              <td className="sticky left-0 z-10 bg-secondary border border-border p-1 font-medium min-w-[150px]">
                Progresso
              </td>
              {days.map((day) => {
                const stats = getDayStats(day.dateStr)
                return (
                  <td 
                    key={day.dateStr}
                    className={`border border-border p-1 text-center font-medium ${
                      stats.progress === 100 ? 'text-accent' : ''
                    }`}
                  >
                    {stats.progress}%
                  </td>
                )
              })}
            </tr>
            
            {/* Done Row */}
            <tr className="bg-secondary">
              <td className="sticky left-0 z-10 bg-secondary border border-border p-1 min-w-[150px]">
                Feito
              </td>
              {days.map((day) => {
                const stats = getDayStats(day.dateStr)
                return (
                  <td key={day.dateStr} className="border border-border p-1 text-center">
                    {stats.done}
                  </td>
                )
              })}
            </tr>
            
            {/* Not Done Row */}
            <tr className="bg-secondary">
              <td className="sticky left-0 z-10 bg-secondary border border-border p-1 min-w-[150px]">
                Nao Feito
              </td>
              {days.map((day) => {
                const stats = getDayStats(day.dateStr)
                return (
                  <td key={day.dateStr} className="border border-border p-1 text-center text-muted-foreground">
                    {stats.notDone}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Version - Single Week View */}
      <div className="sm:hidden space-y-2">
        {/* Week Navigation */}
        <div className="flex items-center justify-between px-2 gap-2 bg-secondary py-2 rounded">
          <button
            onClick={() => setMobileWeekIndex(Math.max(0, mobileWeekIndex - 1))}
            disabled={mobileWeekIndex === 0}
            className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
            title="Semana anterior"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium">
            Semana {mobileWeekIndex + 1}
          </span>
          <button
            onClick={() => setMobileWeekIndex(mobileWeekIndex + 1)}
            disabled={mobileWeekIndex >= Object.keys(weekGroups).length - 1}
            className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
            title="Próxima semana"
            aria-label="Próxima semana"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Table - Single Week */}
        <div className="overflow-x-auto pb-4">
          <table 
            className="border-collapse text-xs w-full"
            role="table"
          >
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card border border-border p-1 min-w-[80px]"></th>
                {mobileWeekDays.map((day) => (
                  <th 
                    key={day.dateStr}
                    className={`border border-border p-1 text-center min-w-[45px] text-[10px] ${
                      day.dateStr === todayStr ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}
                  >
                    <div>{WEEKDAYS[day.weekday]}</div>
                    <div className="font-bold">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {/* Habits Rows */}
              {habits.map((habit) => (
                <tr key={habit.id} className="group">
                  <td className="sticky left-0 z-10 bg-card border border-border p-1 min-w-[80px]">
                    <span className="truncate text-xs block">{habit.name}</span>
                  </td>
                  {mobileWeekDays.map((day) => {
                    const completed = isCompleted(habit.id, day.dateStr)
                    const cellKey = `${habit.id}-${day.dateStr}`
                    const isProcessing = processingCells.has(cellKey)
                    
                    return (
                      <td 
                        key={day.dateStr}
                        className="border border-border p-1 text-center"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            
                            if (isProcessing) return
                            
                            setProcessingCells(prev => new Set(prev).add(cellKey))
                            
                            onToggleHabit(habit.id, day.dateStr, !completed)
                              .then(() => {
                                setProcessingCells(prev => {
                                  const next = new Set(prev)
                                  next.delete(cellKey)
                                  return next
                                })
                              })
                              .catch((error) => {
                                console.error('Erro ao alternar hábito:', error)
                                setProcessingCells(prev => {
                                  const next = new Set(prev)
                                  next.delete(cellKey)
                                  return next
                                })
                              })
                          }}
                          disabled={isProcessing}
                          className={`h-5 w-5 border rounded-sm flex items-center justify-center mx-auto transition-all cursor-pointer ${
                            isProcessing 
                              ? 'opacity-50 cursor-wait pointer-events-none' 
                              : completed 
                              ? 'bg-foreground border-foreground hover:opacity-90 active:scale-95' 
                              : 'border-border hover:border-muted-foreground bg-card hover:bg-muted active:scale-95'
                          }`}
                          aria-label={completed ? `Desmarcar ${habit.name}` : `Marcar ${habit.name}`}
                        >
                          {completed && <Check className="h-3 w-3 text-background" />}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Habit Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full border-dashed bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Habito
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Habito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Nome do habito (ex: Acordar as 5:00h)"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateHabit()}
            />
            <Button onClick={handleCreateHabit} className="w-full">
              Criar Habito
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Habit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Habito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Nome do habito"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditHabit()}
            />
            <Button onClick={handleEditHabit} className="w-full">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
