import { Discipline, Reminder } from '@/lib/types'
import { formatDeadline, formatLocalDate, formatReminderDue, isDisciplineOpen } from '@/lib/discipline'

export type UpcomingAlert = {
  id: string
  tag: string
  title: string
  body: string
  daysLeft: number
}

function daysUntil(dateStr: string): number {
  const today = formatLocalDate(new Date())
  const todayTime = new Date(`${today}T12:00:00`).getTime()
  const dueTime = new Date(`${dateStr}T12:00:00`).getTime()
  return Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24))
}

export function getUpcomingAlerts(
  disciplines: Discipline[],
  reminders: Reminder[],
): UpcomingAlert[] {
  const alerts: UpcomingAlert[] = []

  for (const discipline of disciplines) {
    if (!isDisciplineOpen(discipline) || !discipline.deadline_at) continue
    const daysLeft = daysUntil(discipline.deadline_at)
    if (daysLeft < 0 || daysLeft > 1) continue

    alerts.push({
      id: discipline.id,
      tag: `discipline-${discipline.id}-${discipline.deadline_at}`,
      title: daysLeft === 0 ? 'Prazo da disciplina é hoje' : 'Prazo da disciplina amanhã',
      body: `${discipline.name} · ${formatDeadline(discipline.deadline_at)}`,
      daysLeft,
    })
  }

  for (const reminder of reminders) {
    if (reminder.is_completed || !reminder.due_at) continue
    const daysLeft = daysUntil(reminder.due_at)
    if (daysLeft < 0 || daysLeft > 1) continue

    alerts.push({
      id: reminder.id,
      tag: `reminder-${reminder.id}-${reminder.due_at}`,
      title: daysLeft === 0 ? 'Lembrete para hoje' : 'Lembrete para amanhã',
      body: `${reminder.title} · ${formatReminderDue(reminder.due_at, reminder.due_time)}`,
      daysLeft,
    })
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft)
}

const NOTIFIED_KEY = 'mtf-notified-v1'

function loadNotified(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function markNotified(tag: string) {
  const current = loadNotified()
  current[tag] = true
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(current))
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return Notification.requestPermission()
}

export async function notifyUpcomingAlerts(alerts: UpcomingAlert[]) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted' || alerts.length === 0) return

  const notified = loadNotified()
  const pending = alerts.filter((alert) => !notified[alert.tag])
  if (pending.length === 0) return

  const registration = await navigator.serviceWorker?.ready.catch(() => null)

  for (const alert of pending) {
    if (registration?.active) {
      registration.active.postMessage({
        type: 'NOTIFY',
        title: alert.title,
        body: alert.body,
        tag: alert.tag,
      })
    } else {
      new Notification(alert.title, {
        body: alert.body,
        tag: alert.tag,
      })
    }
    markNotified(alert.tag)
  }
}
