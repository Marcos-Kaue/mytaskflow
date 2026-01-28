'use client'

import React from "react"

import { useState } from 'react'
import { AlertTriangle, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  onCreateDiscipline: (discipline: Partial<Discipline>) => void
  onUpdateDiscipline: (disciplineId: string, discipline: Partial<Discipline>) => void
  onDeleteDiscipline: (disciplineId: string) => void
  onTriggerDiscipline: (disciplineId: string) => void
}

export function DisciplinePanel({ disciplines, onCreateDiscipline, onUpdateDiscipline, onDeleteDiscipline, onTriggerDiscipline }: DisciplinePanelProps) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [penaltyType, setPenaltyType] = useState<'points' | 'streak_reset' | 'custom'>('points')
  const [penaltyValue, setPenaltyValue] = useState(50)
  const [isExpanded, setIsExpanded] = useState(false)
  const [triggerConfirmId, setTriggerConfirmId] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    console.log('Criando disciplina:', { name, description, penaltyType, penaltyValue })
    
    if (editingDiscipline) {
      onUpdateDiscipline(editingDiscipline.id, {
        name: name.trim(),
        description: description.trim() || null,
        penalty_type: penaltyType,
        penalty_value: penaltyValue,
      })
    } else {
      onCreateDiscipline({
        name: name.trim(),
        description: description.trim() || null,
        penalty_type: penaltyType,
        penalty_value: penaltyValue,
      })
    }
    
    resetForm()
    setOpen(false)
    setEditOpen(false)
  }

  const handleEdit = (discipline: Discipline) => {
    setEditingDiscipline(discipline)
    setName(discipline.name)
    setDescription(discipline.description || '')
    setPenaltyType(discipline.penalty_type as 'points' | 'streak_reset' | 'custom')
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
        return 'Zera sequência'
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

  const formContent = (isEdit: boolean) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-disc-name" : "disc-name"}>Nome</Label>
        <Input
          id={isEdit ? "edit-disc-name" : "disc-name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Faltar no treino"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-disc-desc" : "disc-desc"}>Descrição (opcional)</Label>
        <Input
          id={isEdit ? "edit-disc-desc" : "disc-desc"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes da penalidade"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-penalty-type" : "penalty-type"}>Tipo de Penalidade</Label>
        <Select value={penaltyType} onValueChange={(v) => setPenaltyType(v as typeof penaltyType)}>
          <SelectTrigger id={isEdit ? "edit-penalty-type" : "penalty-type"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="points">Remover Pontos</SelectItem>
            <SelectItem value="streak_reset">Resetar Sequência</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {penaltyType !== 'streak_reset' && (
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-penalty-value" : "penalty-value"}>
            Valor {penaltyType === 'points' ? '(pontos)' : '(dias)'}
          </Label>
          <Input
            id={isEdit ? "edit-penalty-value" : "penalty-value"}
            type="number"
            min={1}
            value={penaltyValue}
            onChange={(e) => setPenaltyValue(Number(e.target.value))}
          />
        </div>
      )}

      <Button type="submit" className="w-full">
        {isEdit ? 'Atualizar Disciplina' : 'Criar Disciplina'}
      </Button>
    </form>
  )

  return (
    <>
      <Card className="overflow-hidden border-destructive/20">
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-3 sm:p-6 bg-destructive/5" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <ChevronDown className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
              <span className="whitespace-nowrap">Disciplina</span>
            </CardTitle>
          </div>
          {isExpanded && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-4 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(true)
              }}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            {activeDisciplines.length === 0 && triggeredDisciplines.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Configure disciplinas para se manter motivado!
              </p>
            ) : (
              <>
                {activeDisciplines.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-destructive">Penalidades Ativas</p>
                    {activeDisciplines.map((discipline) => (
                      <div 
                        key={discipline.id}
                        className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 sm:p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{discipline.name}</h4>
                            {discipline.description && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{discipline.description}</p>
                            )}
                            <p className="text-[10px] sm:text-xs text-destructive font-medium mt-1">
                              {getPenaltyLabel(discipline.penalty_type, discipline.penalty_value)}
                            </p>
                          </div>
                          <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(discipline)
                              }}
                              className="p-1 hover:bg-muted rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-3 w-3 text-muted-foreground" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(discipline.id)
                              }}
                              className="p-1 hover:bg-muted rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full mt-2 text-xs sm:text-sm h-7 sm:h-8"
                          onClick={() => setTriggerConfirmId(discipline.id)}
                        >
                          Aplicar Penalidade
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {triggeredDisciplines.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Aplicadas</p>
                    <div className="space-y-2">
                      {triggeredDisciplines.slice(0, 3).map((discipline) => (
                        <div 
                          key={discipline.id}
                          className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2 opacity-60"
                        >
                          <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                          <span className="text-sm line-through">{discipline.name}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {formatDate(discipline.triggered_at || '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Disciplina</DialogTitle>
            <DialogDescription>
              Configure uma penalidade para manter a disciplina e o foco nos seus objetivos.
            </DialogDescription>
          </DialogHeader>
          {formContent(false)}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => {
        setEditOpen(isOpen)
        if (!isOpen) resetForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Disciplina</DialogTitle>
            <DialogDescription>
              Altere os detalhes da sua disciplina.
            </DialogDescription>
          </DialogHeader>
          {formContent(true)}
        </DialogContent>
      </Dialog>

      {/* Trigger Confirmation Dialog */}
      <AlertDialog open={!!triggerConfirmId} onOpenChange={(isOpen) => {
        if (!isOpen) setTriggerConfirmId(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar Penalidade?</AlertDialogTitle>
            <AlertDialogDescription>
              {triggerConfirmId && activeDisciplines.find(d => d.id === triggerConfirmId) && (
                <>
                  Tem certeza que deseja aplicar a penalidade <strong>{activeDisciplines.find(d => d.id === triggerConfirmId)?.name}</strong>?
                  <div className="mt-3 p-2 bg-destructive/10 rounded border border-destructive/30">
                    <p className="text-destructive text-xs font-medium">
                      ⚠️ {getPenaltyLabel(
                        activeDisciplines.find(d => d.id === triggerConfirmId)?.penalty_type || 'points',
                        activeDisciplines.find(d => d.id === triggerConfirmId)?.penalty_value || 0
                      )}
                    </p>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (triggerConfirmId) {
                  onTriggerDiscipline(triggerConfirmId)
                  setTriggerConfirmId(null)
                }
              }}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Aplicar Penalidade
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
