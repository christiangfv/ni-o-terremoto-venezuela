import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@/lib/types/domain";
import { organizationSchema, organizationUpdateSchema } from "@/lib/validation/schemas";

export async function listOrganizations() {
  const supabase = await createClient();
  return supabase.from("organizations").select("*").order("name", { ascending: true }).returns<Organization[]>();
}

export async function getOrganization(id: string) {
  const supabase = await createClient();
  return supabase.from("organizations").select("*").eq("id", id).single<Organization>();
}

export async function createOrganization(input: unknown) {
  const parsed = organizationSchema.parse(input);
  const supabase = await createClient();
  // RLS (organizations_insert_admin) allows admins only.
  return supabase.from("organizations").insert(parsed).select("*").single<Organization>();
}

export async function updateOrganization(input: unknown) {
  const parsed = organizationUpdateSchema.parse(input);
  const { id, ...patch } = parsed;
  const supabase = await createClient();
  // RLS (organizations_update_admin) allows admins only.
  return supabase.from("organizations").update(patch).eq("id", id).select("*").single<Organization>();
}
