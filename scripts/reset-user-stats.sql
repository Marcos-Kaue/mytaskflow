-- Script para zerar todos os dados do usuário demo
-- Execute este script no SQL Editor do Supabase

-- Opção 1: Zerar apenas as estatísticas (mantém os dados)
UPDATE user_stats 
SET 
  total_points = 0,
  current_streak = 0,
  longest_streak = 0,
  total_completions = 0,
  total_habits = 0,
  updated_at = NOW()
WHERE user_id = 'demo-user-001';

-- Opção 2: Deletar todos os completions (histórico de hábitos marcados)
DELETE FROM habit_completions WHERE user_id = 'demo-user-001';

-- Opção 3: Resetar tudo - deletar hábitos, completions e zerar stats
-- DELETE FROM habits WHERE user_id = 'demo-user-001';
-- DELETE FROM habit_completions WHERE user_id = 'demo-user-001';
-- UPDATE user_stats SET total_points = 0, current_streak = 0, longest_streak = 0, total_completions = 0, total_habits = 0, updated_at = NOW() WHERE user_id = 'demo-user-001';
