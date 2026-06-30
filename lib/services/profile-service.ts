import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/services/auth-service";
import type { Profile, ProfileWithOrg } from "@/lib/types/domain";
import { createUserSchema, userUpdateSchema } from "@/lib/validation/schemas";

export async function listProfiles() {
  const supabase = await createClient();
  // RLS (profiles_select_self_or_admin_or_org_admin): admins see all profiles.
  return supabase
    .from("profiles")
    .select("*, organizations(name)")
    .order("created_at", { ascending: false })
    .returns<ProfileWithOrg[]>();
}

export async function createTeamUser(input: unknown) {
  const parsed = createUserSchema.parse(input);
  // Only an approved admin may create team members.
  const admin = await requireAdmin();

  const service = createServiceRoleClient();

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.full_name }
  });

  if (createError || !created?.user) {
    // e.g. email already exists.
    return { data: null, error: createError ?? new Error("No se pudo crear el usuario") };
  }

  const newUserId = created.user.id;

  // The on_auth_user_created trigger inserts a publico/unapproved profile.
  // Promote it to the requested role/organization and approve it in a single
  // update (role and approved change together, satisfying the
  // profiles_approved_requires_non_public_role constraint).
  const { data, error } = await service
    .from("profiles")
    .update({
      full_name: parsed.full_name,
      role: parsed.role,
      organization_id: parsed.organization_id ?? null,
      approved: true,
      approved_by: admin.id,
      approved_at: new Date().toISOString()
    })
    .eq("id", newUserId)
    .select("*")
    .single<Profile>();

  return { data, error };
}

export async function updateProfile(input: unknown) {
  const parsed = userUpdateSchema.parse(input);
  // Only an approved admin may modify profiles.
  const admin = await requireAdmin();

  const { id, role, organization_id, approved } = parsed;

  const patch: {
    role?: Profile["role"];
    organization_id?: string | null;
    approved?: boolean;
    approved_by?: string | null;
    approved_at?: string | null;
  } = {};

  if (role !== undefined) {
    patch.role = role;
  }
  if (organization_id !== undefined) {
    patch.organization_id = organization_id;
  }
  if (approved !== undefined) {
    patch.approved = approved;
    if (approved) {
      // Approving requires recording who approved it and when. The constraint
      // forbids approved=true with role='publico'; the assignable role schema
      // already excludes 'publico', so any role we set here is valid.
      patch.approved_by = admin.id;
      patch.approved_at = new Date().toISOString();
    } else {
      patch.approved_by = null;
      patch.approved_at = null;
    }
  }

  const supabase = await createClient();
  // RLS (profiles_update_admin) allows admins only.
  return supabase.from("profiles").update(patch).eq("id", id).select("*").single<Profile>();
}
