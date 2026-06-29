import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types/domain";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_current_profile");
  if (error) return null;
  return data as Profile | null;
}

export async function requireApprovedUser(roles?: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.approved) {
    return { profile: null, allowed: false };
  }
  if (roles && !roles.includes(profile.role)) {
    return { profile, allowed: false };
  }
  return { profile, allowed: true };
}

export function isRoleAllowed(profile: Profile | null, roles: UserRole[]) {
  return Boolean(profile?.approved && roles.includes(profile.role));
}
