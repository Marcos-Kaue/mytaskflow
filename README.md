# MyTaskFlow - Rastreador de Hábitos

Um aplicativo web moderno para rastrear hábitos diários, visualizar progresso e conquistar recompensas.

![MyTaskFlow](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8)

## 🎯 Características

- ✅ **Rastreamento de Hábitos** - Acompanhe seus hábitos diários com grade mensal interativa
- 📊 **Análise de Progresso** - Visualize estatísticas e gráficos de desempenho
- 🏆 **Sistema de Recompensas** - Ganhe pontos e resgate recompensas personalizadas
- ⚡ **Sistema de Disciplinas** - Penalidades para manter o foco
- 📱 **Totalmente Responsivo** - Funciona perfeitamente em desktop e mobile
- 🌓 **Tema Claro/Escuro** - Interface adaptável

## 🚀 Tecnologias

- [Next.js 16](https://nextjs.org/) - Framework React
- [TypeScript](https://www.typescriptlang.org/) - Tipagem estática
- [Tailwind CSS](https://tailwindcss.com/) - Estilização
- [Supabase](https://supabase.com/) - Backend e banco de dados
- [SWR](https://swr.vercel.app/) - Data fetching
- [Radix UI](https://www.radix-ui.com/) - Componentes acessíveis
- [Recharts](https://recharts.org/) - Gráficos

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mytaskflow.git

# Entre na pasta
cd mytaskflow

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute o servidor de desenvolvimento
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## 🔧 Configuração do Supabase

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
