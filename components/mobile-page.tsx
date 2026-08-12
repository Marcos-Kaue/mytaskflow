'use client'

import { useState } from 'react'
import { Habit, HabitCompletion, UserStats, Reward, Discipline, Reminder } from '@/lib/types'
import { Trophy, Flame, Target, Zap, Plus, Check, Calendar, Gift, AlertTriangle, TrendingUp, Trash2, Edit2, ChevronLeft, ChevronRight, Bell, RotateCcw } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'
import { RemindersPanel } from '@/components/reminders-panel'
import { UserMenu } from '@/components/user-menu'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { defaultDeadlineDate, formatDeadline, getDisciplineProgress, isDisciplineOpen } from '@/lib/discipline'

const rewardIcons = [
  { value: 'movie', emoji: '🎬', label: 'Filme' },
  { value: 'food', emoji: '🍕', label: 'Comida' },
  { value: 'game', emoji: '🎮', label: 'Jogo' },
  { value: 'shopping', emoji: '🛍️', label: 'Compras' },
  { value: 'trip', emoji: '✈️', label: 'Viagem' },
  { value: 'relax', emoji: '🛋️', label: 'Descanso' },
]

interface MobilePageProps {
  habits: Habit[]
  completions: HabitCompletion[]
  stats: UserStats | null
  rewards: Reward[]
  disciplines: Discipline[]
  reminders: Reminder[]
  selectedYear: number
  selectedMonth: number
  onToggleHabit: (habitId: string, date: string, shouldComplete: boolean) => Promise<void>
  onCreateHabit: (habit: Partial<Habit>) => void
  onUpdateHabit: (habit: Partial<Habit>) => void
  onDeleteHabit: (habitId: string) => void
  onMonthChange: (year: number, month: number) => void
  onCreateReward: (reward: Partial<Reward>) => void
  onUpdateReward: (id: string, reward: Partial<Reward>) => void
  onDeleteReward: (id: string) => void
  onClaimReward: (id: string) => void
  onCreateDiscipline: (discipline: Partial<Discipline>) => void
  onUpdateDiscipline: (id: string, discipline: Partial<Discipline>) => void
  onDeleteDiscipline: (id: string) => void
  onTriggerDiscipline: (id: string) => void
  onResetPoints: () => void
  onCreateReminder: (reminder: Partial<Reminder>) => void
  onCompleteReminder: (id: string) => void
  onUncompleteReminder: (id: string) => void
  onDeleteReminder: (id: string) => void
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function MobilePage({
  habits,
  completions,
  stats,
  rewards,
  disciplines,
  reminders,
  selectedYear,
  selectedMonth,
  onToggleHabit,
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit,
  onMonthChange,
  onCreateReward,
  onUpdateReward,
  onDeleteReward,
  onClaimReward,
  onCreateDiscipline,
  onUpdateDiscipline,
  onDeleteDiscipline,
  onTriggerDiscipline,
  onResetPoints,
  onCreateReminder,
  onCompleteReminder,
  onUncompleteReminder,
  onDeleteReminder,
}: MobilePageProps) {
  const [activeTab, setActiveTab] = useState('habits')
  const [showNewHabitForm, setShowNewHabitForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedDateStr, setSelectedDateStr] = useState(formatLocalDate(new Date()))
  const [showCalendar, setShowCalendar] = useState(true)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [editHabitName, setEditHabitName] = useState('')
  const [habitEditOpen, setHabitEditOpen] = useState(false)
  
  // Reward states
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [rewardName, setRewardName] = useState('')
  const [rewardDescription, setRewardDescription] = useState('')
  const [rewardIcon, setRewardIcon] = useState('movie')
  const [rewardPoints, setRewardPoints] = useState(100)
  
  // Discipline states
  const [disciplineDialogOpen, setDisciplineDialogOpen] = useState(false)
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null)
  const [disciplineName, setDisciplineName] = useState('')
  const [disciplineDescription, setDisciplineDescription] = useState('')
  const [disciplinePenaltyValue, setDisciplinePenaltyValue] = useState(10)
  const [disciplinePenaltyType, setDisciplinePenaltyType] = useState<'points' | 'streak_reset' | 'custom'>('points')
  const [disciplineDeadline, setDisciplineDeadline] = useState(defaultDeadlineDate())
  const [disciplineTargetPoints, setDisciplineTargetPoints] = useState(100)
  const [triggerConfirmId, setTriggerConfirmId] = useState<string | null>(null)

