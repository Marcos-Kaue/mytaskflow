# Guia de Correção - Funcionalidades Não Funcionam

## Problema Identificado
As funções de criar hábitos, disciplinas e recompensas não estão funcionando porque:
1. As tabelas do Supabase não foram criadas
2. As políticas RLS (Row Level Security) impedem o acesso sem autenticação
3. A chave do Supabase pode estar incompleta

## Solução Passo a Passo

### PASSO 1: Obter suas credenciais corretas do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto "mytaskflow"
3. Vá em **Settings** (⚙️ no menu lateral esquerdo)
4. Clique em **API**
5. Copie:
   - **Project URL** (deve ser: https://exrqykhndjxhvvhecicu.supabase.co)
   - **anon/public key** (uma chave LONGA que começa com "eyJ...")

### PASSO 2: Atualizar o arquivo .env.local

Abra o arquivo `.env.local` e substitua o conteúdo por:

```
NEXT_PUBLIC_SUPABASE_URL=https://exrqykhndjxhvvhecicu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_COMPLETA_AQUI
```

**IMPORTANTE:** A chave anon deve ter cerca de 200-300 caracteres!

### PASSO 3: Criar as tabelas no Supabase

1. No dashboard do Supabase, vá em **SQL Editor** (no menu lateral)
2. Clique em "New query"
3. Cole o conteúdo do arquivo `scripts/001-create-habits-tables.sql`
4. Clique em "Run" (▶️)

### PASSO 4: Adicionar a coluna is_active (correção)

1. No SQL Editor, crie uma nova query
2. Cole este código:

```sql
-- Adicionar coluna is_active às tabelas que não têm
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_habits INTEGER DEFAULT 0;
```

3. Clique em "Run" (▶️)

### PASSO 5: Corrigir as políticas RLS para modo demo

1. No SQL Editor, crie uma nova query
2. Cole o conteúdo do arquivo `scripts/004-fix-rls-policies.sql`
3. Clique em "Run" (▶️)

### PASSO 6: Reiniciar o servidor

No terminal do VS Code:
1. Pare o servidor (Ctrl+C)
2. Execute: `pnpm dev`

### PASSO 7: Testar

1. Abra http://localhost:3000
2. Tente criar um hábito
3. Tente criar uma recompensa
4. Tente criar uma disciplina

## Verificação de Sucesso

Após seguir todos os passos, você deve conseguir:
- ✅ Criar novos hábitos
- ✅ Marcar hábitos como concluídos
- ✅ Criar recompensas
- ✅ Criar disciplinas
- ✅ Ver estatísticas atualizadas

## Se ainda não funcionar

Execute este comando no terminal para verificar a conexão:

```powershell
# Verificar se as variáveis de ambiente estão carregadas
Write-Host "URL: $env:NEXT_PUBLIC_SUPABASE_URL"
Write-Host "Key length: $($env:NEXT_PUBLIC_SUPABASE_ANON_KEY.Length)"
```

A chave deve ter pelo menos 100 caracteres.

## Suporte Adicional

Se o problema persistir, verifique:
1. Console do navegador (F12) para erros
2. Terminal do servidor para erros de API
3. Supabase Dashboard > Logs para erros de banco de dados
