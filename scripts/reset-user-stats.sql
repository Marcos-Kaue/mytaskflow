-- Script para zerar todos os dados do usuário demo
-- Execute este script no SQL Editor do Supabase

-- Zerar estatísticas do usuário
UPDATE user_stats 
SET 
  total_points = 0,
  current_streak = 0,
  longest_streak = 0,
  total_completions = 0,
  updated_at = NOW()
WHERE user_id = 'demo-user-001';

-- Opcional: Deletar todos os completions (histórico de hábitos marcados)
-- Descomente a linha abaixo se quiser apagar todo o histórico
-- DELETE FROM habit_completions WHERE user_id = 'demo-user-001';

-- Opcional: Deletar todos os hábitos
-- Descomente a linha abaixo se quiser apagar todos os hábitos também
-- DELETE FROM habits WHERE user_id = 'demo-user-001';
