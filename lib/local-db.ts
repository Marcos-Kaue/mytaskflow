import {
  Discipline,
  Habit,
  HabitCompletion,
  Reminder,
  Reward,
  UserStats,
} from "@/lib/types";
import { LOCAL_USER_ID } from "@/lib/supabase/config";

const STORAGE_PREFIX = "mytaskflow-db-v1";

export type LocalDatabase = {
  habits: Habit[];
  completions: HabitCompletion[];
  stats: UserStats | null;
  rewards: Reward[];
  disciplines: Discipline[];
  reminders: Reminder[];
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function emptyDb(userId: string = LOCAL_USER_ID): LocalDatabase {
  return {
    habits: [],
    completions: [],
    stats: {
      id: "local-stats",
      user_id: userId,
      total_points: 0,
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      total_habits: 0,
      updated_at: new Date().toISOString(),
    },
    rewards: [],
    disciplines: [],
    reminders: [],
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadLocalDb(userId: string = LOCAL_USER_ID): LocalDatabase {
  if (!canUseStorage()) return emptyDb(userId);

  try {
    const raw =
      localStorage.getItem(storageKey(userId)) ||
      (userId === LOCAL_USER_ID ? localStorage.getItem("mytaskflow-db-v1") : null);
    if (!raw) return emptyDb(userId);
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    const fallback = emptyDb(userId);
    return {
      habits: (parsed.habits ?? []).map((item, index) => ({
        ...item,
        counts_for_points: item.counts_for_points !== false,
        sort_order: item.sort_order ?? index,
      })),
      completions: parsed.completions ?? [],
      stats: parsed.stats ?? fallback.stats,
      rewards: parsed.rewards ?? [],
      disciplines: (parsed.disciplines ?? []).map((item) => ({
        ...item,
        deadline_at: item.deadline_at ?? null,
        target_points: item.target_points ?? 0,
        fulfilled_at: item.fulfilled_at ?? null,
      })),
      reminders: (parsed.reminders ?? []).map((item) => ({
        ...item,
        due_at: item.due_at ?? null,
        due_time: item.due_time ?? null,
        icon: item.icon || '📝',
      })),
    };
  } catch {
    return emptyDb(userId);
  }
}

export function saveLocalDb(
  db: LocalDatabase,
  userId: string = LOCAL_USER_ID,
): void {
  if (!canUseStorage()) return;
  localStorage.setItem(storageKey(userId), JSON.stringify(db));
}

export function clearLocalDb(userId: string = LOCAL_USER_ID): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(storageKey(userId));
  if (userId === LOCAL_USER_ID) {
    localStorage.removeItem("mytaskflow-db-v1");
  }
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
