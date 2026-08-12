import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const userId = user.id;

    await supabase.from("habit_completions").delete().eq("user_id", userId);
    await supabase.from("rewards").delete().eq("user_id", userId);
    await supabase.from("disciplines").delete().eq("user_id", userId);
    await supabase.from("reminders").delete().eq("user_id", userId);
    await supabase.from("habits").delete().eq("user_id", userId);

    await supabase
      .from("user_stats")
      .update({
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        total_habits: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      message: "Dados resetados com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao resetar dados:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
