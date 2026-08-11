import {
  Discipline,
  Habit,
  HabitCompletion,
  Reward,
  UserStats,
} from "@/lib/types";
import { USER_ID } from "@/lib/supabase/config";

const STORAGE_KEY = "mytaskflow-db-v1";

export type LocalDatabase = {
  habits: Habit[];
  completions: HabitCompletion[];
  stats: UserStats | null;
  rewards: Reward[];
  disciplines: Discipline[];
};

function emptyDb(): LocalDatabase {
  return {
    habits: [],
    completions: [],
    stats: {
      id: "local-stats",
      user_id: USER_ID,
      total_points: 0,
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      total_habits: 0,
      updated_at: new Date().toISOString(),
    },
    rewards: [],
    disciplines: [],
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadLocalDb(): LocalDatabase {
  if (!canUseStorage()) return emptyDb();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    const fallback = emptyDb();
    return {
      habits: parsed.habits ?? [],
      completions: parsed.completions ?? [],
      stats: parsed.stats ?? fallback.stats,
      rewards: parsed.rewards ?? [],
      disciplines: parsed.disciplines ?? [],
    };
  } catch {
    return emptyDb();
  }
}

export function saveLocalDb(db: LocalDatabase): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function updateLocalStats(
  db: LocalDatabase,
  patch: Partial<UserStats>,
): LocalDatabase {
  const current = db.stats ?? emptyDb().stats!;
  db.stats = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return db;
}
