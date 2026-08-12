'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { toast } from '@/hooks/use-toast'
import { HabitGrid } from '@/components/habit-grid'
import { HabitAnalysisTable } from '@/components/habit-analysis-table'
import { ProgressLineChart } from '@/components/progress-line-chart'
import { RewardsPanel } from '@/components/rewards-panel'
import { DisciplinePanel } from '@/components/discipline-panel'
import { MobilePage } from '@/components/mobile-page'
import { Logo } from '@/components/logo'
import { StorageBanner } from '@/components/storage-banner'
import { DateAlerts } from '@/components/date-alerts'
import { RemindersPanel } from '@/components/reminders-panel'
import { UserMenu } from '@/components/user-menu'
import { Button } from '@/components/ui/button'
import { Habit, HabitCompletion, UserStats, Reward, Discipline, Reminder } from '@/lib/types'
import { Flame, RotateCcw, Target, Zap } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatLocalDate, isDisciplineOpen } from '@/lib/discipline'
import {
  claimReward,
  completeReminder,
  createDiscipline,
  createHabit,
  createReminder,
  createReward,
  deleteCompletions,
  deleteDiscipline,
  deleteHabit,
  deleteReminder,
  deleteReward,
  ensureUserStats,
  fetchCompletions,
  fetchDisciplines,
  fetchHabits,
  fetchReminders,
  fetchRewards,
  fetchStats,
  fulfillDiscipline,
  getBackendStatus,
  insertCompletion,
  resetPoints,
  triggerDiscipline,
  uncompleteReminder,
  updateDiscipline,
  updateHabit,
  updateReward,
  updateStats,
} from '@/lib/repo'