  const today = new Date()
  const todayStr = formatLocalDate(today)

  // Reward handlers
  const handleRewardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rewardName.trim()) return

    if (editingReward) {
      onUpdateReward(editingReward.id, {
        name: rewardName.trim(),
        description: rewardDescription.trim() || null,
        icon: rewardIcon,
        points_required: rewardPoints,
      })
    } else {
      onCreateReward({
        name: rewardName.trim(),
        description: rewardDescription.trim() || null,
        icon: rewardIcon,
        points_required: rewardPoints,
      })
    }

    resetRewardForm()
    setRewardDialogOpen(false)
  }

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward)
    setRewardName(reward.name)
    setRewardDescription(reward.description || '')
    setRewardIcon(reward.icon)
    setRewardPoints(reward.points_required)
    setRewardDialogOpen(true)
  }

  const handleDeleteReward = (rewardId: string) => {
    if (confirm('Tem certeza que deseja excluir esta recompensa?')) {
      onDeleteReward(rewardId)
    }
  }

  const resetRewardForm = () => {
    setRewardName('')
    setRewardDescription('')
    setRewardIcon('movie')
    setRewardPoints(100)
    setEditingReward(null)
  }

  // Discipline handlers
  const handleDisciplineSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!disciplineName.trim()) return

    if (editingDiscipline) {
      onUpdateDiscipline(editingDiscipline.id, {
        name: disciplineName.trim(),
        description: disciplineDescription.trim() || null,
        penalty_value: disciplinePenaltyValue,
        penalty_type: disciplinePenaltyType,
        deadline_at: disciplineDeadline || null,
        target_points: disciplineTargetPoints,
      })
    } else {
      onCreateDiscipline({
        name: disciplineName.trim(),
        description: disciplineDescription.trim() || null,
        penalty_value: disciplinePenaltyValue,
        penalty_type: disciplinePenaltyType,
        deadline_at: disciplineDeadline || null,
        target_points: disciplineTargetPoints,
      })
    }

    resetDisciplineForm()
    setDisciplineDialogOpen(false)
  }

  const handleEditDiscipline = (discipline: Discipline) => {
    setEditingDiscipline(discipline)
    setDisciplineName(discipline.name)
    setDisciplineDescription(discipline.description || '')
    setDisciplinePenaltyValue(discipline.penalty_value)
    setDisciplinePenaltyType(discipline.penalty_type)
    setDisciplineDeadline(discipline.deadline_at || defaultDeadlineDate())
    setDisciplineTargetPoints(discipline.target_points || 100)
    setDisciplineDialogOpen(true)
  }

  const handleDeleteDiscipline = (disciplineId: string) => {
    if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
      onDeleteDiscipline(disciplineId)
    }
  }

  const resetDisciplineForm = () => {
    setDisciplineName('')
    setDisciplineDescription('')
    setDisciplinePenaltyValue(10)
    setDisciplinePenaltyType('points')
    setDisciplineDeadline(defaultDeadlineDate())
    setDisciplineTargetPoints(100)
    setEditingDiscipline(null)
  }

  const getRewardIcon = (iconValue: string) => {
    return rewardIcons.find(i => i.value === iconValue)?.emoji || '🎁'
  }

  // Get days for current month calendar
  const getMonthCalendarDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const firstWeekday = new Date(selectedYear, selectedMonth, 1).getDay()
    const cells: Array<{ date: number; dateStr: string } | null> = []

    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day)
      cells.push({
        date: day,
        dateStr: formatLocalDate(date),
      })
    }

    return cells
  }

  const calendarDays = getMonthCalendarDays()

  // Completion map
  const completionMap: Record<string, Set<string>> = {}
  completions.forEach(c => {
    const dateStr = c.completed_at.split('T')[0]
    if (!completionMap[c.habit_id]) completionMap[c.habit_id] = new Set()
    completionMap[c.habit_id].add(dateStr)
  })

  const isCompleted = (habitId: string, dateStr: string) => {
    return completionMap[habitId]?.has(dateStr) || false
  }

  const getDayProgress = (dateStr: string) => {
    if (habits.length === 0) return 0
    const done = habits.filter((habit) => isCompleted(habit.id, dateStr)).length
    return Math.round((done / habits.length) * 100)
  }

  const goToPreviousMonth = () => {
    const next = new Date(selectedYear, selectedMonth - 1, 1)
    onMonthChange(next.getFullYear(), next.getMonth())
    setSelectedDateStr(formatLocalDate(next))
  }

  const goToNextMonth = () => {
    const next = new Date(selectedYear, selectedMonth + 1, 1)
    onMonthChange(next.getFullYear(), next.getMonth())
    setSelectedDateStr(formatLocalDate(next))
  }

  const goToToday = () => {
    const now = new Date()
    onMonthChange(now.getFullYear(), now.getMonth())
    setSelectedDateStr(formatLocalDate(now))
  }

  const handleSelectDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr)
    if (date.getFullYear() !== selectedYear || date.getMonth() !== selectedMonth) {
      onMonthChange(date.getFullYear(), date.getMonth())
    }
    setSelectedDateStr(dateStr)
  }

  const selectedDateLabel = (() => {
    const date = parseLocalDate(selectedDateStr)
    return `${date.getDate()} de ${MONTHS_FULL[date.getMonth()]}`
  })()

  const selectedIsFuture = parseLocalDate(selectedDateStr) > today
  const selectedCompletedCount = habits.filter((habit) =>
    isCompleted(habit.id, selectedDateStr),
  ).length

  // Calculate progress
  const monthlyProgress = (() => {
    if (habits.length === 0) return 0
    const isCurrentMonth =
      selectedYear === today.getFullYear() && selectedMonth === today.getMonth()
    const currentDay = isCurrentMonth
      ? today.getDate()
      : new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const totalPossible = habits.length * currentDay
    const completed = completions.length
    return totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0
  })()

  const handleQuickAddHabit = () => {
    if (!newHabitName.trim()) return
    onCreateHabit({
      name: newHabitName.trim(),
      icon: 'exercise',
      color: 'emerald',
      frequency: 'daily',
      target_count: 1,
    })
    setNewHabitName('')
    setShowNewHabitForm(false)
  }

  const openEditHabit = (habit: Habit) => {
    setEditingHabit(habit)
    setEditHabitName(habit.name)
    setHabitEditOpen(true)
  }

  const handleEditHabit = () => {
    if (!editingHabit || !editHabitName.trim()) return
    onUpdateHabit({
      id: editingHabit.id,
      name: editHabitName.trim(),
    })
    setHabitEditOpen(false)
    setEditingHabit(null)
    setEditHabitName('')
  }

  const activeDisciplines = disciplines.filter(isDisciplineOpen)
  const availableRewards = rewards.filter(r => !r.is_claimed)

  return (
    <div className="min-h-screen bg-background pb-20">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
        <div className="sticky top-0 z-40 bg-background">
          <header className="bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Logo size={32} />
                  <h1 className="text-lg font-bold truncate">MyTaskFlow</h1>
                </div>
                <div className="flex items-center gap-2">
                  <UserMenu compact />
                  <Badge variant="secondary" className="text-xs">
                    {MONTHS[selectedMonth]} {selectedYear}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-2 gap-1 text-[11px]"
                    onClick={onResetPoints}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Zerar
                  </Button>
                </div>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/10 rounded-lg p-2 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-sm">{stats?.total_points || 0}</div>
                    <div className="text-[10px] opacity-80">Pontos</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-sm">{stats?.current_streak || 0}</div>
                    <div className="text-[10px] opacity-80">Sequência</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-sm">{monthlyProgress}%</div>
                    <div className="text-[10px] opacity-80">Mês</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <TabsList className="w-full rounded-none border-b bg-background h-12 grid grid-cols-5">
            <TabsTrigger value="habits" className="text-[10px] flex flex-col gap-0.5 h-full px-1">
              <Calendar className="h-4 w-4" />
              <span>Hábitos</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="text-[10px] flex flex-col gap-0.5 h-full px-1">
              <Bell className="h-4 w-4" />
              <span>Lembretes</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-[10px] flex flex-col gap-0.5 h-full px-1">
              <Gift className="h-4 w-4" />
              <span>Prêmios</span>
            </TabsTrigger>
            <TabsTrigger value="discipline" className="text-[10px] flex flex-col gap-0.5 h-full px-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Disciplina</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-[10px] flex flex-col gap-0.5 h-full px-1">
              <TrendingUp className="h-4 w-4" />
              <span>Análise</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Habits Tab */}
        <TabsContent value="habits" className="mt-0 p-3 space-y-3 bg-background">
          <Card className="border-primary/20">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="h-9 w-9 p-0"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {MONTHS_FULL[selectedMonth]} {selectedYear}
                  </div>
                  <button
                    type="button"
                    onClick={goToToday}
                    className="text-[11px] text-primary font-medium"
                  >
                    Ir para hoje
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextMonth}
                  className="h-9 w-9 p-0"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setShowCalendar((value) => !value)}
              >
                <Calendar className="h-4 w-4" />
                {showCalendar ? 'Ocultar calendário' : 'Ver calendário'}
              </Button>

              {showCalendar && (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
                    {WEEKDAYS.map((day, index) => (
                      <div key={`${day}-${index}`} className="py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="aspect-square bg-background" />
                      }

                      const progress = getDayProgress(day.dateStr)
                      const isSelected = day.dateStr === selectedDateStr
                      const isToday = day.dateStr === todayStr
                      const isFuture = parseLocalDate(day.dateStr) > today

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => handleSelectDate(day.dateStr)}
                          className={cn(
                            'aspect-square rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5',
                            isSelected && 'bg-primary text-primary-foreground shadow-md',
                            !isSelected && isToday && 'ring-2 ring-primary/60',
                            !isSelected && !isFuture && progress === 100 && 'bg-green-500/15 text-green-700',
                            !isSelected && !isFuture && progress > 0 && progress < 100 && 'bg-primary/15 text-foreground',
                            !isSelected && (isFuture || progress === 0) && 'bg-muted/40 text-muted-foreground',
                          )}
                        >
                          <span>{day.date}</span>
                          {!isFuture && habits.length > 0 && progress > 0 && (
                            <span
                              className={cn(
                                'h-1 w-1 rounded-full',
                                isSelected
                                  ? 'bg-primary-foreground'
                                  : progress === 100
                                    ? 'bg-green-500'
                                    : 'bg-primary',
                              )}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Toque em um dia para ver e marcar os hábitos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span>{selectedDateLabel}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {selectedCompletedCount}/{habits.length} feitos
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {habits.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum hábito ainda. Adicione o primeiro abaixo.
                </p>
              ) : (
                habits.map((habit) => {
                  const completed = isCompleted(habit.id, selectedDateStr)

                  return (
                    <div
                      key={habit.id}
                      className="flex items-center gap-2 rounded-xl border border-border/60 p-2"
                    >
                      <button
                        type="button"
                        disabled={selectedIsFuture}
                        onClick={() =>
                          !selectedIsFuture &&
                          onToggleHabit(habit.id, selectedDateStr, !completed)
                        }
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
                        <div className="text-sm font-medium truncate">{habit.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {selectedIsFuture
                            ? 'Dia futuro'
                            : completed
                              ? 'Concluído'
                              : 'Pendente'}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditHabit(habit)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          aria-label={`Editar ${habit.name}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Deseja deletar o hábito "${habit.name}"?`)) {
                              onDeleteHabit(habit.id)
                            }
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label={`Excluir ${habit.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Add Habit */}
          {!showNewHabitForm ? (
            <Button 
              onClick={() => setShowNewHabitForm(true)}
              className="w-full gap-2"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Adicionar Hábito
            </Button>
          ) : (
            <Card className="border-2 border-primary">
              <CardContent className="p-3 space-y-2">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Nome do hábito..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={handleQuickAddHabit} className="flex-1" size="sm">
                    Criar
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowNewHabitForm(false)
                      setNewHabitName('')
                    }} 
                    variant="outline" 
                    className="flex-1"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reminders" className="mt-0 p-3 bg-background">
          <RemindersPanel
            reminders={reminders}
            onCreateReminder={onCreateReminder}
            onCompleteReminder={onCompleteReminder}
            onUncompleteReminder={onUncompleteReminder}
            onDeleteReminder={onDeleteReminder}
          />
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-0 p-3 space-y-3 bg-background">
          <div className="bg-primary/10 rounded-lg p-3 text-center mb-4">
            <div className="text-2xl font-bold text-primary">{stats?.total_points || 0}</div>
            <div className="text-xs text-muted-foreground">Pontos Disponíveis</div>
          </div>

          <Button 
            onClick={() => {
              resetRewardForm()
              setRewardDialogOpen(true)
            }} 
            className="w-full gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Criar Recompensa
          </Button>

          <div className="space-y-2">
            {availableRewards.map(reward => {
              const canClaim = (stats?.total_points || 0) >= reward.points_required
              
              return (
                <Card key={reward.id} className={cn(
                  "transition-all",
                  canClaim && "border-primary/50 shadow-sm"
                )}>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{getRewardIcon(reward.icon)}</span>
                        {reward.name}
                      </span>
                      <Badge variant={canClaim ? "default" : "secondary"} className="text-xs">
                        {reward.points_required} pts
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {reward.description && (
                      <p className="text-xs text-muted-foreground mb-2">{reward.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onClaimReward(reward.id)}
                        disabled={!canClaim}
                        size="sm"
                        className="flex-1"
                        variant={canClaim ? "default" : "outline"}
                      >
                        {canClaim ? '🎁 Resgatar' : '🔒 Bloqueado'}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditReward(reward)
                        }}
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteReward(reward.id)
                        }}
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {availableRewards.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma recompensa disponível
            </div>
          )}
        </TabsContent>

        {/* Discipline Tab */}
        <TabsContent value="discipline" className="mt-0 p-3 space-y-3 bg-background">
          <Button 
            onClick={() => {
              resetDisciplineForm()
              setDisciplineDialogOpen(true)
            }} 
            className="w-full gap-2"
            size="sm"
            variant="destructive"
          >
            <Plus className="h-4 w-4" />
            Criar Disciplina
          </Button>

          <div className="space-y-2">
            {activeDisciplines.map(discipline => {
              const progress = getDisciplineProgress(discipline, stats?.total_points || 0)

              return (
              <Card key={discipline.id} className="border-destructive/30">
                <CardHeader className="p-3 pb-2 bg-destructive/5">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      {discipline.name}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  {discipline.description && (
                    <p className="text-xs text-muted-foreground mb-2">{discipline.description}</p>
                  )}
                  <div className="rounded-lg bg-muted/50 p-2 mb-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Prazo</span>
                      <span className="font-medium">{formatDeadline(discipline.deadline_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Pontuação a cumprir</span>
                      <span className="font-medium">{progress.current}/{progress.target} pts</span>
                    </div>
                    <p className={cn(
                      'text-[11px] font-medium',
                      progress.metTarget ? 'text-primary' : 'text-destructive',
                    )}>
                      {progress.metTarget
                        ? 'Meta atingida'
                        : progress.daysLeft !== null && progress.daysLeft >= 0
                          ? `Faltam ${progress.remainingPoints} pts · ${progress.daysLeft} dia(s)`
                          : `Faltam ${progress.remainingPoints} pts`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-destructive">
                      -{discipline.penalty_value} {discipline.penalty_type === 'points' ? 'pontos' : 'sequência'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setTriggerConfirmId(discipline.id)}
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                    >
                      Aplicar
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditDiscipline(discipline)
                      }}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDiscipline(discipline.id)
                      }}
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>

          {activeDisciplines.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma disciplina ativa
            </div>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-0 p-3 space-y-3 bg-background">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total de Hábitos</span>
                <span className="font-bold">{habits.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Completados</span>
                <span className="font-bold text-green-600">{completions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Taxa de Sucesso</span>
                <span className="font-bold text-primary">{monthlyProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(Math.max(monthlyProgress, 0), 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Hábitos Mais Concluídos</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {habits
                .map(habit => ({
                  ...habit,
                  count: completions.filter(c => c.habit_id === habit.id).length
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(habit => (
                  <div key={habit.id} className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-2">
                      <span>{habit.icon === 'exercise' ? '💪' : '📚'}</span>
                      <span className="truncate">{habit.name}</span>
                    </span>
                    <Badge variant="secondary" className="text-xs">{habit.count}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={habitEditOpen}
        onOpenChange={(open) => {
          setHabitEditOpen(open)
          if (!open) {
            setEditingHabit(null)
            setEditHabitName('')
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Editar Hábito</DialogTitle>
            <DialogDescription>
              Altere o nome do hábito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-habit-name">Nome</Label>
              <Input
                id="edit-habit-name"
                value={editHabitName}
                onChange={(e) => setEditHabitName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditHabit()}
                placeholder="Nome do hábito"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEditHabit} className="flex-1">
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setHabitEditOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reward Create/Edit Dialog */}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="w-[95vw] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Editar Recompensa' : 'Criar Recompensa'}</DialogTitle>
            <DialogDescription>
              {editingReward ? 'Atualize os detalhes da recompensa' : 'Crie uma nova recompensa para seus hábitos'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRewardSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward-name">Nome</Label>
              <Input
                id="reward-name"
                value={rewardName}
                onChange={(e) => setRewardName(e.target.value)}
                placeholder="Ex: Assistir um filme"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reward-desc">Descrição (opcional)</Label>
              <Input
                id="reward-desc"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                placeholder="Detalhes da recompensa"
              />
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {rewardIcons.map((i) => (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => setRewardIcon(i.value)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all",
                      rewardIcon === i.value 
                        ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {i.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-points">Pontos Necessários</Label>
              <Input
                id="reward-points"
                type="number"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(Number(e.target.value))}
                min={1}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingReward ? 'Atualizar' : 'Criar'}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setRewardDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discipline Create/Edit Dialog */}
      <Dialog open={disciplineDialogOpen} onOpenChange={setDisciplineDialogOpen}>
        <DialogContent className="w-[95vw] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>{editingDiscipline ? 'Editar Disciplina' : 'Criar Disciplina'}</DialogTitle>
            <DialogDescription>
              {editingDiscipline
                ? 'Atualize os detalhes da disciplina'
                : 'Defina o prazo e a pontuação. Se não cumprir, a disciplina é aplicada.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDisciplineSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discipline-name">Nome</Label>
              <Input
                id="discipline-name"
                value={disciplineName}
                onChange={(e) => setDisciplineName(e.target.value)}
                placeholder="Ex: Não completou hábito"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discipline-desc">Descrição (opcional)</Label>
              <Input
                id="discipline-desc"
                value={disciplineDescription}
                onChange={(e) => setDisciplineDescription(e.target.value)}
                placeholder="Detalhes da disciplina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="penalty-type">Tipo de Penalidade</Label>
              <select
                id="penalty-type"
                aria-label="Tipo de penalidade"
                value={disciplinePenaltyType}
                onChange={(e) => setDisciplinePenaltyType(e.target.value as 'points' | 'streak_reset' | 'custom')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="points">Pontos</option>
                <option value="streak_reset">Resetar Sequência</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discipline-deadline">Prazo</Label>
              <Input
                id="discipline-deadline"
                type="date"
                value={disciplineDeadline}
                onChange={(e) => setDisciplineDeadline(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Se a pontuação não for cumprida até esta data, a disciplina é aplicada.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discipline-target">Pontuação a cumprir</Label>
              <Input
                id="discipline-target"
                type="number"
                min={0}
                value={disciplineTargetPoints}
                onChange={(e) => setDisciplineTargetPoints(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="penalty-value">
                Valor da Penalidade
              </Label>
              <Input
                id="penalty-value"
                type="number"
                value={disciplinePenaltyValue}
                onChange={(e) => setDisciplinePenaltyValue(Number(e.target.value))}
                min={1}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" variant="destructive" className="flex-1">
                {editingDiscipline ? 'Atualizar' : 'Criar'}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setDisciplineDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discipline Trigger Confirmation */}
      {triggerConfirmId && (
        <>
          {activeDisciplines.map(d => 
            d.id === triggerConfirmId ? (
              <AlertDialog 
                key={d.id}
                open={triggerConfirmId === d.id} 
                onOpenChange={(open) => !open && setTriggerConfirmId(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Aplicar Disciplina?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você está prestes a aplicar <strong>{d.name}</strong> e perder <strong>{d.penalty_value} {d.penalty_type === 'points' ? 'pontos' : 'da sequência'}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="bg-destructive/10 p-3 rounded-lg text-sm">
                    {d.description && <p>{d.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <AlertDialogCancel className="flex-1">Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        onTriggerDiscipline(d.id)
                        setTriggerConfirmId(null)
                      }}
                      className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            ) : null
          )}
        </>
      )}
    </div>
  )
}
