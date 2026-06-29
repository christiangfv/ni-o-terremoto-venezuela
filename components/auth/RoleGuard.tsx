import type { ReactNode } from "react";
import { getCurrentProfile, isRoleAllowed } from "@/lib/services/auth-service";
import type { UserRole } from "@/lib/types/domain";

export async function RoleGuard({ children, roles, fallback = null }: { children: ReactNode; roles: UserRole[]; fallback?: ReactNode }) {
  const profile = await getCurrentProfile();
  if (!isRoleAllowed(profile, roles)) return <>{fallback}</>;
  return <>{children}</>;
}
