'use client'

import React from "react"

import { useState } from 'react'
import { Gift, Plus, Check, Sparkles, Lock, Edit2, Trash2, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Reward, UserStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RewardsPanelProps {
  rewards: Reward[]
  stats: UserStats | null
  onCreateReward: (reward: Partial<Reward>) => Promise<void> | void
  onUpdateReward: (rewardId: string, reward: Partial<Reward>) => Promise<void> | void
  onDeleteReward: (rewardId: string) => Promise<void> | void
  onClaimReward: (rewardId: string) => Promise<void> | void
}

const rewardIcons = [
  { value: 'movie', emoji: '🎬', label: 'Filme' },
  { value: 'food', emoji: '🍕', label: 'Comida' },
  { value: 'game', emoji: '🎮', label: 'Jogo' },
  { value: 'shopping', emoji: '🛍️', label: 'Compras' },
  { value: 'trip', emoji: '✈️', label: 'Viagem' },
  { value: 'relax', emoji: '🛋️', label: 'Descanso' },
]

export function RewardsPanel({ rewards, stats, onCreateReward, onUpdateReward, onDeleteReward, onClaimReward }: RewardsPanelProps) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('movie')
  const [pointsRequired, setPointsRequired] = useState(100)
  const [isExpanded, setIsExpanded] = useState(false)

  const currentPoints = stats?.total_points || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || loading) return
    
    setLoading(true)
    try {
      if (editingReward) {
        await onUpdateReward(editingReward.id, {
          name: name.trim(),
          description: description.trim() || null,
          icon,
          points_required: pointsRequired,
        })
        setEditingReward(null)
      } else {
        await onCreateReward({
          name: name.trim(),
          description: description.trim() || null,
          icon,
          points_required: pointsRequired,
        })
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setName('')
      setDescription('')
      setIcon('movie')
      setPointsRequired(100)
      setOpen(false)
      setEditOpen(false)
    } catch (error) {
      console.error('Erro ao criar recompensa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward)
    setName(reward.name)
    setDescription(reward.description || '')
    setIcon(reward.icon)
    setPointsRequired(reward.points_required)
    setEditOpen(true)
  }

  const handleDelete = (rewardId: string) => {
    if (confirm('Tem certeza que deseja excluir esta recompensa?')) {
      onDeleteReward(rewardId)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setIcon('movie')
    setPointsRequired(100)
    setEditingReward(null)
  }

  const getIconEmoji = (iconValue: string) => {
    return rewardIcons.find(i => i.value === iconValue)?.emoji || '🎁'
  }

  const unclaimedRewards = rewards.filter(r => !r.is_claimed)
  const claimedRewards = rewards.filter(r => r.is_claimed)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-3 sm:p-6" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <ChevronDown className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
            <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="whitespace-nowrap">Recompensas</span>
          </CardTitle>
        </div>
        {!isExpanded && (
          <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary flex-shrink-0">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            {stats?.total_points || 0} pts
          </div>
        )}
        {isExpanded && (
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 bg-transparent text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-4 flex-shrink-0">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Nova</span>
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Recompensa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward-name">Nome</Label>
                <Input
                  id="reward-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Assistir um filme"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reward-desc">Descricao (opcional)</Label>
                <Input
                  id="reward-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes da recompensa"
                />
              </div>

              <div className="space-y-2">
                <Label>Icone</Label>
                <div className="flex flex-wrap gap-2">
                  {rewardIcons.map((i) => (
                    <button
                      key={i.value}
                      type="button"
                      onClick={() => setIcon(i.value)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all",
                        icon === i.value 
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
                <Label htmlFor="points">Pontos Necessarios</Label>
                <Input
                  id="points"
                  type="number"
                  min={10}
                  step={10}
                  value={pointsRequired}
                  onChange={(e) => setPointsRequired(Number(e.target.value))}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingReward ? 'Atualizar Recompensa' : 'Criar Recompensa'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>            )}
        {/* Edit Dialog */}
        {isExpanded && (
          <Dialog open={editOpen} onOpenChange={(isOpen) => {
            setEditOpen(isOpen)
            if (!isOpen) resetForm()
          }}>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Recompensa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reward-name">Nome</Label>
                <Input
                  id="edit-reward-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Assistir um filme"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-reward-desc">Descricao (opcional)</Label>
                <Input
                  id="edit-reward-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes da recompensa"
                />
              </div>

              <div className="space-y-2">
                <Label>Icone</Label>
                <div className="flex flex-wrap gap-2">
                  {rewardIcons.map((i) => (
                    <button
                      key={i.value}
                      type="button"
                      onClick={() => setIcon(i.value)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all",
                        icon === i.value 
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
                <Label htmlFor="edit-points">Pontos Necessarios</Label>
                <Input
                  id="edit-points"
                  type="number"
                  min={10}
                  step={10}
                  value={pointsRequired}
                  onChange={(e) => setPointsRequired(Number(e.target.value))}
                />
              </div>

              <Button type="submit" className="w-full">
                Atualizar Recompensa
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <div className="rounded-lg bg-primary/10 p-2.5 sm:p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Seus pontos</span>
            <span className="flex items-center gap-1 text-base sm:text-lg font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {currentPoints}
            </span>
          </div>
        </div>

        {unclaimedRewards.length === 0 && claimedRewards.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Crie recompensas para se motivar!
          </p>
        ) : (
          <div className="space-y-3">
            {unclaimedRewards.map((reward) => {
              const progress = Math.min((currentPoints / reward.points_required) * 100, 100)
              const canClaim = currentPoints >= reward.points_required

              return (
                <div 
                  key={reward.id}
                  className={cn(
                    "rounded-lg border p-2.5 sm:p-3 transition-all",
                    canClaim && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">{getIconEmoji(reward.icon)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{reward.name}</h4>
                          {reward.description && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{reward.description}</p>
                          )}
                        </div>
                        <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(reward)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(reward.id)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1.5 sm:mt-2 space-y-1">
                        <Progress value={progress} className="h-1.5 sm:h-2" />
                        <div className="flex items-center justify-between text-[10px] sm:text-xs">
                          <span className="text-muted-foreground">
                            {currentPoints}/{reward.points_required} pts
                          </span>
                          {canClaim ? (
                            <Button 
                              size="sm" 
                              className="h-5 sm:h-6 gap-1 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                              onClick={() => onClaimReward(reward.id)}
                            >
                              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              Resgatar
                            </Button>
                          ) : (
                            <span className="flex items-center gap-0.5 sm:gap-1 text-muted-foreground">
                              <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span className="hidden sm:inline">Bloqueado</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {claimedRewards.length > 0 && (
              <div className="border-t pt-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Resgatadas</p>
                <div className="space-y-2">
                  {claimedRewards.slice(0, 3).map((reward) => (
                    <div 
                      key={reward.id}
                      className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2 opacity-60"
                    >
                      <span className="text-lg">{getIconEmoji(reward.icon)}</span>
                      <span className="text-sm line-through">{reward.name}</span>
                      <Check className="ml-auto h-4 w-4 text-primary" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      )}
    </Card>
  )
}
