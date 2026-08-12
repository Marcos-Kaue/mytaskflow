-- Hábitos podem ou não valer pontuação.

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS counts_for_points boolean DEFAULT true;

UPDATE habits
SET counts_for_points = true
WHERE counts_for_points IS NULL;

NOTIFY pgrst, 'reload schema';
