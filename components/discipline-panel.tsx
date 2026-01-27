'use client'

import React from "react"

import { useState } from 'react'
import { AlertTriangle, Plus, Zap, Clock, Edit2, Trash2, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Discipline } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DisciplinePanelProps {
  disciplines: Discipline[]
  onCreateDiscipline: (discipline: Partial<Discipline>) => Promise<void> | void
  onUpdateDiscipline: (disciplineId: string, discipline: Partial<Discipline>) => Promise<void> | void
  onDeleteDiscipline: (disciplineId: string) => Promise<void> | void
  onTriggerDiscipline: (disciplineId: string) => Promise<void> | void
}

export function DisciplinePanel({ disciplines, onCreateDiscipline, onUpdateDiscipline, onDeleteDiscipline, onTriggerDiscipline }: DisciplinePanelProps) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [penaltyType, setPenaltyType] = useState<'points' | 'streak_reset' | 'custom'>('points')
  const [penaltyValue, setPenaltyValue] = useState(50)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || loading) return
    
    setLoading(true)
    try {
      if (editingDiscipline) {
        await onUpdateDiscipline(editingDiscipline.id, {
          name: name.trim(),
          description: description.trim() || null,
          penalty_type: penaltyType,
          penalty_value: penaltyValue,
        })
        setEditingDiscipline(null)
      } else {
        await onCreateDiscipline({
          name: name.trim(),
          description: description.trim() || null,
          penalty_type: penaltyType,
          penalty_value: penaltyValue,
        })
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setName('')
      setDescription('')
      setPenaltyType('points')
      setPenaltyValue(50)
      setOpen(false)
      setEditOpen(false)
    } catch (error) {
      console.error('Erro ao criar disciplina:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (discipline: Discipline) => {
    setEditingDiscipline(discipline)
    setName(discipline.name)
    setDescription(discipline.description || '')
    setPenaltyType(discipline.penalty_type)
    setPenaltyValue(discipline.penalty_value)
    setEditOpen(true)
  }

  const handleDelete = (disciplineId: string) => {
    if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
      onDeleteDiscipline(disciplineId)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setPenaltyType('points')
    setPenaltyValue(50)
    setEditingDiscipline(null)
  }

  const getPenaltyLabel = (type: string, value: number) => {
    switch (type) {
      case 'points':
        return `-${value} pontos`
      case 'streak_reset':
        return 'Zera sequencia'
      case 'custom':
        return `Penalidade: ${value}`
      default:
        return ''
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const activeDisciplines = disciplines.filter(d => !d.triggered_at || d.triggered_at === d.created_at)
  const triggeredDisciplines = disciplines.filter(d => d.triggered_at && d.triggered_at !== d.created_at)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-3 sm:p-6" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <ChevronDown className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
            <span className="whitespace-nowrap">Disciplinas</span>
          </CardTitle>
        </div>
        {!isExpanded && (
          <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-destructive flex-shrink-0">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            {disciplines.filter(d => !d.triggered_at || d.triggered_at === d.created_at).length} ativas
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
              <DialogTitle>Criar Disciplina</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disc-name">Nome da Disciplina</Label>
                <Input
                  id="disc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nao cumpri meta de agua"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="disc-desc">Descricao (opcional)</Label>
                <Input
                  id="disc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Quando aplicar esta penalidade"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Penalidade</Label>
                  <Select value={penaltyType} onValueChange={(v) => setPenaltyType(v as typeof penaltyType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Perder Pontos</SelectItem>
                      <SelectItem value="streak_reset">Zerar Sequencia</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {penaltyType !== 'streak_reset' && (
                  <div className="space-y-2">
                    <Label htmlFor="penalty-value">Valor</Label>
                    <Input
                      id="penalty-value"
                      type="number"
                      min={1}
                      value={penaltyValue}
                      onChange={(e) => setPenaltyValue(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">
                {editingDiscipline ? 'Atualizar Disciplina' : 'Criar Disciplina'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
            )}

        {/* Edit Dialog */}
        {isExpanded && (
          <Dialog open={editOpen} onOpenChange={(isOpen) => {
            setEditOpen(isOpen)
            if (!isOpen) resetForm()
          }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Disciplina</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-disc-name">Nome da Disciplina</Label>
                <Input
                  id="edit-disc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nao cumpri meta de agua"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-disc-desc">Descricao (opcional)</Label>
                <Input
                  id="edit-disc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Quando aplicar esta penalidade"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Penalidade</Label>
                  <Select value={penaltyType} onValueChange={(v) => setPenaltyType(v as typeof penaltyType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Perder Pontos</SelectItem>
                      <SelectItem value="streak_reset">Zerar Sequencia</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {penaltyType !== 'streak_reset' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-penalty-value">Valor</Label>
                    <Input
                      id="edit-penalty-value"
                      type="number"
                      min={1}
                      value={penaltyValue}
                      onChange={(e) => setPenaltyValue(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">
                Atualizar Disciplina
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <div className="rounded-lg bg-destructive/10 p-2.5 sm:p-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Disciplinas sao penalidades que voce aplica quando nao cumpre suas metas. 
            Use com responsabilidade para manter sua motivacao!
          </p>
        </div>

        {activeDisciplines.length === 0 && triggeredDisciplines.length === 0 ? (
          <p className="py-4 text-center text-xs sm:text-sm text-muted-foreground">
            Crie disciplinas para manter seu foco!
          </p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {activeDisciplines.map((discipline) => (
              <div 
                key={discipline.id}
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 sm:p-3"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{discipline.name}</h4>
                        {discipline.description && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{discipline.description}</p>
                        )}
                      </div>
                      <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(discipline)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(discipline.id)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded bg-destructive/20 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-destructive">
                        <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {getPenaltyLabel(discipline.penalty_type, discipline.penalty_value)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="shrink-0 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-4"
                    onClick={() => onTriggerDiscipline(discipline.id)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            ))}

            {triggeredDisciplines.length > 0 && (
              <div className="border-t pt-2 sm:pt-3">
                <p className="mb-1.5 sm:mb-2 text-xs font-medium text-muted-foreground">Historico</p>
                <div className="space-y-1.5 sm:space-y-2">
                  {triggeredDisciplines.slice(0, 3).map((discipline) => (
                    <div 
                      key={discipline.id}
                      className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-secondary/50 p-1.5 sm:p-2 opacity-60"
                    >
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive flex-shrink-0" />
                      <span className="flex-1 text-xs sm:text-sm truncate">{discipline.name}</span>
                      <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden sm:inline">{formatDate(discipline.triggered_at)}</span>
                      </span>
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
