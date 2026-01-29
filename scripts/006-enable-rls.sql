-- Enable RLS on all public tables
-- This fixes the security linter warnings

-- Enable RLS on habits
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Enable RLS on habit_completions
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on disciplines
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rewards
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Enable RLS on monthly_goals (if exists)
ALTER TABLE IF EXISTS monthly_goals ENABLE ROW LEVEL SECURITY;

-- Enable RLS on earned_rewards (if exists)
ALTER TABLE IF EXISTS earned_rewards ENABLE ROW LEVEL SECURITY;

-- Enable RLS on applied_disciplines (if exists)
ALTER TABLE IF EXISTS applied_disciplines ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('habits', 'habit_completions', 'disciplines', 'rewards', 'user_stats', 'monthly_goals', 'earned_rewards', 'applied_disciplines')
ORDER BY tablename;
