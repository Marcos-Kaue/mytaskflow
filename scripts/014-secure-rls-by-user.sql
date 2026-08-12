-- Isola os dados por usuário autenticado (auth.uid).
-- Execute no SQL Editor do Supabase DEPOIS de ativar Authentication.
-- Recomendado: em Authentication > Providers > Email, pode desativar
-- "Confirm email" se for uso pessoal entre poucas pessoas.

-- Remove políticas abertas antigas
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'habits',
        'habit_completions',
        'user_stats',
        'rewards',
        'disciplines',
        'reminders'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

ALTER TABLE habits FORCE ROW LEVEL SECURITY;
ALTER TABLE habit_completions FORCE ROW LEVEL SECURITY;
ALTER TABLE user_stats FORCE ROW LEVEL SECURITY;
ALTER TABLE rewards FORCE ROW LEVEL SECURITY;
ALTER TABLE disciplines FORCE ROW LEVEL SECURITY;
ALTER TABLE reminders FORCE ROW LEVEL SECURITY;

-- Políticas: só o dono lê/escreve
CREATE POLICY "users_own_habits"
ON habits FOR ALL TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_own_habit_completions"
ON habit_completions FOR ALL TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_own_user_stats"
ON user_stats FOR ALL TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_own_rewards"
ON rewards FOR ALL TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_own_disciplines"
ON disciplines FOR ALL TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "users_own_reminders"
ON reminders FOR ALL TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Anon não escreve mais
REVOKE ALL ON TABLE habits FROM anon;
REVOKE ALL ON TABLE habit_completions FROM anon;
REVOKE ALL ON TABLE user_stats FROM anon;
REVOKE ALL ON TABLE rewards FROM anon;
REVOKE ALL ON TABLE disciplines FROM anon;
REVOKE ALL ON TABLE reminders FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE habit_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE disciplines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE reminders TO authenticated;

NOTIFY pgrst, 'reload schema';
