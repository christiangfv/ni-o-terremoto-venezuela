export const dynamic = "force-dynamic";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { listModerationQueue } from "@/lib/services/report-service";

export default async function ReportsPage() {
  const { data: reports } = await listModerationQueue();
  return (
    <ProtectedRoute roles={["admin", "organizacion", "salud_albergue"]}>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold">Reportes ciudadanos</h1>
        <p className="mt-3 text-slate-600">Todo reporte requiere moderación. No se publica automáticamente.</p>
        <div className="mt-6 space-y-3">
          {(reports ?? []).map((report) => (
            <article key={report.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold">{report.status}</p>
              <p className="mt-2 text-sm text-slate-600">{report.message}</p>
            </article>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}
