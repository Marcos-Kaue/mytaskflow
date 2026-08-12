'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/auth-provider'

export function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setInfo('Se existir uma conta com esse e-mail, enviamos o link para redefinir a senha.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail.')
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
            <h1 className="text-xl font-bold text-foreground">Esqueci minha senha</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enviaremos um link para você criar uma nova senha.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">E-mail</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
              />
            </div>
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">{error}</p>
            )}
            {info && (
              <p className="text-xs text-primary bg-primary/10 rounded-lg p-2">{info}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground">
            <Link href="/auth/login" className="underline underline-offset-2">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
