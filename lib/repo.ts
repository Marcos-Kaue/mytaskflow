import {
  Discipline,
  Habit,
  HabitCompletion,
  Reminder,
  Reward,
  UserStats,
} from "@/lib/types";
import { LOCAL_USER_ID, isSupabaseConfigured } from "@/lib/supabase/config";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  createId,
  clearLocalDb,
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
      throw new Error(
        "Sem permissão no banco. Faça login novamente e execute scripts/014-secure-rls-by-user.sql no Supabase se ainda não rodou.",
      );
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


let cachedUserId: string | null = null;

async function requireUserId(): Promise<string> {
  if (!isSupabaseConfigured()) {
    return LOCAL_USER_ID;
  }

  if (forcedLocal && cachedUserId) {
    return cachedUserId;
  }

  const supabase = createBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Faça login para continuar.");
  }

  cachedUserId = user.id;
  return user.id;
}

function throwIf(error: { message?: string } | null) {
  if (error) {
    throw error;
  }
}

export async function fetchHabits(): Promise<Habit[]> {
  const userId = await requireUserId();

  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      throwIf(error);
      return (data || [])
        .map((item: Habit) => ({
          ...item,
          counts_for_points: item.counts_for_points !== false,
          sort_order: item.sort_order ?? 0,
        }))
        .sort(
          (a: Habit, b: Habit) =>
            a.sort_order - b.sort_order ||
            a.created_at.localeCompare(b.created_at),
        );
    },
    () =>
      loadLocalDb(userId)
        .habits.filter((habit) => habit.is_active)
        .sort(
          (a, b) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
            a.created_at.localeCompare(b.created_at),
        ),
  );
}

export async function fetchCompletions(
  year: number,
  month: number,
): Promise<HabitCompletion[]> {
  const userId = await requireUserId();

  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const startOfMonth = new Date(year, month, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId)
        .gte("completed_at", startOfMonth.toISOString())
        .lte("completed_at", endOfMonth.toISOString())
        .order("completed_at", { ascending: false });
      throwIf(error);
      return data || [];
    },
    () => {
      const start = new Date(year, month, 1).getTime();
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      return loadLocalDb(userId).completions.filter((item) => {
        const time = new Date(item.completed_at).getTime();
        return time >= start && time <= end;
      });
    },
  );
}

export async function fetchStats(): Promise<UserStats | null> {
  const userId = await requireUserId();

  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    () => loadLocalDb(userId).stats,
  );
}

export async function fetchRewards(): Promise<Reward[]> {
  const userId = await requireUserId();

  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      throwIf(error);
      return data || [];
    },
    () => loadLocalDb(userId).rewards,
  );
}

export async function fetchDisciplines(): Promise<Discipline[]> {
  const userId = await requireUserId();

  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("disciplines")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      throwIf(error);
      return (data || []).map((item: Discipline) => ({
        ...item,
        deadline_at: item.deadline_at ?? null,
        target_points: item.target_points ?? 0,
        fulfilled_at: item.fulfilled_at ?? null,
      }));
    },
    () => loadLocalDb(userId).disciplines,
  );
}

export async function ensureUserStats(): Promise<void> {
  const userId = await requireUserId();

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!data) {
        const { error } = await supabase.from("user_stats").insert({
          user_id: userId,
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
      const db = loadLocalDb(userId);
      if (!db.stats) {
        saveLocalDb(updateLocalStats(db, {}), userId);
      }
    },
  );
}

export async function createHabit(habit: Partial<Habit>): Promise<void> {
  const userId = await requireUserId();

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error: orderError } = await supabase
        .from("habits")
        .select("sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: false })
        .limit(1);
      throwIf(orderError);
      const nextSortOrder =
        ((data?.[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1;

      const payload = {
        name: habit.name,
        description: habit.description ?? null,
        icon: habit.icon || "target",
        color: habit.color || "#10b981",
        frequency: habit.frequency || "daily",
        target_count: habit.target_count || 1,
        counts_for_points: habit.counts_for_points !== false,
        sort_order: habit.sort_order ?? nextSortOrder,
        is_active: true,
        user_id: userId,
      };

      const { error } = await supabase.from("habits").insert(payload);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      const max = db.habits.reduce(
        (acc, item) => Math.max(acc, item.sort_order ?? 0),
        -1,
      );
      const payload = {
        name: habit.name,
        description: habit.description ?? null,
        icon: habit.icon || "target",
        color: habit.color || "#10b981",
        frequency: habit.frequency || "daily",
        target_count: habit.target_count || 1,
        counts_for_points: habit.counts_for_points !== false,
        sort_order: habit.sort_order ?? max + 1,
        is_active: true,
        user_id: userId,
      };
      db.habits.push({
        id: createId(),
        created_at: new Date().toISOString(),
        ...payload,
      } as Habit);
      updateLocalStats(db, {
        total_habits: (db.stats?.total_habits || 0) + 1,
      });
      saveLocalDb(db, userId);
    },
  );
}

export async function updateHabit(habit: Partial<Habit>): Promise<void> {
  const userId = await requireUserId();

  if (!habit.id) return;

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const updates: Partial<Habit> = {};
      if (habit.name !== undefined) updates.name = habit.name;
      if (habit.counts_for_points !== undefined) {
        updates.counts_for_points = habit.counts_for_points;
      }
      const { error } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", habit.id)
        .eq("user_id", userId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      db.habits = db.habits.map((item) =>
        item.id === habit.id
          ? {
              ...item,
              name: habit.name || item.name,
              counts_for_points:
                habit.counts_for_points !== undefined
                  ? habit.counts_for_points
                  : item.counts_for_points,
            }
          : item,
      );
      saveLocalDb(db, userId);
    },
  );
}

