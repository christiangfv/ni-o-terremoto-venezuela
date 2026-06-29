export const dynamic = "force-dynamic";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { listCases } from "@/lib/services/case-service";

export default async function CasesPage() {
  const { data: cases } = await listCases();
  return (
    <ProtectedRoute roles={["admin", "organizacion", "voluntario", "salud_albergue"]}>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">Casos</h1>
        <p className="mt-3 text-slate-600">No hay borrado físico desde UI. Los permisos reales se aplican con RLS en backend.</p>
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50"><tr><th className="p-3">Código</th><th>Nombre</th><th>Estado</th><th>Riesgo</th><th>Zona</th></tr></thead>
            <tbody>
              {(cases ?? []).map((item) => (
                <tr key={item.id} className="border-t"><td className="p-3 font-mono">{item.public_code}</td><td>{item.first_name} {item.last_name}</td><td>{item.status}</td><td>{item.risk}</td><td>{item.zone_general}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </ProtectedRoute>
  );
}
