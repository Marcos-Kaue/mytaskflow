-- Reset all data for demo-user-001
-- Delete all data
DELETE FROM habit_completions WHERE user_id = 'demo-user-001';
DELETE FROM rewards WHERE user_id = 'demo-user-001';
DELETE FROM disciplines WHERE user_id = 'demo-user-001';
DELETE FROM habits WHERE user_id = 'demo-user-001';

-- Reset user stats
UPDATE user_stats 
SET total_points = 0, 
    current_streak = 0, 
    longest_streak = 0,
    total_completions = 0,
    total_habits = 0,
    updated_at = NOW()
WHERE user_id = 'demo-user-001';
