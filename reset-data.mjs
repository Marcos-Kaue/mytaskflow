import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://exrqykhndjxhvvhecicu.supabase.co";
const supabaseKey = "sb_publishable_mds_TUSNqPG9nyvg6RGP5Q_Xoii6e8m";
const supabase = createClient(supabaseUrl, supabaseKey);

const userId = "demo-user-001";

async function resetData() {
  try {
    console.log("Resetando dados para", userId);

    // Delete all data
    const { error: error1 } = await supabase
      .from("habit_completions")
      .delete()
      .eq("user_id", userId);
    if (error1) throw error1;
    console.log("✓ Completações de hábitos deletadas");

    const { error: error2 } = await supabase
      .from("rewards")
      .delete()
      .eq("user_id", userId);
    if (error2) throw error2;
    console.log("✓ Recompensas deletadas");

    const { error: error3 } = await supabase
      .from("disciplines")
      .delete()
      .eq("user_id", userId);
    if (error3) throw error3;
    console.log("✓ Disciplinas deletadas");

    const { error: error4 } = await supabase
      .from("habits")
      .delete()
      .eq("user_id", userId);
    if (error4) throw error4;
    console.log("✓ Hábitos deletados");

    // Reset user stats
    const { error: error5 } = await supabase
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
    if (error5) throw error5;
    console.log("✓ Estatísticas do usuário resetadas");

    console.log("\n✅ Todos os pontos e dados foram resetados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao resetar dados:", error);
    process.exit(1);
  }
}

resetData();
