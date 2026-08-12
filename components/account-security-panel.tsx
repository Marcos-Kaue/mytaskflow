'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { KeyRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/components/auth-provider'
import { deleteOwnAccount } from '@/lib/repo'
import { useToast } from '@/hooks/use-toast'

export function AccountSecurityPanel() {
  const router = useRouter()
  const { user, authRequired, updatePassword, signOut } = useAuth()
  const { toast } = useToast()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [loading, setLoading] = useState(false)

  if (!authRequired || !user) return null

  const email = user.email || ''

  const handleChangePassword = async () => {
    setLoading(true)
    try {
      if (password.length < 6) {
        throw new Error('A senha precisa ter pelo menos 6 caracteres.')
      }
      if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem.')
      }
      await updatePassword(password)
      toast({ title: 'Senha atualizada!' })
      setPasswordOpen(false)
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast({
        title: 'Não foi possível alterar a senha',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmEmail.trim().toLowerCase() !== email.toLowerCase()) {
      toast({
        title: 'Confirme o e-mail corretamente',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const result = await deleteOwnAccount()
      await signOut()
      await mutate(() => true, undefined, { revalidate: false })
      toast({
        title: result.authDeleted
          ? 'Conta e dados apagados'
          : 'Dados apagados',
        description: result.authDeleted
          ? undefined
          : 'Rode scripts/017-delete-own-account.sql no Supabase para remover também o login.',
      })
      router.replace('/auth/login')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro ao apagar conta',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full h-10 gap-2"
        onClick={() => setPasswordOpen(true)}
      >
        <KeyRound className="h-4 w-4" />
        Trocar senha
      </Button>
      <Button
        variant="destructive"
        className="w-full h-10 gap-2"
        onClick={() => {
          setConfirmEmail('')
          setDeleteOpen(true)
        }}
      >
        <Trash2 className="h-4 w-4" />
        Apagar minha conta
      </Button>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="w-[95vw] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Trocar senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <Button className="w-full" disabled={loading} onClick={handleChangePassword}>
              {loading ? 'Salvando...' : 'Salvar senha'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[95vw] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Apagar conta</DialogTitle>
            <DialogDescription>
              Isso remove hábitos, histórico, recompensas, disciplinas, lembretes e a conta.
              Digite seu e-mail para confirmar: {email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="confirm-delete-email">E-mail</Label>
              <Input
                id="confirm-delete-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={email}
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              disabled={loading}
              onClick={handleDeleteAccount}
            >
              {loading ? 'Apagando...' : 'Apagar tudo definitivamente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
