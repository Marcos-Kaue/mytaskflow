'use client'

import React from "react"

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Habit } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  const [showForm, setShowForm] = useState(!!editingHabit)
  const [name, setName] = useState(editingHabit?.name || '')
  const [description, setDescription] = useState(editingHabit?.description || '')
  const [icon, setIcon] = useState(editingHabit?.icon || 'exercise')
  const [color, setColor] = useState(editingHabit?.color || 'emerald')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    editingHabit?.frequency || 'daily'
  )
  const [targetCount, setTargetCount] = useState(editingHabit?.target_count || 1)
  const isMobile = useIsMobile()

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
    setShowForm(false)
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

  const handleCancel = () => {
    resetForm()
    setShowForm(false)
    onClose?.()
  }

  if (!isMobile && !showForm && !editingHabit) {
    return (
      <Button className="gap-2" onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4" />
        Novo Habito
      </Button>
    )
  }

  if (!isMobile && !showForm && editingHabit) {
    return null
  }

  // Mobile or showing form
  if (!showForm && !editingHabit) {
    return (
      <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4" />
        Novo Habito
      </Button>
    )
  }

  const formContent = (
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
          autoFocus
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

      <div className="flex gap-2">
        <Button type="submit" className="flex-1 text-xs sm:text-sm h-8 sm:h-9">
          {editingHabit ? 'Salvar' : 'Criar'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
          className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )

  // Desktop: show form inline when active
  if (!isMobile && showForm) {
    return (
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">
            {editingHabit ? 'Editar Habito' : 'Novo Habito'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    )
  }

  // Mobile: show form as expanded card
  if (isMobile && showForm) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
        <Card className="w-full rounded-t-2xl border-0 border-t-2 border-primary/20 max-h-[90vh] overflow-y-auto">
          <CardHeader className="sticky top-0 bg-background border-b flex items-center justify-between pb-3">
            <CardTitle className="text-base">
              {editingHabit ? 'Editar Habito' : 'Novo Habito'}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {formContent}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default: show button
  return (
    <Button className="gap-2 w-full sm:w-auto" onClick={() => setShowForm(true)}>
      <Plus className="h-4 w-4" />
      Novo Habito
    </Button>
  )
}
