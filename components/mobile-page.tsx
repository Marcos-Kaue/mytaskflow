'use client'

import { useState } from 'react'
import { Habit, HabitCompletion, UserStats, Reward, Discipline } from '@/lib/types'
import { Trophy, Flame, Target, Zap, Plus, Check, Calendar, Gift, AlertTriangle, TrendingUp, Trash2, Edit2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function MobilePage({
  habits,
  completions,
  stats,
  rewards,
  disciplines,
  selectedYear,
  selectedMonth,
  onToggleHabit,
  onCreateHabit,
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
}: MobilePageProps) {
  const [activeTab, setActiveTab] = useState('habits')
  const [weekIndex, setWeekIndex] = useState(0)
  const [showNewHabitForm, setShowNewHabitForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  
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
      })
    } else {
      onCreateDiscipline({
        name: disciplineName.trim(),
        description: disciplineDescription.trim() || null,
        penalty_value: disciplinePenaltyValue,
        penalty_type: disciplinePenaltyType,
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
    setEditingDiscipline(null)
  }

  const getRewardIcon = (iconValue: string) => {
    return rewardIcons.find(i => i.value === iconValue)?.emoji || '🎁'
  }

  // Get days for current month
  const getDaysInMonth = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const days: { date: number; dateStr: string; weekNum: number }[] = []
    let weekNum = 1
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(selectedYear, selectedMonth, i)
      const weekday = date.getDay()
      
      if (weekday === 0 && i > 1) weekNum++
      
      days.push({
        date: i,
        dateStr: formatLocalDate(date),
        weekNum,
      })
    }
    
    return { days, totalWeeks: weekNum }
  }

  const { days, totalWeeks } = getDaysInMonth()
  
  // Group days by week
  const weekGroups: Record<number, typeof days> = {}
  days.forEach(day => {
    if (!weekGroups[day.weekNum]) weekGroups[day.weekNum] = []
    weekGroups[day.weekNum].push(day)
  })

  const currentWeekDays = weekGroups[weekIndex + 1] || []

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

  // Calculate progress
  const monthlyProgress = (() => {
    if (habits.length === 0) return 0
    const currentDay = today.getDate()
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

  const activeDisciplines = disciplines.filter(d => !d.triggered_at || d.triggered_at === d.created_at)
  const availableRewards = rewards.filter(r => !r.is_claimed)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Compact Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">MyTaskFlow</h1>
            <Badge variant="secondary" className="text-xs">
              {MONTHS[selectedMonth]} {selectedYear}
            </Badge>
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sticky top-[120px] z-30 rounded-none border-b bg-background h-12 grid grid-cols-4">
          <TabsTrigger value="habits" className="text-xs flex flex-col gap-0.5 h-full">
            <Calendar className="h-4 w-4" />
            <span>Hábitos</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs flex flex-col gap-0.5 h-full">
            <Gift className="h-4 w-4" />
            <span>Prêmios</span>
          </TabsTrigger>
          <TabsTrigger value="discipline" className="text-xs flex flex-col gap-0.5 h-full">
            <AlertTriangle className="h-4 w-4" />
            <span>Disciplina</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-xs flex flex-col gap-0.5 h-full">
            <TrendingUp className="h-4 w-4" />
            <span>Análise</span>
          </TabsTrigger>
        </TabsList>

        {/* Habits Tab */}
        <TabsContent value="habits" className="mt-0 p-3 space-y-3">
          {/* Week Navigation */}
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekIndex(Math.max(0, weekIndex - 1))}
                  disabled={weekIndex === 0}
                  className="h-8 px-2"
                >
                  ← Anterior
                </Button>
                <div className="text-xs font-medium">
                  Semana {weekIndex + 1} de {totalWeeks}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekIndex(Math.min(totalWeeks - 1, weekIndex + 1))}
                  disabled={weekIndex >= totalWeeks - 1}
                  className="h-8 px-2"
                >
                  Próxima →
                </Button>
              </div>
              
              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium mb-1">
                {currentWeekDays.map(day => (
                  <div key={day.date} className={cn(
                    "py-0.5",
                    day.dateStr === todayStr && "text-primary font-bold"
                  )}>
                    {day.date}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Habits List */}
          <div className="space-y-2">
            {habits.map(habit => (
              <Card key={habit.id} className="overflow-hidden">
                <CardHeader className="p-3 pb-2 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{habit.icon === 'exercise' ? '💪' : '📚'}</span>
                    <span className="flex-1">{habit.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Deseja deletar o hábito "${habit.name}"?`)) {
                          onDeleteHabit(habit.id)
                        }
                      }}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="grid grid-cols-7 gap-1">
                    {currentWeekDays.map(day => {
                      const completed = isCompleted(habit.id, day.dateStr)
                      const isFuture = new Date(day.dateStr) > today
                      
                      return (
                        <button
                          key={day.date}
                          onClick={() => !isFuture && onToggleHabit(habit.id, day.dateStr, !completed)}
                          disabled={isFuture}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                            completed && "bg-green-500 text-white shadow-sm",
                            !completed && !isFuture && "bg-gray-100 hover:bg-gray-200 text-gray-600",
                            isFuture && "bg-gray-50 text-gray-300 cursor-not-allowed",
                            day.dateStr === todayStr && "ring-2 ring-primary ring-offset-1"
                          )}
                        >
                          {completed && <Check className="h-3 w-3" />}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-0 p-3 space-y-3">
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
        <TabsContent value="discipline" className="mt-0 p-3 space-y-3">
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
            {activeDisciplines.map(discipline => (
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
            ))}
          </div>

          {activeDisciplines.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma disciplina ativa
            </div>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-0 p-3 space-y-3">
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
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${monthlyProgress}%` }}
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
              {editingDiscipline ? 'Atualize os detalhes da disciplina' : 'Crie uma nova regra de disciplina'}
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
