export const dynamic = "force-dynamic";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppNav } from "@/components/layout/AppNav";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { UserAdminControls } from "@/components/admin/UserAdminControls";
import { listProfiles } from "@/lib/services/profile-service";
import { listOrganizations } from "@/lib/services/organization-service";
import type { UserRole } from "@/lib/types/domain";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  organizacion: "Organización",
  voluntario: "Voluntario",
  salud_albergue: "Salud / Albergue",
  publico: "Público (sin rol)"
};

export default async function UsersPage() {
  const [{ data: profiles }, { data: organizations }] = await Promise.all([listProfiles(), listOrganizations()]);

  const orgs = organizations ?? [];
  const users = profiles ?? [];

  return (
    <ProtectedRoute roles={["admin"]}>
      <AppNav active="usuarios" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="mt-3 text-slate-600">
          No existe registro público: las cuentas del equipo se crean aquí por un administrador. Los cambios de rol y
          aprobación se auditan automáticamente en la base de datos.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Crear usuario del equipo</h2>
          <div className="mt-3">
            <CreateUserForm organizations={orgs} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Usuarios existentes</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 font-semibold">Usuario</th>
                  <th className="p-3 font-semibold">Rol</th>
                  <th className="p-3 font-semibold">Organización</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="p-3 text-slate-500" colSpan={5}>
                      No hay usuarios todavía.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-t align-top">
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{user.full_name ?? "Sin nombre"}</div>
                      </td>
                      <td className="p-3 text-slate-700">{ROLE_LABELS[user.role]}</td>
                      <td className="p-3 text-slate-700">{user.organizations?.name ?? "—"}</td>
                      <td className="p-3">
                        {user.approved ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            Aprobado
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <UserAdminControls user={user} organizations={orgs} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
