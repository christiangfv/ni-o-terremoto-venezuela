export const dynamic = "force-dynamic";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentProfile } from "@/lib/services/auth-service";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  return (
    <ProtectedRoute roles={["admin", "organizacion", "voluntario", "salud_albergue"]}>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard privado</h1>
            <p className="mt-3 text-slate-600">Acceso solo para usuarios aprobados. Rol actual: {profile?.role ?? "sin perfil"}.</p>
          </div>
          <LogoutButton />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <a className="rounded-2xl bg-white p-6 shadow-sm" href="/casos">Casos</a>
          <a className="rounded-2xl bg-white p-6 shadow-sm" href="/reportes">Reportes</a>
          <a className="rounded-2xl bg-white p-6 shadow-sm" href="/usuarios">Usuarios</a>
        </div>
      </main>
    </ProtectedRoute>
  );
}
