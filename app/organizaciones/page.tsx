export const dynamic = "force-dynamic";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppNav } from "@/components/layout/AppNav";
import { OrganizationForm } from "@/components/admin/OrganizationForm";
import { OrganizationActiveToggle } from "@/components/admin/OrganizationActiveToggle";
import { listOrganizations } from "@/lib/services/organization-service";

export default async function OrganizationsPage() {
  const { data: organizations, error } = await listOrganizations();

  return (
    <ProtectedRoute roles={["admin"]}>
      <AppNav active="organizaciones" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <header>
          <h1 className="text-3xl font-bold">Organizaciones</h1>
          <p className="mt-3 text-slate-600">
            Administración de organizaciones. RLS limita el acceso por organización y rol. Las organizaciones no se
            eliminan: se desactivan.
          </p>
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">Nueva organización</h2>
          <div className="mt-4">
            <OrganizationForm />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Organizaciones existentes</h2>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No se pudieron cargar las organizaciones: {error.message}
            </div>
          ) : !organizations || organizations.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Aún no hay organizaciones registradas.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Nombre</th>
                    <th className="px-5 py-3 font-medium">Slug</th>
                    <th className="px-5 py-3 font-medium">Contacto</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((organization) => (
                    <tr key={organization.id} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="px-5 py-4 font-medium text-slate-900">{organization.name}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{organization.slug}</code>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {organization.contact_email ? <div>{organization.contact_email}</div> : null}
                        {organization.contact_phone ? <div className="text-slate-500">{organization.contact_phone}</div> : null}
                        {!organization.contact_email && !organization.contact_phone ? (
                          <span className="text-slate-400">Sin contacto</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            organization.active
                              ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
                              : "inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
                          }
                        >
                          {organization.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <OrganizationActiveToggle id={organization.id} active={organization.active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
