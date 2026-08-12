'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
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

export function DateAlerts({ disciplines, reminders }: DateAlertsProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const alerts = useMemo(
    () => getUpcomingAlerts(disciplines, reminders),
    [disciplines, reminders],
  )

  useEffect(() => {
    registerServiceWorker()
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return
    notifyUpcomingAlerts(alerts)
  }, [alerts, permission])

  const enableAlerts = async () => {
    const next = await requestNotificationPermission()
    setPermission(next)
  }

  if (permission === 'unsupported') return null

  const showPermission = permission === 'default'
  if (!showPermission && alerts.length === 0) return null

  return (
    <div className="border-b border-primary/20 bg-primary/5">
      <div className="mx-auto max-w-5xl px-3 py-2 space-y-2">
        {showPermission && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-foreground">
              Ative os avisos para ser notificado no dia e na véspera do prazo.
            </p>
            <Button size="sm" className="h-8 gap-1 text-xs flex-shrink-0" onClick={enableAlerts}>
              <Bell className="h-3.5 w-3.5" />
              Ativar avisos
            </Button>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="space-y-1">
            {alerts.map((alert) => (
              <p key={alert.tag} className="text-xs sm:text-sm text-primary font-medium">
                {alert.title}: {alert.body}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
