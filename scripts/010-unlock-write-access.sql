-- Libera escrita no MyTaskFlow (uso pessoal, sem login).
-- Execute no SQL Editor do Supabase e depois tente criar um hábito.

-- 1) Remove TODAS as políticas atuais dessas tabelas
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'habits',
        'habit_completions',
        'user_stats',
        'rewards',
        'disciplines'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2) Políticas abertas para anon/authenticated
CREATE POLICY "personal_all_habits" ON habits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "personal_all_habit_completions" ON habit_completions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "personal_all_user_stats" ON user_stats FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "personal_all_rewards" ON rewards FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "personal_all_disciplines" ON disciplines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3) Liga RLS (necessário para as policies valerem)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

ALTER TABLE habits NO FORCE ROW LEVEL SECURITY;
ALTER TABLE habit_completions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE user_stats NO FORCE ROW LEVEL SECURITY;
ALTER TABLE rewards NO FORCE ROW LEVEL SECURITY;
ALTER TABLE disciplines NO FORCE ROW LEVEL SECURITY;

-- 4) Permissões explícitas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habits TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON habit_completions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_stats TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rewards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON disciplines TO anon, authenticated;

INSERT INTO user_stats (
  user_id, total_points, current_streak, longest_streak,
  total_completions, total_habits, updated_at
)
VALUES ('demo-user-001', 0, 0, 0, 0, 0, NOW())
ON CONFLICT (user_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
