import {
  Discipline,
  Habit,
  HabitCompletion,
  Reminder,
  Reward,
  UserStats,
} from "@/lib/types";
import { USER_ID, isSupabaseConfigured } from "@/lib/supabase/config";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  createId,
  loadLocalDb,
  saveLocalDb,
  updateLocalStats,
} from "@/lib/local-db";

export type BackendMode = "supabase" | "local";

export type BackendStatus = {
  mode: BackendMode;
  message: string | null;
  error: string | null;
};

let forcedLocal = !isSupabaseConfigured();
let lastError: string | null = null;
let lastMessage: string | null = isSupabaseConfigured()
  ? null
  : "Modo local: o Supabase não está configurado. Os dados ficam neste navegador.";

export function getBackendStatus(): BackendStatus {
  return {
    mode: forcedLocal || !isSupabaseConfigured() ? "local" : "supabase",
    message: lastMessage,
    error: lastError,
  };
}

function isPermissionError(error: { code?: string; message?: string }): boolean {
  const message = (error.message || "").toLowerCase();
  return (
    error.code === "42501" ||
    error.code === "PGRST301" ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not authorized")
  );
}

function isSchemaError(error: { code?: string; message?: string }): boolean {
  const message = (error.message || "").toLowerCase();
  return (
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("could not find the") ||
    message.includes("column")
  );
}

function formatBackendError(error: unknown): Error {
  if (error && typeof error === "object") {
    const err = error as { code?: string; message?: string };
    if (isSchemaError(err)) {
      return new Error(
        "O banco está com tabelas antigas. No Supabase SQL Editor, execute scripts/009-recreate-schema-for-app.sql",
      );
    }
    if (err.message) return new Error(err.message);
  }
  if (error instanceof Error) return error;
  return new Error("Erro ao acessar os dados.");
}

function isUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const message = String(
    typeof error === "object" && error !== null && "message" in error
      ? (error as { message?: string }).message
      : error,
  ).toLowerCase();

  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("paused") ||
    message.includes("fetch") ||
    message.includes("supabase não está configurado") ||
    message.includes("err_name_not_resolved") ||
    message.includes("load failed")
  );
}

function markLocalFallback(reason: string) {
  forcedLocal = true;
  lastMessage = reason;
}

function markPermissionError(message: string) {
  lastError = message;
}

async function withBackend<T>(
  supabaseOp: () => Promise<T>,
  localOp: () => T,
): Promise<T> {
  if (forcedLocal || !isSupabaseConfigured()) {
    return localOp();
  }

  try {
    return await supabaseOp();
  } catch (error) {
    const typed = error as { code?: string; message?: string };

    if (isPermissionError(typed)) {
      markLocalFallback(
        "O banco bloqueou escrita (RLS). Usando dados locais por enquanto. No Supabase, execute scripts/010-unlock-write-access.sql",
      );
      return localOp();
    }

    if (isSchemaError(typed)) {
      markLocalFallback(
        "O banco está com schema antigo. Usando dados locais. No Supabase, execute scripts/009-recreate-schema-for-app.sql",
      );
      return localOp();
    }

    if (isUnavailableError(error)) {
      markLocalFallback(
        "Não foi possível conectar ao Supabase (projeto pausado ou offline). Usando dados locais deste navegador.",
      );
      return localOp();
    }

    lastError =
      error instanceof Error ? error.message : "Erro ao acessar os dados.";
    throw formatBackendError(error);
  }
}

function throwIf(error: { message?: string } | null) {
  if (error) {
    throw error;
  }
}

export async function fetchHabits(): Promise<Habit[]> {
  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", USER_ID)
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      throwIf(error);
      return data || [];
    },
    () => loadLocalDb().habits.filter((habit) => habit.is_active),
  );
}

export async function fetchCompletions(
  year: number,
  month: number,
): Promise<HabitCompletion[]> {
  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const startOfMonth = new Date(year, month, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", USER_ID)
        .gte("completed_at", startOfMonth.toISOString())
        .lte("completed_at", endOfMonth.toISOString())
        .order("completed_at", { ascending: false });
      throwIf(error);
      return data || [];
    },
    () => {
      const start = new Date(year, month, 1).getTime();
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      return loadLocalDb().completions.filter((item) => {
        const time = new Date(item.completed_at).getTime();
        return time >= start && time <= end;
      });
    },
  );
}

