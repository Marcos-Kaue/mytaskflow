-- Drop existing tables if they exist
drop table if exists habit_completions cascade;
drop table if exists habits cascade;
drop table if exists user_stats cascade;
drop table if exists rewards cascade;
drop table if exists disciplines cascade;

-- Habits table
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  description text,
  icon text default 'target',
  color text default '#10b981',
  frequency text default 'daily',
  target_count integer default 1,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Habit completions (daily tracking)
create table habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id text not null,
  completed_at timestamptz not null default now(),
  notes text
);

-- User stats (for gamification)
create table user_stats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  total_points integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  total_completions integer default 0,
  total_habits integer default 0,
  updated_at timestamptz default now()
);

-- Rewards (when completing monthly goals)
create table rewards (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  description text,
  icon text default 'gift',
  points_required integer default 100,
  is_claimed boolean default false,
  claimed_at timestamptz,
  created_at timestamptz default now()
);

-- Disciplines (penalties for not meeting goals)
create table disciplines (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  description text,
  penalty_type text default 'points',
  penalty_value integer default 0,
  triggered_at timestamptz,
  goal_id uuid,
  created_at timestamptz default now()
);

-- Disable Row Level Security for demo mode
alter table habits disable row level security;
alter table habit_completions disable row level security;
alter table user_stats disable row level security;
alter table rewards disable row level security;
alter table disciplines disable row level security;
