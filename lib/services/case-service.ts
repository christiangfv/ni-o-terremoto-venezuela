import { createClient } from "@/lib/supabase/server";
import type { Case, CaseEvent, PublicCase } from "@/lib/types/domain";
import { caseCreateSchema, caseUpdateSchema, publicCaseCodeSchema } from "@/lib/validation/schemas";

export async function listCases() {
  const supabase = await createClient();
  return supabase.from("cases").select("*").order("updated_at", { ascending: false }).returns<Case[]>();
}

export async function getCase(id: string) {
  const supabase = await createClient();
  return supabase.from("cases").select("*").eq("id", id).single<Case>();
}

export async function getCaseEvents(caseId: string) {
  const supabase = await createClient();
  return supabase.from("case_events").select("*").eq("case_id", caseId).order("created_at", { ascending: false }).returns<CaseEvent[]>();
}

export async function createCase(input: unknown) {
  const parsed = caseCreateSchema.parse(input);
  const supabase = await createClient();
  return supabase.from("cases").insert(parsed).select("*").single<Case>();
}

export async function updateCase(input: unknown) {
  const parsed = caseUpdateSchema.parse(input);
  const { id, ...patch } = parsed;
  const supabase = await createClient();
  return supabase.from("cases").update(patch).eq("id", id).select("*").single<Case>();
}

export async function getPublicCaseByCode(code: string) {
  const parsedCode = publicCaseCodeSchema.parse(code);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_case_by_code", { p_public_code: parsedCode });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: (row ?? null) as PublicCase | null, error: null };
}
