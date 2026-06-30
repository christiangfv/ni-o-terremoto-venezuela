import { createClient } from "@/lib/supabase/server";
import { publicReportSchema } from "@/lib/validation/schemas";

export async function createPublicReport(input: unknown) {
  const parsed = publicReportSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("public_reports").insert({ ...parsed, status: "pendiente" });
  return { data: error ? null : { status: "pendiente" as const }, error };
}

export async function listModerationQueue() {
  const supabase = await createClient();
  return supabase.from("public_reports").select("*").order("created_at", { ascending: false });
}

export async function reviewPublicReport(id: string, status: "aprobado" | "rechazado" | "duplicado" | "en_revision", moderation_notes?: string) {
  const supabase = await createClient();
  return supabase
    .from("public_reports")
    .update({ status, moderation_notes, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
}
