'use client'

import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const { user, authRequired, signOut } = useAuth()

  if (!authRequired || !user) return null

  const label = user.email?.split('@')[0] || 'Conta'

  return (
    <div className="flex items-center gap-2 min-w-0">
      {!compact && (
        <span className="text-[11px] sm:text-xs opacity-90 truncate max-w-[110px] sm:max-w-[160px]">
          {label}
        </span>
      )}
      <Button
        size="sm"
        variant="secondary"
        className={compact ? 'h-8 px-2 gap-1 text-[11px]' : 'h-8 px-2 gap-1 text-xs'}
        onClick={async () => {
          if (!confirm('Sair da conta neste aparelho?')) return
          await signOut()
          await mutate(() => true, undefined, { revalidate: false })
          router.replace('/auth/login')
          router.refresh()
        }}
      >
        <LogOut className="h-3.5 w-3.5" />
        Sair
      </Button>
    </div>
  )
}
