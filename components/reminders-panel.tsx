'use client'

import { useState } from 'react'
import { Bell, Check, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Reminder } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDeadline, formatLocalDate } from '@/lib/discipline'

interface RemindersPanelProps {
  reminders: Reminder[]
  onCreateReminder: (reminder: Partial<Reminder>) => void
  onCompleteReminder: (id: string) => void
  onUncompleteReminder: (id: string) => void
  onDeleteReminder: (id: string) => void
}

export function RemindersPanel({
  reminders,
  onCreateReminder,
  onCompleteReminder,
  onUncompleteReminder,
  onDeleteReminder,
}: RemindersPanelProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [showForm, setShowForm] = useState(false)

  const pending = reminders.filter((item) => !item.is_completed)
  const completed = reminders.filter((item) => item.is_completed)
  const today = formatLocalDate(new Date())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreateReminder({
      title: title.trim(),
      notes: notes.trim() || null,
      due_at: dueAt || null,
    })
    setTitle('')
    setNotes('')
    setDueAt('')
    setShowForm(false)
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Lembretes
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            Sem pontuação
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Anotações rápidas, com data opcional. Não entram na pontuação.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Novo lembrete
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-primary/20 p-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ligar para o dentista"
              required
              autoFocus
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observação (opcional)"
              rows={2}
            />
            <div className="space-y-1">
              <Input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                aria-label="Data do lembrete"
              />
              <p className="text-[11px] text-muted-foreground">
                Data opcional. O aviso chega no dia e na véspera.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" size="sm">
                Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                size="sm"
                onClick={() => {
                  setShowForm(false)
                  setTitle('')
                  setNotes('')
                  setDueAt('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {pending.length === 0 && completed.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum lembrete ainda.
            </p>
          )}

          {pending.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-start gap-2 rounded-xl border border-border/60 p-2"
            >
              <button
                type="button"
                onClick={() => onCompleteReminder(reminder.id)}
                className="mt-0.5 h-9 w-9 rounded-xl bg-muted hover:bg-primary/10 flex items-center justify-center flex-shrink-0"
                aria-label="Marcar como concluído"
              >
                <Check className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{reminder.title}</div>
                {reminder.notes && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {reminder.notes}
                  </div>
                )}
                {reminder.due_at && (
                  <div className={cn(
                    'text-[11px] mt-1 font-medium',
                    reminder.due_at < today
                      ? 'text-destructive'
                      : reminder.due_at === today
                        ? 'text-primary'
                        : 'text-muted-foreground',
                  )}>
                    {reminder.due_at < today
                      ? `Atrasado · ${formatDeadline(reminder.due_at)}`
                      : reminder.due_at === today
                        ? 'Hoje'
                        : formatDeadline(reminder.due_at)}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm('Apagar este lembrete?')) {
                    onDeleteReminder(reminder.id)
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {completed.map((reminder) => (
            <div
              key={reminder.id}
              className={cn(
                'flex items-start gap-2 rounded-xl border border-border/40 p-2 opacity-70',
              )}
            >
              <button
                type="button"
                onClick={() => onUncompleteReminder(reminder.id)}
                className="mt-0.5 h-9 w-9 rounded-xl bg-green-500 text-white flex items-center justify-center flex-shrink-0"
                aria-label="Desmarcar concluído"
              >
                <Check className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-through">{reminder.title}</div>
                {reminder.notes && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-through">
                    {reminder.notes}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm('Apagar este lembrete?')) {
                    onDeleteReminder(reminder.id)
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