export async function fetchStats(): Promise<UserStats | null> {
  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", USER_ID)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    () => loadLocalDb().stats,
  );
}

export async function fetchRewards(): Promise<Reward[]> {
  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: false });
      throwIf(error);
      return data || [];
    },
    () => loadLocalDb().rewards,
  );
}

export async function fetchDisciplines(): Promise<Discipline[]> {
  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("disciplines")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: false });
      throwIf(error);
      return data || [];
    },
    () => loadLocalDb().disciplines,
  );
}

export async function ensureUserStats(): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", USER_ID)
        .single();

      if (!data) {
        const { error } = await supabase.from("user_stats").insert({
          user_id: USER_ID,
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          total_completions: 0,
          total_habits: 0,
        });
        throwIf(error);
      }
    },
    () => {
      const db = loadLocalDb();
      if (!db.stats) {
        saveLocalDb(updateLocalStats(db, {}));
      }
    },
  );
}

export async function createHabit(habit: Partial<Habit>): Promise<void> {
  const payload = {
    name: habit.name,
    description: habit.description ?? null,
    icon: habit.icon || "target",
    color: habit.color || "#10b981",
    frequency: habit.frequency || "daily",
    target_count: habit.target_count || 1,
    is_active: true,
    user_id: USER_ID,
  };

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("habits").insert(payload);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.habits.push({
        id: createId(),
        created_at: new Date().toISOString(),
        ...payload,
      } as Habit);
      updateLocalStats(db, {
        total_habits: (db.stats?.total_habits || 0) + 1,
      });
      saveLocalDb(db);
    },
  );
}

export async function updateHabit(habit: Partial<Habit>): Promise<void> {
  if (!habit.id) return;

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("habits")
        .update({ name: habit.name })
        .eq("id", habit.id);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.habits = db.habits.map((item) =>
        item.id === habit.id ? { ...item, name: habit.name || item.name } : item,
      );
      saveLocalDb(db);
    },
  );
}

export async function deleteHabit(habitId: string): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("habits")
        .update({ is_active: false })
        .eq("id", habitId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.habits = db.habits.map((item) =>
        item.id === habitId ? { ...item, is_active: false } : item,
      );
      updateLocalStats(db, {
        total_habits: Math.max((db.stats?.total_habits || 1) - 1, 0),
      });
      saveLocalDb(db);
    },
  );
}

export async function insertCompletion(
  habitId: string,
  completedAt: string,
): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("habit_completions").insert({
        habit_id: habitId,
        user_id: USER_ID,
        completed_at: completedAt,
      });
      if (error && (error.code === "23505" || error.message.includes("duplicate"))) {
        return;
      }
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      const day = completedAt.split("T")[0];
      const exists = db.completions.some(
        (item) =>
          item.habit_id === habitId && item.completed_at.split("T")[0] === day,
      );
      if (exists) return;

      db.completions.push({
        id: createId(),
        habit_id: habitId,
        user_id: USER_ID,
        completed_at: completedAt,
        notes: null,
      });
      saveLocalDb(db);
    },
  );
}

export async function deleteCompletions(ids: string[]): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      for (const id of ids) {
        const { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("id", id);
        throwIf(error);
      }
    },
    () => {
      const db = loadLocalDb();
      db.completions = db.completions.filter((item) => !ids.includes(item.id));
      saveLocalDb(db);
    },
  );
}

export async function updateStats(patch: Partial<UserStats>): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("user_stats")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", USER_ID);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      updateLocalStats(db, patch);
      saveLocalDb(db);
    },
  );
}

export async function createReward(reward: Partial<Reward>): Promise<void> {
  const payload = {
    name: reward.name,
    description: reward.description ?? null,
    icon: reward.icon || "gift",
    points_required: reward.points_required ?? 100,
    is_claimed: false,
    claimed_at: null,
    user_id: USER_ID,
  };

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("rewards").insert(payload);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.rewards.unshift({
        id: createId(),
        created_at: new Date().toISOString(),
        ...payload,
      } as Reward);
      saveLocalDb(db);
    },
  );
}

