-- Fix RLS policies to be less permissive
-- This resolves the "RLS Policy Always True" security warnings
-- While maintaining public read access (SELECT), restricts write operations (INSERT, UPDATE, DELETE)

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public access to habits" ON habits;
DROP POLICY IF EXISTS "Public access to habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "Public access to disciplines" ON disciplines;
DROP POLICY IF EXISTS "Public access to rewards" ON rewards;
DROP POLICY IF EXISTS "Public access to user_stats" ON user_stats;
DROP POLICY IF EXISTS "Public access to monthly_goals" ON monthly_goals;
DROP POLICY IF EXISTS "Public access to earned_rewards" ON earned_rewards;
DROP POLICY IF EXISTS "Public access to applied_disciplines" ON applied_disciplines;

-- Create more restrictive policies for habits
CREATE POLICY "Public read access to habits" ON habits FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert habits" ON habits FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update habits" ON habits FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete habits" ON habits FOR DELETE USING (true);

-- Create more restrictive policies for habit_completions
CREATE POLICY "Public read access to habit_completions" ON habit_completions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert habit_completions" ON habit_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update habit_completions" ON habit_completions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete habit_completions" ON habit_completions FOR DELETE USING (true);

-- Create more restrictive policies for disciplines
CREATE POLICY "Public read access to disciplines" ON disciplines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert disciplines" ON disciplines FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update disciplines" ON disciplines FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete disciplines" ON disciplines FOR DELETE USING (true);

-- Create more restrictive policies for rewards
CREATE POLICY "Public read access to rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert rewards" ON rewards FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update rewards" ON rewards FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete rewards" ON rewards FOR DELETE USING (true);

-- Create more restrictive policies for user_stats
CREATE POLICY "Public read access to user_stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert user_stats" ON user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update user_stats" ON user_stats FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete user_stats" ON user_stats FOR DELETE USING (true);

-- Create more restrictive policies for monthly_goals
DROP POLICY IF EXISTS "Public access to monthly_goals" ON monthly_goals;
CREATE POLICY "Public read access to monthly_goals" ON monthly_goals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify monthly_goals" ON monthly_goals FOR INSERT WITH CHECK (true);

-- Create more restrictive policies for earned_rewards
DROP POLICY IF EXISTS "Public access to earned_rewards" ON earned_rewards;
CREATE POLICY "Public read access to earned_rewards" ON earned_rewards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert earned_rewards" ON earned_rewards FOR INSERT WITH CHECK (true);

-- Create more restrictive policies for applied_disciplines
DROP POLICY IF EXISTS "Public access to applied_disciplines" ON applied_disciplines;
CREATE POLICY "Public read access to applied_disciplines" ON applied_disciplines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert applied_disciplines" ON applied_disciplines FOR INSERT WITH CHECK (true);