export async function reorderHabits(orderedIds: string[]): Promise<void> {
  const userId = await requireUserId();
  if (orderedIds.length === 0) return;

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const updates = orderedIds.map((id, index) =>
        supabase
          .from("habits")
          .update({ sort_order: index })
          .eq("id", id)
          .eq("user_id", userId),
      );
      const results = await Promise.all(updates);
      results.forEach(({ error }) => throwIf(error));
    },
    () => {
      const db = loadLocalDb(userId);
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      db.habits = db.habits.map((item) =>
        orderMap.has(item.id)
          ? { ...item, sort_order: orderMap.get(item.id)! }
          : item,
      );
      saveLocalDb(db, userId);
    },
  );
}

export async function deleteOwnAccount(): Promise<{ authDeleted: boolean }> {
  const userId = await requireUserId();

  if (getBackendStatus().mode === "local" || !isSupabaseConfigured()) {
    clearLocalDb(userId);
    return { authDeleted: true };
  }

  const supabase = createBrowserClient();
  const { error } = await supabase.rpc("delete_own_account");

  if (!error) {
    clearLocalDb(userId);
    return { authDeleted: true };
  }

  const missingFn =
    /function|could not find|schema cache/i.test(error.message || "");

  await supabase.from("habit_completions").delete().eq("user_id", userId);
  await supabase.from("rewards").delete().eq("user_id", userId);
  await supabase.from("disciplines").delete().eq("user_id", userId);
  await supabase.from("reminders").delete().eq("user_id", userId);
  await supabase.from("habits").delete().eq("user_id", userId);
  await supabase.from("user_stats").delete().eq("user_id", userId);
  clearLocalDb(userId);

  if (!missingFn) {
    throw new Error(error.message);
  }

  return { authDeleted: false };
}

export async function deleteHabit(habitId: string): Promise<void> {
  const userId = await requireUserId();

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("habits")
        .update({ is_active: false })
        .eq("id", habitId)
        .eq("user_id", userId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      db.habits = db.habits.map((item) =>
        item.id === habitId ? { ...item, is_active: false } : item,
      );
      updateLocalStats(db, {
        total_habits: Math.max((db.stats?.total_habits || 1) - 1, 0),
      });
      saveLocalDb(db, userId);
    },
  );
}

export async function insertCompletion(
  habitId: string,
  completedAt: string,
): Promise<void> {
  const userId = await requireUserId();

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("habit_completions").insert({
        habit_id: habitId,
        user_id: userId,
        completed_at: completedAt,
      });
      if (error && (error.code === "23505" || error.message.includes("duplicate"))) {
        return;
      }
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      const day = completedAt.split("T")[0];
      const exists = db.completions.some(
        (item) =>
          item.habit_id === habitId && item.completed_at.split("T")[0] === day,
      );
      if (exists) return;

      db.completions.push({
        id: createId(),
        habit_id: habitId,
        user_id: userId,
        completed_at: completedAt,
        notes: null,
      });
      saveLocalDb(db, userId);
    },
  );
}

export async function deleteCompletions(ids: string[]): Promise<void> {
  const userId = await requireUserId();

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
      const db = loadLocalDb(userId);
      db.completions = db.completions.filter((item) => !ids.includes(item.id));
      saveLocalDb(db, userId);
    },
  );
}

export async function updateStats(patch: Partial<UserStats>): Promise<void> {
  const userId = await requireUserId();

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("user_stats")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      updateLocalStats(db, patch);
      saveLocalDb(db, userId);
    },
  );
}

export async function createReward(reward: Partial<Reward>): Promise<void> {
  const userId = await requireUserId();

  const payload = {
    name: reward.name,
    description: reward.description ?? null,
    icon: reward.icon || "gift",
    points_required: reward.points_required ?? 100,
    is_claimed: false,
    claimed_at: null,
    user_id: userId,
  };

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("rewards").insert(payload);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      db.rewards.unshift({
        id: createId(),
        created_at: new Date().toISOString(),
        ...payload,
      } as Reward);
      saveLocalDb(db, userId);
    },
  );
}

export async function updateReward(
  rewardId: string,
  reward: Partial<Reward>,
): Promise<void> {
  const userId = await requireUserId();

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
      const db = loadLocalDb(userId);
      db.rewards = db.rewards.map((item) =>
        item.id === rewardId ? { ...item, ...reward } : item,
      );
      saveLocalDb(db, userId);
    },
  );
}

