'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth-provider'
import { cn } from '@/lib/utils'

export function AuthScreen() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        router.replace('/')
        router.refresh()
      } else {
        if (password.length < 6) {
          throw new Error('A senha precisa ter pelo menos 6 caracteres.')
        }
        const result = await signUp(email.trim(), password)
        if (result.needsEmailConfirm) {
          setInfo('Conta criada. Confirme o e-mail (se o Supabase pedir) e depois entre.')
          setMode('login')
        } else {
          router.replace('/')
          router.refresh()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível autenticar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size={64} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">MyTaskFlow</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cada pessoa entra na própria conta. Seus dados ficam só com você.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              className={cn(
                'h-9 rounded-lg text-sm font-medium transition-colors',
                mode === 'login' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground',
              )}
              onClick={() => {
                setMode('login')
                setError(null)
                setInfo(null)
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              className={cn(
                'h-9 rounded-lg text-sm font-medium transition-colors',
                mode === 'signup' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground',
              )}
              onClick={() => {
                setMode('signup')
                setError(null)
                setInfo(null)
              }}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="auth-email">E-mail</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="auth-password">Senha</Label>
                {mode === 'login' && (
                  <Link
                    href="/auth/forgot"
                    className="text-[11px] text-muted-foreground underline underline-offset-2"
                  >
                    Esqueci minha senha
                  </Link>
                )}
              </div>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">{error}</p>
            )}
            {info && (
              <p className="text-xs text-primary bg-primary/10 rounded-lg p-2">{info}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        </div>

        <p className="text-[11px] text-center text-muted-foreground">
          A sessão continua ativa neste aparelho até você sair.
        </p>
      </div>
    </div>
  )
}
