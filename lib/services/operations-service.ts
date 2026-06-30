import { createClient } from "@/lib/supabase/server";
import type { Handover, Transfer } from "@/lib/types/domain";
import { handoverSchema, transferSchema } from "@/lib/validation/schemas";

export async function createHandover(input: unknown) {
  const parsed = handoverSchema.parse(input);
  const supabase = await createClient();
  return supabase.from("handovers").insert(parsed).select("*").single();
}

export async function createTransfer(input: unknown) {
  const parsed = transferSchema.parse(input);
  const supabase = await createClient();
  return supabase.from("transfers").insert(parsed).select("*").single();
}

export async function listHandovers(caseId: string) {
  const supabase = await createClient();
  // RLS (handovers_select_secure_roles) gates this to admins and same-org secure roles.
  return supabase
    .from("handovers")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .returns<Handover[]>();
}

export async function listTransfers(caseId: string) {
  const supabase = await createClient();
  // RLS (transfers_select_secure_roles) gates this to admins and same-org secure roles.
  return supabase
    .from("transfers")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .returns<Transfer[]>();
}