export async function deleteReward(rewardId: string): Promise<void> {
  const userId = await requireUserId();

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("rewards").delete().eq("id", rewardId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      db.rewards = db.rewards.filter((item) => item.id !== rewardId);
      saveLocalDb(db, userId);
    },
  );
}

export async function claimReward(rewardId: string): Promise<void> {
  const userId = await requireUserId();

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
      const db = loadLocalDb(userId);
      db.rewards = db.rewards.map((item) =>
        item.id === rewardId
          ? { ...item, is_claimed: true, claimed_at: new Date().toISOString() }
          : item,
      );
      saveLocalDb(db, userId);
    },
  );
}

export async function createDiscipline(
  discipline: Partial<Discipline>,
): Promise<void> {
  const userId = await requireUserId();

  const payload = {
    name: discipline.name,
    description: discipline.description ?? null,
    penalty_type: discipline.penalty_type || "points",
    penalty_value: discipline.penalty_value ?? 0,
    triggered_at: null,
    goal_id: discipline.goal_id ?? null,
    deadline_at: discipline.deadline_at ?? null,
    target_points: discipline.target_points ?? 0,
    fulfilled_at: null,
    user_id: userId,
  };

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("disciplines").insert(payload);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      db.disciplines.unshift({
        id: createId(),
        created_at: new Date().toISOString(),
        ...payload,
      } as Discipline);
      saveLocalDb(db, userId);
    },
  );
}

export async function updateDiscipline(
  disciplineId: string,
  discipline: Partial<Discipline>,
): Promise<void> {
  const userId = await requireUserId();

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
          deadline_at: discipline.deadline_at,
          target_points: discipline.target_points,
        })
        .eq("id", disciplineId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      db.disciplines = db.disciplines.map((item) =>
        item.id === disciplineId ? { ...item, ...discipline } : item,
      );
      saveLocalDb(db, userId);
    },
  );
}

export async function deleteDiscipline(disciplineId: string): Promise<void> {
  const userId = await requireUserId();

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
      const db = loadLocalDb(userId);
      db.disciplines = db.disciplines.filter((item) => item.id !== disciplineId);
      saveLocalDb(db, userId);
    },
  );
}

export async function triggerDiscipline(disciplineId: string): Promise<void> {
  const userId = await requireUserId();

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
      const db = loadLocalDb(userId);
      db.disciplines = db.disciplines.map((item) =>
        item.id === disciplineId
          ? { ...item, triggered_at: new Date().toISOString() }
          : item,
      );
      saveLocalDb(db, userId);
    },
  );
}

export async function fulfillDiscipline(disciplineId: string): Promise<void> {
  const userId = await requireUserId();

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("disciplines")
        .update({ fulfilled_at: new Date().toISOString() })
        .eq("id", disciplineId);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      db.disciplines = db.disciplines.map((item) =>
        item.id === disciplineId
          ? { ...item, fulfilled_at: new Date().toISOString() }
          : item,
      );
      saveLocalDb(db, userId);
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
  const userId = await requireUserId();

  return withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      throwIf(error);
      return (data || []).map((item: Reminder) => ({
        ...item,
        due_at: item.due_at ?? null,
      }));
    },
    () => loadLocalDb(userId).reminders,
  );
}

export async function createReminder(reminder: Partial<Reminder>): Promise<void> {
  const userId = await requireUserId();

  const payload = {
    title: reminder.title,
    notes: reminder.notes ?? null,
    due_at: reminder.due_at ?? null,
    is_completed: false,
    completed_at: null,
    user_id: userId,
  };

  await withBackend(
    async () => {
      const supabase = createBrowserClient();
      const { error } = await supabase.from("reminders").insert(payload);
      throwIf(error);
    },
    () => {
      const db = loadLocalDb(userId);
      db.reminders.unshift({
        id: createId(),
        created_at: new Date().toISOString(),
        ...payload,
      } as Reminder);
      saveLocalDb(db, userId);
    },
  );
}

export async function completeReminder(reminderId: string): Promise<void> {
  const userId = await requireUserId();

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
      const db = loadLocalDb(userId);
      db.reminders = db.reminders.map((item) =>
        item.id === reminderId
          ? {
              ...item,
              is_completed: true,
              completed_at: new Date().toISOString(),
            }
          : item,
      );
      saveLocalDb(db, userId);
    },
  );
}

export async function uncompleteReminder(reminderId: string): Promise<void> {
  const userId = await requireUserId();

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
      const db = loadLocalDb(userId);
      db.reminders = db.reminders.map((item) =>
        item.id === reminderId
          ? { ...item, is_completed: false, completed_at: null }
          : item,
      );
      saveLocalDb(db, userId);
    },
  );
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const userId = await requireUserId();

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
      const db = loadLocalDb(userId);
      db.reminders = db.reminders.filter((item) => item.id !== reminderId);
      saveLocalDb(db, userId);
    },
  );
}