export default function HomePage() {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const isMobile = useIsMobile()
  
  const completionKey = `completions-${selectedYear}-${selectedMonth}`
  
  const { data: habits = [] } = useSWR<Habit[]>('habits', fetchHabits)
  const { data: completions = [] } = useSWR<HabitCompletion[]>(
    completionKey,
    () => fetchCompletions(selectedYear, selectedMonth),
    { keepPreviousData: true },
  )
  const { data: stats } = useSWR<UserStats | null>('stats', fetchStats)
  const { data: rewards = [] } = useSWR<Reward[]>('rewards', fetchRewards)
  const { data: disciplines = [] } = useSWR<Discipline[]>('disciplines', fetchDisciplines)
  const { data: reminders = [] } = useSWR<Reminder[]>('reminders', fetchReminders)

  const backendStatus = getBackendStatus()
  const processedDeadlines = useRef(new Set<string>())

  const initUserStats = useCallback(async () => {
    try {
      await ensureUserStats()
      mutate('stats')
    } catch (error) {
      console.error('Erro ao iniciar estatísticas:', error)
    }
  }, [])

  useEffect(() => {
    initUserStats()
  }, [initUserStats])

  useEffect(() => {
    if (!stats) return

    const today = formatLocalDate(new Date())
    const expired = disciplines.filter((discipline) => {
      if (processedDeadlines.current.has(discipline.id)) return false
      if (!isDisciplineOpen(discipline)) return false
      if (!discipline.deadline_at || discipline.deadline_at >= today) return false
      return true
    })
    if (expired.length === 0) return

    let cancelled = false
    let remainingPoints = stats.total_points || 0

    ;(async () => {
      for (const discipline of expired) {
        if (cancelled) return
        processedDeadlines.current.add(discipline.id)
        const metTarget = remainingPoints >= (discipline.target_points || 0)

        try {
          if (metTarget) {
            await fulfillDiscipline(discipline.id)
            toast({ title: `Prazo cumprido: ${discipline.name}` })
          } else {
            await triggerDiscipline(discipline.id)
            if (discipline.penalty_type === 'points') {
              remainingPoints = Math.max(remainingPoints - discipline.penalty_value, 0)
              await updateStats({ total_points: remainingPoints })
            } else if (discipline.penalty_type === 'streak_reset') {
              await updateStats({ current_streak: 0 })
            }
            toast({
              title: `Prazo vencido: ${discipline.name}`,
              description: 'A pontuação não foi cumprida e a disciplina foi aplicada.',
              variant: 'destructive',
            })
          }
        } catch (error) {
          processedDeadlines.current.delete(discipline.id)
          console.error('Erro ao avaliar prazo da disciplina:', error)
        }
      }

      mutate('disciplines')
      mutate('stats')
    })()

    return () => {
      cancelled = true
    }
  }, [disciplines, stats])

  const handleCreateHabit = async (habit: Partial<Habit>) => {
    try {
      await createHabit(habit)
      if (getBackendStatus().mode === 'supabase') {
        await updateStats({ total_habits: (stats?.total_habits || 0) + 1 })
      }
      toast({ title: 'Habito criado!' })
      mutate('habits')
      mutate('stats')
    } catch (error) {
      console.error('Erro ao criar hábito:', error)
      toast({
        title: 'Erro ao criar habito',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateHabit = async (habit: Partial<Habit>) => {
    if (!habit.id) return
    try {
      await updateHabit(habit)
      toast({ title: 'Habito atualizado!' })
      mutate('habits')
    } catch {
      toast({ title: 'Erro ao atualizar habito', variant: 'destructive' })
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId)
      if (getBackendStatus().mode === 'supabase') {
        await updateStats({
          total_habits: Math.max((stats?.total_habits || 1) - 1, 0),
        })
      }
      toast({ title: 'Habito excluido' })
      mutate('habits')
      mutate('stats')
    } catch {
      toast({ title: 'Erro ao excluir habito', variant: 'destructive' })
    }
  }

  const handleToggleHabit = async (habitId: string, dateStr: string, shouldComplete: boolean) => {
    try {
      if (shouldComplete) {
        const existingCompletions = completions.filter(c => {
          const completionDate = c.completed_at.split('T')[0]
          return c.habit_id === habitId && completionDate === dateStr
        })
        
        if (existingCompletions.length > 0) {
          mutate(completionKey)
          return
        }
        
        const [year, month, day] = dateStr.split('-').map(Number)
        const completionDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
        await insertCompletion(habitId, completionDate.toISOString())
        
        const newStreak = (stats?.current_streak || 0) + 1
        await updateStats({
          total_points: (stats?.total_points || 0) + 10,
          total_completions: (stats?.total_completions || 0) + 1,
          current_streak: newStreak,
          longest_streak: Math.max((stats?.longest_streak || 0), newStreak),
        })
        
        toast({ title: '+10 pontos!' })
      } else {
        const dayCompletions = completions.filter(c => {
          const completionDate = c.completed_at.split('T')[0]
          return c.habit_id === habitId && completionDate === dateStr
        })
        
        if (dayCompletions.length > 0) {
          await deleteCompletions(dayCompletions.map(c => c.id))
          
          const pointsToRemove = dayCompletions.length * 10
          const completionsToRemove = dayCompletions.length
          
          await updateStats({
            total_points: Math.max((stats?.total_points || 0) - pointsToRemove, 0),
            total_completions: Math.max((stats?.total_completions || 0) - completionsToRemove, 0),
            current_streak: Math.max((stats?.current_streak || 0) - 1, 0),
          })
        }
      }
      
      await Promise.all([
        mutate(completionKey),
        mutate('stats')
      ])
    } catch (error) {
      console.error('Erro inesperado ao alternar hábito:', error)
      toast({ title: 'Erro inesperado', variant: 'destructive' })
    }
  }

  const handleCreateReward = async (reward: Partial<Reward>) => {
    try {
      await createReward(reward)
      toast({ title: 'Recompensa criada!' })
      mutate('rewards')
    } catch (error) {
      console.error('Erro ao criar recompensa:', error)
      toast({
        title: 'Erro ao criar recompensa',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateReward = async (rewardId: string, reward: Partial<Reward>) => {
    try {
      await updateReward(rewardId, reward)
      toast({ title: 'Recompensa atualizada!' })
      mutate('rewards')
    } catch {
      toast({ title: 'Erro ao atualizar recompensa', variant: 'destructive' })
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    try {
      await deleteReward(rewardId)
      toast({ title: 'Recompensa excluída!' })
      mutate('rewards')
    } catch {
      toast({ title: 'Erro ao excluir recompensa', variant: 'destructive' })
    }
  }

  const handleClaimReward = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId)
    if (!reward || !stats) return
    
    if (stats.total_points < reward.points_required) {
      toast({ title: 'Pontos insuficientes', variant: 'destructive' })
      return
    }
    
    try {
      await claimReward(rewardId)
      await updateStats({
        total_points: stats.total_points - reward.points_required,
      })
      toast({ title: `Recompensa resgatada: ${reward.name}!` })
      mutate('rewards')
      mutate('stats')
    } catch {
      toast({ title: 'Erro ao resgatar recompensa', variant: 'destructive' })
    }
  }

  const handleCreateDiscipline = async (discipline: Partial<Discipline>) => {
    try {
      await createDiscipline(discipline)
      toast({ title: 'Disciplina criada!' })
      mutate('disciplines')
    } catch (error) {
      console.error('Erro ao criar disciplina:', error)
      toast({
        title: 'Erro ao criar disciplina',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateDiscipline = async (disciplineId: string, discipline: Partial<Discipline>) => {
    try {
      await updateDiscipline(disciplineId, discipline)
      toast({ title: 'Disciplina atualizada!' })
      mutate('disciplines')
    } catch {
      toast({ title: 'Erro ao atualizar disciplina', variant: 'destructive' })
    }
  }

  const handleDeleteDiscipline = async (disciplineId: string) => {
    try {
      await deleteDiscipline(disciplineId)
      toast({ title: 'Disciplina excluída!' })
      mutate('disciplines')
    } catch {
      toast({ title: 'Erro ao excluir disciplina', variant: 'destructive' })
    }
  }

  const handleTriggerDiscipline = async (disciplineId: string) => {
    const discipline = disciplines.find(d => d.id === disciplineId)
    if (!discipline || !stats) return
    
    try {
      await triggerDiscipline(disciplineId)
      
      if (discipline.penalty_type === 'points') {
        await updateStats({
          total_points: Math.max(stats.total_points - discipline.penalty_value, 0),
        })
      } else if (discipline.penalty_type === 'streak_reset') {
        await updateStats({ current_streak: 0 })
      }
      
      toast({ title: `Disciplina aplicada: ${discipline.name}`, variant: 'destructive' })
      mutate('disciplines')
      mutate('stats')
    } catch {
      toast({ title: 'Erro ao aplicar disciplina', variant: 'destructive' })
    }
  }

  const handleResetPoints = async () => {
    if (!confirm('Zerar a pontuação e a sequência atuais? Hábitos e histórico continuam.')) {
      return
    }
    try {
      await resetPoints()
      toast({ title: 'Pontuação zerada!' })
      mutate('stats')
    } catch {
      toast({ title: 'Erro ao zerar pontuação', variant: 'destructive' })
    }
  }

  const handleCreateReminder = async (reminder: Partial<Reminder>) => {
    try {
      await createReminder(reminder)
      toast({ title: 'Lembrete criado!' })
      mutate('reminders')
    } catch (error) {
      toast({
        title: 'Erro ao criar lembrete',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const handleCompleteReminder = async (id: string) => {
    try {
      await completeReminder(id)
      toast({ title: 'Lembrete concluído!' })
      mutate('reminders')
    } catch {
      toast({ title: 'Erro ao concluir lembrete', variant: 'destructive' })
    }
  }

  const handleUncompleteReminder = async (id: string) => {
    try {
      await uncompleteReminder(id)
      mutate('reminders')
    } catch {
      toast({ title: 'Erro ao reabrir lembrete', variant: 'destructive' })
    }
  }

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteReminder(id)
      toast({ title: 'Lembrete apagado' })
      mutate('reminders')
    } catch {
      toast({ title: 'Erro ao apagar lembrete', variant: 'destructive' })
    }
  }

  // Calculate monthly progress for the selected month
  const monthlyProgress = (() => {
    if (habits.length === 0) return 0
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const today = new Date()
    const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth()
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth
    const totalPossible = habits.length * currentDay
    const completed = completions.length
    return totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0
  })()

  // Render Mobile Version
  if (isMobile === undefined) {
    return <div className="min-h-screen bg-background" />
  }

  if (isMobile) {
    return (
      <div className="min-h-screen">
        <StorageBanner status={backendStatus} />
        <DateAlerts disciplines={disciplines} reminders={reminders} />
        <MobilePage
          habits={habits}
          completions={completions}
          stats={stats || null}
          rewards={rewards}
          disciplines={disciplines}
          reminders={reminders}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onToggleHabit={handleToggleHabit}
          onCreateHabit={handleCreateHabit}
          onUpdateHabit={handleUpdateHabit}
          onDeleteHabit={handleDeleteHabit}
          onMonthChange={(year, month) => {
            setSelectedYear(year)
            setSelectedMonth(month)
            mutate(`completions-${year}-${month}`)
          }}
          onCreateReward={handleCreateReward}
          onUpdateReward={handleUpdateReward}
          onDeleteReward={handleDeleteReward}
          onClaimReward={handleClaimReward}
          onCreateDiscipline={handleCreateDiscipline}
          onUpdateDiscipline={handleUpdateDiscipline}
          onDeleteDiscipline={handleDeleteDiscipline}
          onTriggerDiscipline={handleTriggerDiscipline}
          onResetPoints={handleResetPoints}
          onCreateReminder={handleCreateReminder}
          onCompleteReminder={handleCompleteReminder}
          onUncompleteReminder={handleUncompleteReminder}
          onDeleteReminder={handleDeleteReminder}
        />
      </div>
    )
  }

  // Render Desktop Version
  return (
    <div className="w-full overflow-x-hidden">
    <div className="min-h-screen bg-background flex flex-col">
      <StorageBanner status={backendStatus} />
      <DateAlerts disciplines={disciplines} reminders={reminders} />
      <header className="sticky top-0 z-40 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
        <div className="mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-5">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Logo size={44} className="drop-shadow-lg" />
            <div className="text-left">
              <p className="text-base sm:text-lg font-bold tracking-wide">MyTaskFlow</p>
              <p className="text-xs sm:text-sm opacity-90">
                Organize seus hábitos e conquiste seus objetivos
              </p>
            </div>
          </div>

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
      
      <main className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 flex-1">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-[2fr,1.1fr] items-start">
            <HabitGrid
              habits={habits}
              completions={completions}
              onToggleHabit={handleToggleHabit}
              onCreateHabit={handleCreateHabit}
              onUpdateHabit={handleUpdateHabit}
              onDeleteHabit={handleDeleteHabit}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onMonthChange={(year, month) => {
                setSelectedYear(year)
                setSelectedMonth(month)
                mutate(`completions-${year}-${month}`)
              }}
            />

            <HabitAnalysisTable habits={habits} completions={completions} />
          </div>

          <ProgressLineChart habits={habits} completions={completions} />

          <RemindersPanel
            reminders={reminders}
            onCreateReminder={handleCreateReminder}
            onCompleteReminder={handleCompleteReminder}
            onUncompleteReminder={handleUncompleteReminder}
            onDeleteReminder={handleDeleteReminder}
          />
          
          <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
            <RewardsPanel
              rewards={rewards}
              stats={stats || null}
              onCreateReward={handleCreateReward}
              onUpdateReward={handleUpdateReward}
              onDeleteReward={handleDeleteReward}
              onClaimReward={handleClaimReward}
            />
            
            <DisciplinePanel
              disciplines={disciplines}
              stats={stats || null}
              onCreateDiscipline={handleCreateDiscipline}
              onUpdateDiscipline={handleUpdateDiscipline}
              onDeleteDiscipline={handleDeleteDiscipline}
              onTriggerDiscipline={handleTriggerDiscipline}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Conta e pontuação</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Opções no final da análise do sistema.
              </p>
            </div>
            <UserMenu fullWidth />
            <Button
              variant="outline"
              className="w-full h-10 gap-2"
              onClick={handleResetPoints}
            >
              <RotateCcw className="h-4 w-4" />
              Zerar pontuação
            </Button>
          </div>
        </div>
      </main>
    </div>
    </div>
  )
}
