'use client'

import React from "react"

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Habit } from '@/lib/types'

interface HabitFormProps {
  onSubmit: (habit: Partial<Habit>) => void
  editingHabit?: Habit | null
  onClose?: () => void
}

const icons = [
  { value: 'exercise', label: 'Exercicio', emoji: '💪' },
  { value: 'water', label: 'Agua', emoji: '💧' },
  { value: 'reading', label: 'Leitura', emoji: '📚' },
  { value: 'meditation', label: 'Meditacao', emoji: '🧘' },
  { value: 'sleep', label: 'Sono', emoji: '😴' },
  { value: 'coding', label: 'Programacao', emoji: '💻' },
  { value: 'writing', label: 'Escrita', emoji: '✍️' },
  { value: 'healthy_eating', label: 'Alimentacao', emoji: '🥗' },
  { value: 'no_social_media', label: 'Sem Redes', emoji: '📵' },
  { value: 'gratitude', label: 'Gratidao', emoji: '🙏' },
]

const colors = [
  { value: 'emerald', label: 'Verde', class: 'bg-emerald-500' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'amber', label: 'Amarelo', class: 'bg-amber-500' },
  { value: 'rose', label: 'Rosa', class: 'bg-rose-500' },
  { value: 'violet', label: 'Roxo', class: 'bg-violet-500' },
]

export function HabitForm({ onSubmit, editingHabit, onClose }: HabitFormProps) {
  const [open, setOpen] = useState(!!editingHabit)
  const [name, setName] = useState(editingHabit?.name || '')
  const [description, setDescription] = useState(editingHabit?.description || '')
  const [icon, setIcon] = useState(editingHabit?.icon || 'exercise')
  const [color, setColor] = useState(editingHabit?.color || 'emerald')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    editingHabit?.frequency || 'daily'
  )
  const [targetCount, setTargetCount] = useState(editingHabit?.target_count || 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    onSubmit({
      id: editingHabit?.id,
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
      frequency,
      target_count: targetCount,
    })
    
    resetForm()
    setOpen(false)
    onClose?.()
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setIcon('exercise')
    setColor('emerald')
    setFrequency('daily')
    setTargetCount(1)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
      onClose?.()
    }
  }

  const content = (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="name" className="text-xs sm:text-sm">Nome do Habito</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Beber 2L de agua"
          className="text-xs sm:text-sm h-8 sm:h-9"
          required
        />
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="description" className="text-xs sm:text-sm">Descricao (opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Adicione detalhes sobre este habito"
          rows={2}
          className="text-xs sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Icone</Label>
          <Select value={icon} onValueChange={setIcon}>
            <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {icons.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span>{i.emoji}</span>
                    <span className="text-xs sm:text-sm">{i.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Cor</Label>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colors.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full ${c.class}`} />
                    <span className="text-xs sm:text-sm">{c.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Frequencia</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
            <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diario</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="target" className="text-xs sm:text-sm">Meta diaria</Label>
          <Input
            id="target"
            type="number"
            min={1}
            max={99}
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
            className="text-xs sm:text-sm h-8 sm:h-9"
          />
        </div>
      </div>

      <Button type="submit" className="w-full text-xs sm:text-sm h-8 sm:h-9">
        {editingHabit ? 'Salvar Alteracoes' : 'Criar Habito'}
      </Button>
    </form>
  )

  if (editingHabit) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Habito</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Habito
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Habito</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
