# MyTaskFlow - Rastreador de Hábitos com Gamificação

Um aplicativo web moderno para rastrear hábitos diários, visualizar progresso e conquistar recompensas com um sistema gamificado completo.

![MyTaskFlow](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## 🎯 Características Principais

- ✅ **Rastreamento de Hábitos** - Acompanhe seus hábitos diários com grade mensal interativa
- 📊 **Análise de Progresso** - Visualize estatísticas e gráficos detalhados de desempenho
- 🏆 **Sistema de Recompensas** - Ganhe pontos e resgate recompensas personalizadas
- ⚡ **Sistema de Disciplinas** - Penalidades para manter o foco e comprometimento
- 📱 **Mobile-First Design** - Interface completa e funcional em dispositivos móveis
- 🎮 **Gamificação** - Pontos, sequências e badges para motivar progresso
- 🌈 **Tema Roxo + Laranja** - Interface moderna e atrativa com cores quentes
- 🚀 **Totalmente Responsivo** - Desktop, tablet e mobile com UX otimizada

## 💻 Stack Tecnológico

| Tecnologia | Descrição |
|-----------|-----------|
| [Next.js 16](https://nextjs.org/) | Framework React com Turbopack |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática robusta |
| [Tailwind CSS](https://tailwindcss.com/) | Estilização com OKLCH |
| [Supabase](https://supabase.com/) | Backend PostgreSQL |
| [SWR](https://swr.vercel.app/) | Data fetching e cache |
| [Radix UI + shadcn](https://ui.shadcn.com/) | Componentes acessíveis |
| [Recharts](https://recharts.org/) | Gráficos e análises |

## 📥 Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/Marcos-Kaue/mytaskflow.git
cd mytaskflow

# Instale as dependências
pnpm install

# Configure o ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# Execute desenvolvimento
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🚀 Deploy

```bash
# Build para produção
pnpm build

# Deploy na Vercel
vercel
```

## 🎨 Estrutura do Projeto

```
mytaskflow/
├── app/                    # Rotas Next.js (App Router)
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout raiz
│   ├── globals.css        # Estilos globais
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── mobile-page.tsx    # Interface mobile
│   ├── rewards-panel.tsx  # Gerenciar recompensas
│   ├── discipline-panel.tsx # Gerenciar disciplinas
│   ├── habit-*.tsx        # Componentes de hábitos
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilitários e tipos
│   ├── types.ts          # Interfaces TypeScript
│   ├── utils.ts          # Funções auxiliares
│   └── supabase/         # Cliente Supabase
├── hooks/                # Custom React hooks
├── scripts/              # Scripts SQL
└── public/               # Assets estáticos
```

## 📱 Features Mobile

✨ **Interface Otimizada para Mobile:**
- Navegação por abas (Hábitos, Prêmios, Disciplina, Análise)
- Criação rápida de hábitos inline
- Formulários em dialogs responsivos
- Buttons touch-friendly
- Sem necessidade de scroll horizontal

## 🔄 Fluxo de Funcionamento

1. **Criar Hábitos** - Defina hábitos que quer rastrear
2. **Acompanhar Diariamente** - Marque conclusões no calendário
3. **Ganhar Pontos** - Acumule pontos por cada hábito completado
4. **Desbloquear Recompensas** - Troque pontos por recompensas
5. **Aplicar Disciplinas** - Perca pontos por quebra de compromissos
6. **Analisar Progresso** - Visualize estatísticas e tendências

## 🛠️ Desenvolvimento

```bash
# Verificar tipos
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build

# Iniciar modo produção
pnpm start
```

## 📄 Licença

MIT - Sinta-se livre para usar em projetos pessoais e comerciais.

## 👨‍💻 Autor

**Marcos Kaue** - [GitHub](https://github.com/Marcos-Kaue)

---

**MyTaskFlow** - Transforme seus hábitos em sucesso! 🚀

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute os scripts SQL da pasta `/scripts`:
   - `001-create-habits-tables.sql`
   - `002-fix-duplicate-prevention.sql`
4. Copie as credenciais para `.env.local`

## 📱 Funcionalidades

### Grid de Hábitos
- Visualização mensal com navegação
- Marcação rápida de hábitos completos
- Edição e exclusão de hábitos
- Progresso diário e semanal

### Análise
- Tabela de análise mensal
- Gráfico de progresso
- Estatísticas em tempo real

### Recompensas
- Crie recompensas personalizadas
- Sistema de pontos
- Resgate de recompensas

### Disciplinas
- Penalidades personalizáveis
- Perda de pontos ou reset de sequência
- Histórico de aplicações

## 🎨 Capturas de Tela

[Adicione suas capturas de tela aqui]

## 📄 Licença

MIT

## 👤 Autor

Seu Nome - [@seu-usuario](https://github.com/seu-usuario)

## 🤝 Contribuindo

Contribuições, issues e feature requests são bem-vindos!

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
