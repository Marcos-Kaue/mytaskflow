-- Script de Migração para adicionar colunas faltantes
-- Execute este script DEPOIS de executar 001-create-habits-tables.sql

-- 1. Adicionar coluna is_active à tabela habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Adicionar coluna total_habits à tabela user_stats (caso não exista)
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_habits INTEGER DEFAULT 0;

-- 3. Remover a dependência de auth.users para permitir uso sem autenticação
-- Isso remove a chave estrangeira que requer usuários autenticados

-- Primeiro, remover as constraints de foreign key
ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_user_id_fkey;
ALTER TABLE habit_completions DROP CONSTRAINT IF EXISTS habit_completions_user_id_fkey;
ALTER TABLE monthly_goals DROP CONSTRAINT IF EXISTS monthly_goals_user_id_fkey;
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_user_id_fkey;
ALTER TABLE earned_rewards DROP CONSTRAINT IF EXISTS earned_rewards_user_id_fkey;
ALTER TABLE disciplines DROP CONSTRAINT IF EXISTS disciplines_user_id_fkey;
ALTER TABLE applied_disciplines DROP CONSTRAINT IF EXISTS applied_disciplines_user_id_fkey;
ALTER TABLE user_stats DROP CONSTRAINT IF EXISTS user_stats_user_id_fkey;

-- Alterar o tipo de user_id de UUID para TEXT para permitir IDs customizados
ALTER TABLE habits ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE habit_completions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE monthly_goals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE rewards ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE earned_rewards ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE disciplines ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE applied_disciplines ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE user_stats ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 4. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_completed_at ON habit_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- 5. Inserir dados de demonstração para o usuário demo
INSERT INTO user_stats (user_id, total_points, current_streak, longest_streak, total_completions, total_habits, level, updated_at)
VALUES ('demo-user-001', 0, 0, 0, 0, 0, 1, NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 6. Inserir alguns hábitos de exemplo (opcional)
INSERT INTO habits (user_id, name, description, icon, color, frequency, is_active)
VALUES 
  ('demo-user-001', 'Exercício Físico', 'Fazer 30 minutos de exercício', 'dumbbell', '#10b981', 'daily', true),
  ('demo-user-001', 'Ler Livros', 'Ler pelo menos 20 páginas', 'book', '#3b82f6', 'daily', true),
  ('demo-user-001', 'Meditar', 'Meditar por 10 minutos', 'brain', '#8b5cf6', 'daily', true)
ON CONFLICT DO NOTHING;

-- 7. Inserir algumas recompensas de exemplo (opcional)
INSERT INTO rewards (user_id, name, description, icon, points_required)
VALUES
  ('demo-user-001', 'Dia de Descanso', 'Um dia livre de hábitos', 'gift', 100),
  ('demo-user-001', 'Filme no Cinema', 'Assistir um filme no cinema', 'film', 200),
  ('demo-user-001', 'Jantar Especial', 'Jantar no seu restaurante favorito', 'utensils', 300)
ON CONFLICT DO NOTHING;

-- 8. Inserir algumas disciplinas de exemplo (opcional)
INSERT INTO disciplines (user_id, name, description, icon)
VALUES
  ('demo-user-001', 'Sem Redes Sociais', 'Ficar 1 dia sem redes sociais', 'smartphone'),
  ('demo-user-001', 'Acordar Cedo', 'Acordar às 6h da manhã', 'sunrise'),
  ('demo-user-001', 'Limpeza Extra', 'Limpar a casa completamente', 'broom')
ON CONFLICT DO NOTHING;

COMMIT;
