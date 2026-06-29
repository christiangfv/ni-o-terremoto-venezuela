import { createClient } from "@/lib/supabase/server";

const PRIVATE_BUCKETS = new Set(["case-photos-private", "public-report-uploads", "handover-evidence-private"]);

export async function createSignedReadUrl(bucket: string, path: string, expiresInSeconds = 300) {
  if (!PRIVATE_BUCKETS.has(bucket)) {
    throw new Error("Unsupported bucket");
  }
  const supabase = await createClient();
  return supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
}

export function assertSafeUpload(file: File) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
  if (!allowed.has(file.type)) throw new Error("Formato no permitido");
  if (file.size > 5 * 1024 * 1024) throw new Error("Archivo excede 5MB");
}
