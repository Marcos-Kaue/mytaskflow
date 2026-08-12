-- ATENÇÃO: apaga os dados atuais e recria as tabelas no formato
-- que o MyTaskFlow espera. Use se criar hábito der erro de coluna
-- (ex.: Could not find the 'name' column).

DROP TABLE IF EXISTS habit_completions CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS disciplines CASCADE;

CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'target',
  color text DEFAULT '#10b981',
  frequency text DEFAULT 'daily',
  target_count integer DEFAULT 1,
  counts_for_points boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE TABLE user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  total_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_completions integer DEFAULT 0,
  total_habits integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'gift',
  points_required integer DEFAULT 100,
  is_claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  penalty_type text DEFAULT 'points',
  penalty_value integer DEFAULT 0,
  triggered_at timestamptz,
  goal_id uuid,
  deadline_at date,
  target_points integer DEFAULT 0,
  fulfilled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX habit_completions_unique_per_day
ON habit_completions (habit_id, user_id, ((completed_at AT TIME ZONE 'UTC')::date));

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_is_active ON habits(is_active);
CREATE INDEX idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Com políticas abertas + grants. RLS ON para o painel do Supabase não reclamar.
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (uso pessoal)
DROP POLICY IF EXISTS "personal_all_habits" ON habits;
DROP POLICY IF EXISTS "personal_all_habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "personal_all_user_stats" ON user_stats;
DROP POLICY IF EXISTS "personal_all_rewards" ON rewards;
DROP POLICY IF EXISTS "personal_all_disciplines" ON disciplines;

CREATE POLICY "personal_all_habits" ON habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_all_habit_completions" ON habit_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_all_user_stats" ON user_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_all_rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "personal_all_disciplines" ON disciplines FOR ALL USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE habits TO anon, authenticated;
GRANT ALL ON TABLE habit_completions TO anon, authenticated;
GRANT ALL ON TABLE user_stats TO anon, authenticated;
GRANT ALL ON TABLE rewards TO anon, authenticated;
GRANT ALL ON TABLE disciplines TO anon, authenticated;

INSERT INTO user_stats (
  user_id,
  total_points,
  current_streak,
  longest_streak,
  total_completions,
  total_habits,
  updated_at
)
VALUES ('demo-user-001', 0, 0, 0, 0, 0, NOW())
ON CONFLICT (user_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
