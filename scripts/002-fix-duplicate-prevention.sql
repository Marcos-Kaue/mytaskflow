-- Remover duplicatas existentes (manter apenas a mais antiga)
DELETE FROM habit_completions a
USING habit_completions b
WHERE a.id > b.id
  AND a.habit_id = b.habit_id
  AND a.user_id = b.user_id
  AND DATE(a.completed_at) = DATE(b.completed_at);

-- Criar índice único parcial usando expressão (PostgreSQL 9.5+)
-- Isso previne duplicatas baseado em habit_id, user_id e data (sem hora)
CREATE UNIQUE INDEX IF NOT EXISTS habit_completions_unique_per_day
ON habit_completions (habit_id, user_id, (DATE(completed_at)));
