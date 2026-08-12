-- Adiciona prazo e meta de pontuação nas disciplinas.

ALTER TABLE disciplines
  ADD COLUMN IF NOT EXISTS deadline_at date,
  ADD COLUMN IF NOT EXISTS target_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;

NOTIFY pgrst, 'reload schema';
