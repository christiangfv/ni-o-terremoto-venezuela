import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/services/auth-service";
import type { UserRole } from "@/lib/types/domain";

export async function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { allowed } = await requireApprovedUser(roles);
  if (!allowed) redirect("/?auth=required");
  return <>{children}</>;
}
