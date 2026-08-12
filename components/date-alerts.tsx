'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Discipline, Reminder } from '@/lib/types'
import {
  getUpcomingAlerts,
  notifyUpcomingAlerts,
  registerServiceWorker,
  requestNotificationPermission,
} from '@/lib/date-alerts'

interface DateAlertsProps {
  disciplines: Discipline[]
  reminders: Reminder[]
}

const DISMISSED_KEY = 'mtf-alert-banner-dismissed-v1'
const PERMISSION_DISMISSED_KEY = 'mtf-alert-permission-dismissed-v1'
const SHOW_MS = 7000

function loadDismissed(): Record<string, boolean> {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function markDismissed(tag: string) {
  const current = loadDismissed()
  current[tag] = true
  sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(current))
}

export function DateAlerts({ disciplines, reminders }: DateAlertsProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [visibleTags, setVisibleTags] = useState<string[]>([])
  const [showPermission, setShowPermission] = useState(false)
  const [ready, setReady] = useState(false)

  const alerts = useMemo(
    () => getUpcomingAlerts(disciplines, reminders),
    [disciplines, reminders],
  )

  useEffect(() => {
    registerServiceWorker()
    if (!('Notification' in window)) {
      setPermission('unsupported')
      setReady(true)
      return
    }
    setPermission(Notification.permission)
    const permissionDismissed = sessionStorage.getItem(PERMISSION_DISMISSED_KEY) === '1'
    setShowPermission(Notification.permission === 'default' && !permissionDismissed)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (permission === 'granted') {
      void notifyUpcomingAlerts(alerts)
    }

    const dismissed = loadDismissed()
    const pending = alerts.filter((alert) => !dismissed[alert.tag]).map((alert) => alert.tag)
    if (pending.length === 0) {
      setVisibleTags([])
      return
    }

    setVisibleTags(pending)

    const timer = window.setTimeout(() => {
      pending.forEach(markDismissed)
      setVisibleTags([])
    }, SHOW_MS)

    return () => window.clearTimeout(timer)
  }, [alerts, permission, ready])

  const enableAlerts = async () => {
    const next = await requestNotificationPermission()
    setPermission(next)
    setShowPermission(false)
    sessionStorage.setItem(PERMISSION_DISMISSED_KEY, '1')
  }

  const dismissPermission = () => {
    setShowPermission(false)
    sessionStorage.setItem(PERMISSION_DISMISSED_KEY, '1')
  }

  const dismissAlert = (tag: string) => {
    markDismissed(tag)
    setVisibleTags((current) => current.filter((item) => item !== tag))
  }

  if (permission === 'unsupported') return null

  const visibleAlerts = alerts.filter((alert) => visibleTags.includes(alert.tag))
  if (!showPermission && visibleAlerts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3">
      <div className="mx-auto max-w-md space-y-2">
        {showPermission && (
          <div className="pointer-events-auto rounded-xl border border-primary/20 bg-card shadow-lg p-3 flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-foreground">
                Ative os avisos para ser notificado no dia e na véspera do prazo.
              </p>
              <Button size="sm" className="mt-2 h-8 gap-1 text-xs" onClick={enableAlerts}>
                <Bell className="h-3.5 w-3.5" />
                Ativar avisos
              </Button>
            </div>
            <button
              type="button"
              onClick={dismissPermission}
              className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {visibleAlerts.map((alert) => (
          <div
            key={alert.tag}
            className="pointer-events-auto rounded-xl border border-primary/25 bg-primary text-primary-foreground shadow-lg p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2"
          >
            <Bell className="h-4 w-4 mt-0.5 flex-shrink-0 opacity-90" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold">{alert.title}</p>
              <p className="text-[11px] sm:text-xs opacity-90 mt-0.5">{alert.body}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissAlert(alert.tag)}
              className="h-7 w-7 rounded-lg hover:bg-white/15 flex items-center justify-center"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
