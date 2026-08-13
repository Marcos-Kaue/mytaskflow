import { Discipline } from '@/lib/types'

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function defaultDeadlineDate(daysFromNow = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return formatLocalDate(date)
}

export function isDisciplineOpen(discipline: Discipline): boolean {
  const triggered = Boolean(discipline.triggered_at) && discipline.triggered_at !== discipline.created_at
  return !triggered && !discipline.fulfilled_at
}

export function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return 'Sem prazo'
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDueTime(timeStr: string | null | undefined): string | null {
  if (!timeStr) return null
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

export function formatReminderDue(dueAt: string | null, dueTime?: string | null): string {
  const date = formatDeadline(dueAt)
  const time = formatDueTime(dueTime)
  return time ? `${date} · ${time}` : date
}

export function isReminderOverdue(
  dueAt: string,
  dueTime: string | null | undefined,
  now = new Date(),
): boolean {
  const today = formatLocalDate(now)
  const datePart = dueAt.slice(0, 10)
  if (datePart < today) return true
  if (datePart > today) return false
  const time = formatDueTime(dueTime)
  if (!time) return false
  const [hours, minutes] = time.split(':').map(Number)
  const due = new Date(now)
  due.setHours(hours, minutes, 0, 0)
  return now.getTime() > due.getTime()
}

export function getDisciplineProgress(discipline: Discipline, totalPoints: number) {
  const today = formatLocalDate(new Date())
  const target = Math.max(discipline.target_points || 0, 0)
  const deadline = discipline.deadline_at
  const metTarget = totalPoints >= target
  const expired = Boolean(deadline) && deadline! < today
  const daysLeft = deadline
    ? Math.ceil(
        (new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null

  return {
    target,
    current: totalPoints,
    metTarget,
    expired,
    daysLeft,
    remainingPoints: Math.max(target - totalPoints, 0),
  }
}
