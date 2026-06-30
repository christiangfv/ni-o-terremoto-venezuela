export const dynamic = "force-dynamic";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppNav } from "@/components/layout/AppNav";
import { listCases } from "@/lib/services/case-service";

export default async function CasesPage() {
  const { data: cases } = await listCases();
  return (
    <ProtectedRoute roles={["admin", "organizacion", "voluntario", "salud_albergue"]}>
      <AppNav active="casos" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Casos</h1>
            <p className="mt-3 text-slate-600">
              No hay borrado físico desde UI. Los permisos reales se aplican con RLS en backend.
            </p>
          </div>
          <Link
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            href={"/casos/nuevo" as never}
          >
            Nuevo caso
          </Link>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Código</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Riesgo</th>
                <th>Zona</th>
              </tr>
            </thead>
            <tbody>
              {(cases ?? []).map((item) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-mono">
                    <Link className="text-slate-950 hover:underline" href={`/casos/${item.id}` as never}>
                      {item.public_code}
                    </Link>
                  </td>
                  <td>
                    <Link className="hover:underline" href={`/casos/${item.id}` as never}>
                      {item.first_name} {item.last_name}
                    </Link>
                  </td>
                  <td>{item.status}</td>
                  <td>{item.risk}</td>
                  <td>{item.zone_general}</td>
                </tr>
              ))}
              {(cases ?? []).length === 0 ? (
                <tr className="border-t">
                  <td className="p-3 text-slate-500" colSpan={5}>
                    No hay casos registrados todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </main>
    </ProtectedRoute>
  );
}
