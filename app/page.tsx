'use client'

import { useEffect, useCallback, useState } from 'react'
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
import { Habit, HabitCompletion, UserStats, Reward, Discipline } from '@/lib/types'
import { Flame, Target, Zap } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  claimReward,
  createDiscipline,
  createHabit,
  createReward,
  deleteCompletions,
  deleteDiscipline,
  deleteHabit,
  deleteReward,
  ensureUserStats,
  fetchCompletions,
  fetchDisciplines,
  fetchHabits,
  fetchRewards,
  fetchStats,
  getBackendStatus,
  insertCompletion,
  triggerDiscipline,
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
  const { data: completions = [] } = useSWR<HabitCompletion[]>(completionKey, () =>
    fetchCompletions(selectedYear, selectedMonth),
  )
  const { data: stats } = useSWR<UserStats | null>('stats', fetchStats)
  const { data: rewards = [] } = useSWR<Reward[]>('rewards', fetchRewards)
  const { data: disciplines = [] } = useSWR<Discipline[]>('disciplines', fetchDisciplines)

  const backendStatus = getBackendStatus()

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
  if (isMobile) {
    return (
      <div className="min-h-screen">
        <StorageBanner status={backendStatus} />
        <MobilePage
          habits={habits}
          completions={completions}
          stats={stats || null}
          rewards={rewards}
          disciplines={disciplines}
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
        />
      </div>
    )
  }

  // Render Desktop Version
  return (
    <div className="w-full overflow-x-hidden">
    <div className="min-h-screen bg-background flex flex-col">
      <StorageBanner status={backendStatus} />
      {/* Header Banner com Gradiente Roxo + Laranja */}
      <header className="relative bg-gradient-to-r from-primary via-purple-700 to-accent text-primary-foreground py-4 sm:py-6 md:py-8 w-full overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="mx-auto max-w-5xl text-center px-3 sm:px-4 relative z-10">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <Logo size={40} className="sm:w-12 sm:h-12 drop-shadow-lg" />
          </div>
          <p className="text-xs sm:text-sm md:text-base font-semibold mb-1 tracking-wide drop-shadow">MyTaskFlow</p>
          <h1 className="text-sm sm:text-base md:text-lg font-normal text-balance px-2 opacity-95 drop-shadow">
            Organize seus hábitos e conquiste seus objetivos
          </h1>
        </div>
      </header>
      
      {/* Stats Bar com Gradiente */}
      <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-accent/5 w-full">
        <div className="mx-auto max-w-5xl px-3 py-2 sm:px-4 sm:py-3 w-full">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:flex md:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-lg bg-accent/10">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-accent flex-shrink-0" />
              <span className="font-medium text-accent">{stats?.total_points || 0}</span>
              <span className="text-muted-foreground hidden md:inline">pontos</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-lg bg-orange-500/10">
              <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
              <span className="font-medium text-orange-500">{stats?.current_streak || 0}</span>
              <span className="text-muted-foreground hidden md:inline">sequencia</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-lg bg-primary/10">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-primary">{monthlyProgress}%</span>
              <span className="text-muted-foreground hidden md:inline">mes</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="mx-auto w-full max-w-5xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 flex-1">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Habit Grid + Side Analysis */}
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
                // Atualizar dados do novo mês
                mutate(`completions-${year}-${month}`)
              }}
            />

            <HabitAnalysisTable habits={habits} completions={completions} />
          </div>

          {/* Progress Chart */}
          <ProgressLineChart habits={habits} completions={completions} />
          
          {/* Rewards and Discipline */}
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
              onCreateDiscipline={handleCreateDiscipline}
              onUpdateDiscipline={handleUpdateDiscipline}
              onDeleteDiscipline={handleDeleteDiscipline}
              onTriggerDiscipline={handleTriggerDiscipline}
            />
          </div>
        </div>
      </main>
    </div>
    </div>
  )
}
