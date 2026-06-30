export const dynamic = "force-dynamic";

import { AppNav } from "@/components/layout/AppNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModerationActions } from "@/components/reports/ModerationActions";
import { listModerationQueue } from "@/lib/services/report-service";
import type { PublicReport, ReportStatus } from "@/lib/types/domain";

const STATUS_LABELS: Record<ReportStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  duplicado: "Duplicado"
};

const STATUS_STYLES: Record<ReportStatus, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  en_revision: "bg-sky-100 text-sky-800",
  aprobado: "bg-emerald-100 text-emerald-800",
  rechazado: "bg-red-100 text-red-800",
  duplicado: "bg-slate-200 text-slate-700"
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export default async function ReportsPage() {
  const { data: reports } = await listModerationQueue();
  const items = (reports ?? []) as PublicReport[];

  return (
    <ProtectedRoute roles={["admin", "organizacion", "salud_albergue"]}>
      <AppNav active="reportes" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold">Reportes ciudadanos</h1>
        <p className="mt-3 text-slate-600">
          Todo reporte requiere moderación. No se publica automáticamente.
        </p>

        {items.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-6 text-slate-600 shadow-sm">
            No hay reportes en la cola de moderación.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {items.map((report) => (
              <article key={report.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[report.status]}`}
                  >
                    {STATUS_LABELS[report.status]}
                  </span>
                  <time className="text-xs text-slate-500" dateTime={report.created_at}>
                    {formatDate(report.created_at)}
                  </time>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm text-slate-800">{report.message}</p>

                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {report.zone_general ? (
                    <div>
                      <dt className="font-medium text-slate-500">Zona general</dt>
                      <dd className="text-slate-800">{report.zone_general}</dd>
                    </div>
                  ) : null}
                  {report.public_code ? (
                    <div>
                      <dt className="font-medium text-slate-500">Código del caso</dt>
                      <dd className="text-slate-800">{report.public_code}</dd>
                    </div>
                  ) : null}
                  {report.reporter_name ? (
                    <div>
                      <dt className="font-medium text-slate-500">Nombre del reportante</dt>
                      <dd className="text-slate-800">{report.reporter_name}</dd>
                    </div>
                  ) : null}
                  {report.reporter_contact ? (
                    <div>
                      <dt className="font-medium text-slate-500">Contacto del reportante</dt>
                      <dd className="text-slate-800">{report.reporter_contact}</dd>
                    </div>
                  ) : null}
                </dl>

                {report.moderation_notes ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-500">Notas de moderación</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-800">{report.moderation_notes}</p>
                  </div>
                ) : null}

                <ModerationActions reportId={report.id} status={report.status} />
              </article>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
