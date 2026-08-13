'use client'

import { useState } from 'react'
import { Bell, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { EmojiPicker } from '@/components/emoji-picker'
import { Reminder } from '@/lib/types'
import { REMINDER_EMOJIS, resolveEmoji } from '@/lib/emoji-options'
import { cn } from '@/lib/utils'
import { formatDueTime, formatLocalDate, formatReminderDue, isReminderOverdue } from '@/lib/discipline'

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
  const [dueTime, setDueTime] = useState('')
  const [icon, setIcon] = useState('📝')
  const [showForm, setShowForm] = useState(false)

  const pending = reminders.filter((item) => !item.is_completed)
  const completed = reminders.filter((item) => item.is_completed)
  const today = formatLocalDate(new Date())

  const resetForm = () => {
    setTitle('')
    setNotes('')
    setDueAt('')
    setDueTime('')
    setIcon('📝')
    setShowForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreateReminder({
      title: title.trim(),
      notes: notes.trim() || null,
      due_at: dueAt || null,
      due_time: dueAt && dueTime ? dueTime : null,
      icon,
    })
    resetForm()
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
          Anotações rápidas, com data e hora opcionais. Não entram na pontuação.
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
            <EmojiPicker
              value={icon}
              onChange={setIcon}
              options={REMINDER_EMOJIS}
              label="Emoji"
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observação (opcional)"
              rows={2}
            />
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dueAt}
                  onChange={(e) => {
                    const nextDate = e.target.value
                    setDueAt(nextDate)
                    if (!nextDate) setDueTime('')
                  }}
                  aria-label="Data do lembrete"
                />
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  disabled={!dueAt}
                  aria-label="Hora do lembrete"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Data e hora opcionais. O aviso chega no dia e na véspera.
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
                onClick={resetForm}
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
                className="mt-0.5 h-9 w-9 rounded-xl bg-muted hover:bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg"
                aria-label="Marcar como concluído"
              >
                {resolveEmoji(reminder.icon, '📝')}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{reminder.title}</div>
                {reminder.notes && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {reminder.notes}
                  </div>
                )}
                {reminder.due_at && (
                  <div
                    className={cn(
                      'text-[11px] mt-1 font-medium',
                      isReminderOverdue(reminder.due_at, reminder.due_time)
                        ? 'text-destructive'
                        : reminder.due_at === today
                          ? 'text-primary'
                          : 'text-muted-foreground',
                    )}
                  >
                    {isReminderOverdue(reminder.due_at, reminder.due_time)
                      ? `Atrasado · ${formatReminderDue(reminder.due_at, reminder.due_time)}`
                      : reminder.due_at === today
                        ? formatDueTime(reminder.due_time)
                          ? `Hoje · ${formatDueTime(reminder.due_time)}`
                          : 'Hoje'
                        : formatReminderDue(reminder.due_at, reminder.due_time)}
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
              className="flex items-start gap-2 rounded-xl border border-border/40 p-2 opacity-70"
            >
              <button
                type="button"
                onClick={() => onUncompleteReminder(reminder.id)}
                className="mt-0.5 h-9 w-9 rounded-xl bg-green-500/15 text-lg flex items-center justify-center flex-shrink-0"
                aria-label="Desmarcar concluído"
              >
                {resolveEmoji(reminder.icon, '📝')}
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
