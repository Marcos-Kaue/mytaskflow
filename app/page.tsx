'use client'

import { useEffect, useCallback, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { toast } from '@/hooks/use-toast'
import { HabitGrid } from '@/components/habit-grid'
import { HabitAnalysisTable } from '@/components/habit-analysis-table'
import { ProgressLineChart } from '@/components/progress-line-chart'
import { RewardsPanel } from '@/components/rewards-panel'
import { DisciplinePanel } from '@/components/discipline-panel'
import { createBrowserClient } from '@/lib/supabase/client'
import { Habit, HabitCompletion, UserStats, Reward, Discipline } from '@/lib/types'
import { Trophy, Flame, Target, Zap } from 'lucide-react'

const USER_ID = 'demo-user-001'

const fetcher = async (key: string) => {
  const supabase = createBrowserClient()
  
  if (key === 'habits') {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  }
  
  if (key.startsWith('completions-')) {
    // Extrair year e month da chave (formato: completions-2024-0)
    const parts = key.split('-')
    const year = parseInt(parts[1])
    const month = parseInt(parts[2])
    
    const startOfMonth = new Date(year, month, 1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)
    
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', USER_ID)
      .gte('completed_at', startOfMonth.toISOString())
      .lte('completed_at', endOfMonth.toISOString())
      .order('completed_at', { ascending: false })
    if (error) throw error
    return data || []
  }
  
  if (key === 'stats') {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', USER_ID)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  }
  
  if (key === 'rewards') {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }
  
  if (key === 'disciplines') {
    const { data, error } = await supabase
      .from('disciplines')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }
  
  return null
}

export default function HomePage() {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  
  const completionKey = `completions-${selectedYear}-${selectedMonth}`
  
  const { data: habits = [] } = useSWR<Habit[]>('habits', fetcher)
  const { data: completions = [] } = useSWR<HabitCompletion[]>(completionKey, () => fetcher(completionKey))
  const { data: stats } = useSWR<UserStats | null>('stats', fetcher)
  const { data: rewards = [] } = useSWR<Reward[]>('rewards', fetcher)
  const { data: disciplines = [] } = useSWR<Discipline[]>('disciplines', fetcher)

  const initUserStats = useCallback(async () => {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', USER_ID)
      .single()
    
    if (!data) {
      await supabase.from('user_stats').insert({
        user_id: USER_ID,
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        total_habits: 0,
      })
      mutate('stats')
    }
  }, [])

  useEffect(() => {
    initUserStats()
  }, [initUserStats])

  const handleCreateHabit = async (habit: Partial<Habit>) => {
    const supabase = createBrowserClient()
    const { error } = await supabase.from('habits').insert({
      ...habit,
      user_id: USER_ID,
    })
    
    if (error) {
      toast({ title: 'Erro ao criar habito', variant: 'destructive' })
      return
    }
    
    const { error: statsError } = await supabase.from('user_stats').update({
      total_habits: (stats?.total_habits || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('user_id', USER_ID)
    
    if (statsError) {
      console.error('Erro ao atualizar stats:', statsError)
    }
    
    toast({ title: 'Habito criado!' })
    mutate('habits')
    mutate('stats')
  }

  const handleUpdateHabit = async (habit: Partial<Habit>) => {
    if (!habit.id) return
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('habits')
      .update({
        name: habit.name,
      })
      .eq('id', habit.id)
    
    if (error) {
      toast({ title: 'Erro ao atualizar habito', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Habito atualizado!' })
    mutate('habits')
  }

  const handleDeleteHabit = async (habitId: string) => {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId)
    
    if (error) {
      toast({ title: 'Erro ao excluir habito', variant: 'destructive' })
      return
    }
    
    const { error: statsError } = await supabase.from('user_stats').update({
      total_habits: Math.max((stats?.total_habits || 1) - 1, 0),
      updated_at: new Date().toISOString(),
    }).eq('user_id', USER_ID)
    
    if (statsError) {
      console.error('Erro ao atualizar stats:', statsError)
    }
    
    toast({ title: 'Habito excluido' })
    mutate('habits')
    mutate('stats')
  }

  const handleToggleHabit = async (habitId: string, dateStr: string, shouldComplete: boolean) => {
    try {
      const supabase = createBrowserClient()
      
      if (shouldComplete) {
        // Verificar se já existe uma completion para evitar duplicatas
        // Comparar datas normalizadas (apenas YYYY-MM-DD)
        const existingCompletions = completions.filter(c => {
          const completionDate = c.completed_at.split('T')[0]
          return c.habit_id === habitId && completionDate === dateStr
        })
        
        if (existingCompletions.length > 0) {
          // Já está marcado, apenas atualizar a UI
          console.log('Já existe completion, atualizando UI')
          mutate('completions')
          return
        }
        
        // Criar data local a partir da string YYYY-MM-DD
        // Usar UTC para evitar problemas de timezone, mas manter o dia correto
        const [year, month, day] = dateStr.split('-').map(Number)
        // Criar como UTC para garantir que o dia não mude
        const completionDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
        const isoString = completionDate.toISOString()
        
        const { data, error } = await supabase.from('habit_completions').insert({
          habit_id: habitId,
          user_id: USER_ID,
          completed_at: isoString,
        }).select()
        
        if (error) {
          // Se for erro de duplicata, ignorar silenciosamente e atualizar
          if (error.code === '23505' || error.message.includes('duplicate')) {
            console.log('Duplicata detectada, atualizando UI')
            mutate('completions')
            return
          }
          console.error('Erro ao inserir completion:', error)
          toast({ title: 'Erro ao completar habito', variant: 'destructive' })
          return
        }
        
        // Atualizar stats apenas se a inserção foi bem-sucedida
        const newPoints = (stats?.total_points || 0) + 10
        const newCompletions = (stats?.total_completions || 0) + 1
        
        const { error: statsError } = await supabase.from('user_stats').update({
          total_points: newPoints,
          total_completions: newCompletions,
          current_streak: (stats?.current_streak || 0) + 1,
          longest_streak: Math.max((stats?.longest_streak || 0), (stats?.current_streak || 0) + 1),
          updated_at: new Date().toISOString(),
        }).eq('user_id', USER_ID)
        
        if (statsError) {
          console.error('Erro ao atualizar stats:', statsError)
        }
        
        toast({ title: '+10 pontos!' })
      } else {
        // Comparar datas normalizadas (apenas YYYY-MM-DD)
        const dayCompletions = completions.filter(c => {
          const completionDate = c.completed_at.split('T')[0]
          return c.habit_id === habitId && completionDate === dateStr
        })
        
        if (dayCompletions.length > 0) {
          // Deletar todas as duplicatas se houver
          for (const completion of dayCompletions) {
            const { error } = await supabase
              .from('habit_completions')
              .delete()
              .eq('id', completion.id)
            
            if (error) {
              console.error('Erro ao deletar completion:', error)
              toast({ title: 'Erro ao desfazer', variant: 'destructive' })
              return
            }
          }
          
          // Atualizar stats apenas uma vez, considerando quantas foram deletadas
          const pointsToRemove = dayCompletions.length * 10
          const completionsToRemove = dayCompletions.length
          
          const { error: statsError } = await supabase.from('user_stats').update({
            total_points: Math.max((stats?.total_points || 0) - pointsToRemove, 0),
            total_completions: Math.max((stats?.total_completions || 0) - completionsToRemove, 0),
            updated_at: new Date().toISOString(),
          }).eq('user_id', USER_ID)
          
          if (statsError) {
            console.error('Erro ao atualizar stats:', statsError)
          }
        }
      }
      
      // Sempre atualizar os dados após a operação
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
    const supabase = createBrowserClient()
    const { error } = await supabase.from('rewards').insert({
      ...reward,
      user_id: USER_ID,
    })
    
    if (error) {
      toast({ title: 'Erro ao criar recompensa', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Recompensa criada!' })
    mutate('rewards')
  }

  const handleUpdateReward = async (rewardId: string, reward: Partial<Reward>) => {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('rewards')
      .update({
        name: reward.name,
        description: reward.description,
        icon: reward.icon,
        points_required: reward.points_required,
      })
      .eq('id', rewardId)
    
    if (error) {
      toast({ title: 'Erro ao atualizar recompensa', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Recompensa atualizada!' })
    mutate('rewards')
  }

  const handleDeleteReward = async (rewardId: string) => {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId)
    
    if (error) {
      toast({ title: 'Erro ao excluir recompensa', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Recompensa excluída!' })
    mutate('rewards')
  }

  const handleClaimReward = async (rewardId: string) => {
    const supabase = createBrowserClient()
    const reward = rewards.find(r => r.id === rewardId)
    if (!reward || !stats) return
    
    if (stats.total_points < reward.points_required) {
      toast({ title: 'Pontos insuficientes', variant: 'destructive' })
      return
    }
    
    const { error: rewardError } = await supabase
      .from('rewards')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', rewardId)
    
    if (rewardError) {
      toast({ title: 'Erro ao resgatar recompensa', variant: 'destructive' })
      return
    }
    
    const { error: statsError } = await supabase.from('user_stats').update({
      total_points: stats.total_points - reward.points_required,
      updated_at: new Date().toISOString(),
    }).eq('user_id', USER_ID)
    
    if (statsError) {
      console.error('Erro ao atualizar stats:', statsError)
    }
    
    toast({ title: `Recompensa resgatada: ${reward.name}!` })
    mutate('rewards')
    mutate('stats')
  }

  const handleCreateDiscipline = async (discipline: Partial<Discipline>) => {
    const supabase = createBrowserClient()
    const { error } = await supabase.from('disciplines').insert({
      ...discipline,
      user_id: USER_ID,
    })
    
    if (error) {
      toast({ title: 'Erro ao criar disciplina', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Disciplina criada!' })
    mutate('disciplines')
  }

  const handleUpdateDiscipline = async (disciplineId: string, discipline: Partial<Discipline>) => {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('disciplines')
      .update({
        name: discipline.name,
        description: discipline.description,
        penalty_type: discipline.penalty_type,
        penalty_value: discipline.penalty_value,
      })
      .eq('id', disciplineId)
    
    if (error) {
      toast({ title: 'Erro ao atualizar disciplina', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Disciplina atualizada!' })
    mutate('disciplines')
  }

  const handleDeleteDiscipline = async (disciplineId: string) => {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('disciplines')
      .delete()
      .eq('id', disciplineId)
    
    if (error) {
      toast({ title: 'Erro ao excluir disciplina', variant: 'destructive' })
      return
    }
    
    toast({ title: 'Disciplina excluída!' })
    mutate('disciplines')
  }

  const handleTriggerDiscipline = async (disciplineId: string) => {
    const supabase = createBrowserClient()
    const discipline = disciplines.find(d => d.id === disciplineId)
    if (!discipline || !stats) return
    
    const { error: discError } = await supabase
      .from('disciplines')
      .update({
        triggered_at: new Date().toISOString(),
      })
      .eq('id', disciplineId)
    
    if (discError) {
      toast({ title: 'Erro ao aplicar disciplina', variant: 'destructive' })
      return
    }
    
    if (discipline.penalty_type === 'points') {
      await supabase.from('user_stats').update({
        total_points: Math.max(stats.total_points - discipline.penalty_value, 0),
        updated_at: new Date().toISOString(),
      }).eq('user_id', USER_ID)
    } else if (discipline.penalty_type === 'streak_reset') {
      await supabase.from('user_stats').update({
        current_streak: 0,
        updated_at: new Date().toISOString(),
      }).eq('user_id', USER_ID)
    }
    
    toast({ title: `Disciplina aplicada: ${discipline.name}`, variant: 'destructive' })
    mutate('disciplines')
    mutate('stats')
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Banner */}
      <header className="bg-foreground text-background py-6 sm:py-8 px-4 w-full">
        <div className="mx-auto max-w-5xl text-center px-3 sm:px-4">
          <p className="text-xs sm:text-sm opacity-80 mb-2">MyTaskFlow</p>
          <h1 className="text-lg sm:text-xl font-medium text-balance">
            Organize seus hábitos e conquiste seus objetivos
          </h1>
        </div>
      </header>
      
      {/* Stats Bar */}
      <div className="border-b border-border bg-card w-full">
        <div className="mx-auto max-w-5xl px-3 py-2 sm:px-4 sm:py-3">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-accent flex-shrink-0" />
              <span className="font-medium">{stats?.total_points || 0}</span>
              <span className="text-muted-foreground hidden sm:inline">pontos</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-accent flex-shrink-0" />
              <span className="font-medium">{stats?.current_streak || 0}</span>
              <span className="text-muted-foreground hidden sm:inline">sequencia</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-accent flex-shrink-0" />
              <span className="font-medium">{stats?.longest_streak || 0}</span>
              <span className="text-muted-foreground hidden sm:inline">recorde</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-accent flex-shrink-0" />
              <span className="font-medium">{monthlyProgress}%</span>
              <span className="text-muted-foreground hidden sm:inline">mes</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6 flex-1">
        <div className="space-y-4 sm:space-y-6">
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
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
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
  )
}
