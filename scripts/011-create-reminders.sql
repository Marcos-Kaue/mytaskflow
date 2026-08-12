-- Cria a área de Lembretes (sem pontuação) e libera acesso.

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  notes text,
  due_at date,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_is_completed ON reminders(is_completed);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders NO FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "personal_all_reminders" ON reminders;
CREATE POLICY "personal_all_reminders"
ON reminders FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON reminders TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
