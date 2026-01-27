-- Remover as políticas RLS antigas que dependem de auth.uid()
DROP POLICY IF EXISTS "Users can view their own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert their own habits" ON habits;
DROP POLICY IF EXISTS "Users can update their own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete their own habits" ON habits;

DROP POLICY IF EXISTS "Users can view their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can insert their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can update their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can delete their own completions" ON habit_completions;

DROP POLICY IF EXISTS "Users can view their own goals" ON monthly_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON monthly_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON monthly_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON monthly_goals;

DROP POLICY IF EXISTS "Users can view their own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can insert their own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update their own rewards" ON rewards;
DROP POLICY IF EXISTS "Users can delete their own rewards" ON rewards;

DROP POLICY IF EXISTS "Users can view their own earned rewards" ON earned_rewards;
DROP POLICY IF EXISTS "Users can insert their own earned rewards" ON earned_rewards;

DROP POLICY IF EXISTS "Users can view their own disciplines" ON disciplines;
DROP POLICY IF EXISTS "Users can insert their own disciplines" ON disciplines;
DROP POLICY IF EXISTS "Users can update their own disciplines" ON disciplines;
DROP POLICY IF EXISTS "Users can delete their own disciplines" ON disciplines;

DROP POLICY IF EXISTS "Users can view their own applied disciplines" ON applied_disciplines;
DROP POLICY IF EXISTS "Users can insert their own applied disciplines" ON applied_disciplines;

DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;

-- Criar novas políticas que permitem acesso público (modo demo)
-- IMPORTANTE: Em produção, você deve usar as políticas originais com autenticação

-- Políticas para habits
CREATE POLICY "Public access to habits" ON habits FOR ALL USING (true) WITH CHECK (true);

-- Políticas para habit_completions
CREATE POLICY "Public access to habit_completions" ON habit_completions FOR ALL USING (true) WITH CHECK (true);

-- Políticas para monthly_goals
CREATE POLICY "Public access to monthly_goals" ON monthly_goals FOR ALL USING (true) WITH CHECK (true);

-- Políticas para rewards
CREATE POLICY "Public access to rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);

-- Políticas para earned_rewards
CREATE POLICY "Public access to earned_rewards" ON earned_rewards FOR ALL USING (true) WITH CHECK (true);

-- Políticas para disciplines
CREATE POLICY "Public access to disciplines" ON disciplines FOR ALL USING (true) WITH CHECK (true);

-- Políticas para applied_disciplines
CREATE POLICY "Public access to applied_disciplines" ON applied_disciplines FOR ALL USING (true) WITH CHECK (true);

-- Políticas para user_stats
CREATE POLICY "Public access to user_stats" ON user_stats FOR ALL USING (true) WITH CHECK (true);
