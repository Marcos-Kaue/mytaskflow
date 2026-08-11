'use client'

import { AlertTriangle, HardDrive } from 'lucide-react'
import { BackendStatus } from '@/lib/repo'

export function StorageBanner({ status }: { status: BackendStatus }) {
  if (!status.error && !status.message) return null

  const isError = Boolean(status.error)
  const text = status.error || status.message

  return (
    <div
      className={
        isError
          ? 'border-b border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-b border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
      }
    >
      <div className="mx-auto flex max-w-5xl items-start gap-2 px-3 py-2 text-xs sm:text-sm">
        {isError ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        ) : (
          <HardDrive className="mt-0.5 h-4 w-4 flex-shrink-0" />
        )}
        <p>{text}</p>
      </div>
    </div>
  )
}
