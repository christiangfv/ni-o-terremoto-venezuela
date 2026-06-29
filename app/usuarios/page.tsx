export const dynamic = "force-dynamic";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function UsersPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <RoleGuard roles={["admin"]}>
          <p className="mt-3 text-slate-600">Pendiente UI de aprobación/cambio de rol. Backend ya exige aprobación y audita cambios.</p>
        </RoleGuard>
      </main>
    </ProtectedRoute>
  );
}
