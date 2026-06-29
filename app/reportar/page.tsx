import { PublicReportForm } from "@/components/reports/PublicReportForm";

export default function ReportarPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Reportar información</h1>
      <p className="mt-3 text-slate-600">Los reportes ciudadanos quedan pendientes y deben ser moderados por equipos autorizados. No se publica información sensible.</p>
      <div className="mt-6"><PublicReportForm /></div>
    </main>
  );
}
