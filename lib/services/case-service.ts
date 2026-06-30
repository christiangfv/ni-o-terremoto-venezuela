import { createClient } from "@/lib/supabase/server";
import type { Case, CaseEvent, CasePhoto, PublicCase } from "@/lib/types/domain";
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

export async function listCasePhotos(caseId: string) {
  const supabase = await createClient();
  // RLS (case_photos_select_case_access) gates this to users who can access the case.
  return supabase
    .from("case_photos")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .returns<CasePhoto[]>();
}

function safeFileName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const sanitized = trimmed
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return sanitized.length > 0 ? sanitized : "archivo";
}

export async function uploadCasePhoto({
  caseId,
  file,
  isPublicPreview = false
}: {
  caseId: string;
  file: File;
  isPublicPreview?: boolean;
}): Promise<{ data: CasePhoto | null; error: Error | null }> {
  const bucketId = "case-photos-private";
  const path = `${caseId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const supabase = await createClient();

  // RLS (storage ntv_case_photos_insert) gates the upload to users who can access the case.
  const { error: uploadError } = await supabase.storage.from(bucketId).upload(path, file, { upsert: false });
  if (uploadError) {
    return { data: null, error: uploadError };
  }

  // RLS (case_photos_insert_case_access) gates the row insert the same way.
  const { data, error } = await supabase
    .from("case_photos")
    .insert({ case_id: caseId, bucket_id: bucketId, storage_path: path, is_public_preview: isPublicPreview })
    .select("*")
    .single<CasePhoto>();

  return { data, error };
}
