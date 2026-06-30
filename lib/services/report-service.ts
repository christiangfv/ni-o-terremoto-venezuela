import { createClient } from "@/lib/supabase/server";
import type { PublicReport } from "@/lib/types/domain";
import { publicReportSchema, reportReviewSchema } from "@/lib/validation/schemas";

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

export async function reviewPublicReportById(input: unknown) {
  const parsed = reportReviewSchema.parse(input);
  const supabase = await createClient();
  // RLS (public_reports_update_moderators) gates this to admins and secure roles.
  return supabase
    .from("public_reports")
    .update({
      status: parsed.status,
      moderation_notes: parsed.moderation_notes ? parsed.moderation_notes : null,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", parsed.id)
    .select("*")
    .single<PublicReport>();
}
