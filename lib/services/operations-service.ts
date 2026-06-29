import { createClient } from "@/lib/supabase/server";
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