export async function updateReward(
  rewardId: string,
  reward: Partial<Reward>,
): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("rewards")
        .update({
          name: reward.name,
          description: reward.description,
          icon: reward.icon,
          points_required: reward.points_required,
        })
        .eq("id", rewardId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.rewards = db.rewards.map((item) =>
        item.id === rewardId ? { ...item, ...reward } : item,
      );
      saveLocalDb(db);
    },
  );
}

export async function deleteReward(rewardId: string): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("rewards").delete().eq("id", rewardId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.rewards = db.rewards.filter((item) => item.id !== rewardId);
      saveLocalDb(db);
    },
  );
}

export async function claimReward(rewardId: string): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("rewards")
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", rewardId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.rewards = db.rewards.map((item) =>
        item.id === rewardId
          ? { ...item, is_claimed: true, claimed_at: new Date().toISOString() }
          : item,
      );
      saveLocalDb(db);
    },
  );
}

export async function createDiscipline(
  discipline: Partial<Discipline>,
): Promise<void> {
  const payload = {
    name: discipline.name,
    description: discipline.description ?? null,
    penalty_type: discipline.penalty_type || "points",
    penalty_value: discipline.penalty_value ?? 0,
    triggered_at: null,
    goal_id: discipline.goal_id ?? null,
    user_id: USER_ID,
  };

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("disciplines").insert(payload);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.disciplines.unshift({
        id: createId(),
        created_at: new Date().toISOString(),
        ...payload,
      } as Discipline);
      saveLocalDb(db);
    },
  );
}

export async function updateDiscipline(
  disciplineId: string,
  discipline: Partial<Discipline>,
): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("disciplines")
        .update({
          name: discipline.name,
          description: discipline.description,
          penalty_type: discipline.penalty_type,
          penalty_value: discipline.penalty_value,
        })
        .eq("id", disciplineId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.disciplines = db.disciplines.map((item) =>
        item.id === disciplineId ? { ...item, ...discipline } : item,
      );
      saveLocalDb(db);
    },
  );
}

export async function deleteDiscipline(disciplineId: string): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("disciplines")
        .delete()
        .eq("id", disciplineId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.disciplines = db.disciplines.filter((item) => item.id !== disciplineId);
      saveLocalDb(db);
    },
  );
}

export async function triggerDiscipline(disciplineId: string): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("disciplines")
        .update({ triggered_at: new Date().toISOString() })
        .eq("id", disciplineId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.disciplines = db.disciplines.map((item) =>
        item.id === disciplineId
          ? { ...item, triggered_at: new Date().toISOString() }
          : item,
      );
      saveLocalDb(db);
    },
  );
}

export async function resetPoints(): Promise<void> {
  await updateStats({
    total_points: 0,
    current_streak: 0,
  });
}

export async function fetchReminders(): Promise<Reminder[]> {
  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: false });
      throwIf(error);
      return data || [];
    },
    () => loadLocalDb().reminders,
  );
}

export async function createReminder(reminder: Partial<Reminder>): Promise<void> {
  const payload = {
    title: reminder.title,
    notes: reminder.notes ?? null,
    is_completed: false,
    completed_at: null,
    user_id: USER_ID,
  };

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("reminders").insert(payload);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.reminders.unshift({
        id: createId(),
        created_at: new Date().toISOString(),
        ...payload,
      } as Reminder);
      saveLocalDb(db);
    },
  );
}

export async function completeReminder(reminderId: string): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("reminders")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", reminderId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.reminders = db.reminders.map((item) =>
        item.id === reminderId
          ? {
              ...item,
              is_completed: true,
              completed_at: new Date().toISOString(),
            }
          : item,
      );
      saveLocalDb(db);
    },
  );
}

export async function uncompleteReminder(reminderId: string): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("reminders")
        .update({
          is_completed: false,
          completed_at: null,
        })
        .eq("id", reminderId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.reminders = db.reminders.map((item) =>
        item.id === reminderId
          ? { ...item, is_completed: false, completed_at: null }
          : item,
      );
      saveLocalDb(db);
    },
  );
}

export async function deleteReminder(reminderId: string): Promise<void> {
  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb();
      db.reminders = db.reminders.filter((item) => item.id !== reminderId);
      saveLocalDb(db);
    },
  );
}
