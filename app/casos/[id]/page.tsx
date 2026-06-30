export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EventTimeline } from "@/components/cases/EventTimeline";
import { CaseStatusControl } from "@/components/cases/CaseStatusControl";
import { HandoverForm } from "@/components/cases/HandoverForm";
import { TransferForm } from "@/components/cases/TransferForm";
import { PhotoUpload } from "@/components/cases/PhotoUpload";
import { getCase, getCaseEvents, listCasePhotos } from "@/lib/services/case-service";
import { listHandovers, listTransfers } from "@/lib/services/operations-service";
import { createSignedReadUrl } from "@/lib/services/storage-service";
import type { CasePhoto } from "@/lib/types/domain";

const STATUS_LABELS: Record<string, string> = {
  registrado: "Registrado",
  en_resguardo: "En resguardo",
  requiere_atencion: "Requiere atención",
  en_traslado: "En traslado",
  reunificacion_pendiente: "Reunificación pendiente",
  entregado: "Entregado",
  cerrado: "Cerrado"
};

const RISK_LABELS: Record<string, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  critico: "Crítico"
};

const SEX_LABELS: Record<string, string> = {
  femenino: "Femenino",
  masculino: "Masculino",
  otro: "Otro",
  desconocido: "Desconocido"
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL");
}

function Field({ label, value, sensitive = false }: { label: string; value: string | null; sensitive?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
        {sensitive ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Sensible
          </span>
        ) : null}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{value && value.length > 0 ? value : "—"}</dd>
    </div>
  );
}

type PhotoWithUrl = { photo: CasePhoto; url: string | null };

async function resolvePhotoUrls(photos: CasePhoto[]): Promise<PhotoWithUrl[]> {
  return Promise.all(
    photos.map(async (photo) => {
      try {
        const { data, error } = await createSignedReadUrl(photo.bucket_id, photo.storage_path);
        return { photo, url: error ? null : data?.signedUrl ?? null };
      } catch {
        return { photo, url: null };
      }
    })
  );
}

function PhotoGallery({ items }: { items: PhotoWithUrl[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Sin fotos registradas.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map(({ photo, url }) => (
        <li key={photo.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={`Foto del caso del ${formatDateTime(photo.created_at)}`}
              className="h-32 w-full object-cover"
            />
          ) : (
            <div className="flex h-32 w-full items-center justify-center px-2 text-center text-xs text-slate-500">
              No se pudo cargar la imagen.
            </div>
          )}
          <div className="px-2 py-1 text-[10px] text-slate-500">
            {photo.is_public_preview ? "Vista pública" : "Privada"} · {formatDateTime(photo.created_at)}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ProtectedRoute roles={["admin", "organizacion", "voluntario", "salud_albergue"]}>
      <AppNav active="casos" />
      <CaseDetailContent id={id} />
    </ProtectedRoute>
  );
}

async function CaseDetailContent({ id }: { id: string }) {
  const { data: caseRecord, error: caseError } = await getCase(id);

  if (caseError || !caseRecord) {
    notFound();
  }

  const [{ data: events }, { data: photos }, { data: handovers }, { data: transfers }] = await Promise.all([
    getCaseEvents(id),
    listCasePhotos(id),
    listHandovers(id),
    listTransfers(id)
  ]);

  const photoItems = await resolvePhotoUrls(photos ?? []);
  const fullName = [caseRecord.first_name, caseRecord.last_name].filter(Boolean).join(" ");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-slate-500">{caseRecord.public_code}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{fullName}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Vista privada autorizada. Esta información es confidencial y queda registrada en auditoría. No realices borrados
            físicos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">
            {STATUS_LABELS[caseRecord.status] ?? caseRecord.status}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            Riesgo: {RISK_LABELS[caseRecord.risk] ?? caseRecord.risk}
          </span>
        </div>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Resumen del caso</h2>
        <dl className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Nombre" value={caseRecord.first_name} />
          <Field label="Apellido" value={caseRecord.last_name} />
          <Field label="Edad aproximada" value={caseRecord.approximate_age != null ? String(caseRecord.approximate_age) : null} />
          <Field label="Sexo" value={SEX_LABELS[caseRecord.sex] ?? caseRecord.sex} />
          <Field label="Estado" value={STATUS_LABELS[caseRecord.status] ?? caseRecord.status} />
          <Field label="Nivel de riesgo" value={RISK_LABELS[caseRecord.risk] ?? caseRecord.risk} />
          <Field label="Zona general" value={caseRecord.zone_general} />
          <Field label="Ubicación exacta" value={caseRecord.location_exact} sensitive />
          <Field label="Notas de salud" value={caseRecord.health_notes} sensitive />
          <Field label="Notas de familia y contacto" value={caseRecord.family_contact_notes} sensitive />
          <Field label="Notas internas" value={caseRecord.internal_notes} sensitive />
          <Field label="Creado" value={formatDateTime(caseRecord.created_at)} />
          <Field label="Última actualización" value={formatDateTime(caseRecord.updated_at)} />
          <Field label="Cerrado" value={formatDateTime(caseRecord.closed_at)} />
        </dl>
      </section>

      <section className="mt-6">
        <CaseStatusControl caseId={caseRecord.id} status={caseRecord.status} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Fotos del caso</h2>
          <p className="mt-1 text-sm text-slate-500">Material confidencial. Solo personal autorizado.</p>
          <div className="mt-4">
            <PhotoGallery items={photoItems} />
          </div>
        </div>
        <PhotoUpload caseId={caseRecord.id} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Entregas</h2>
          <p className="mt-1 text-sm text-slate-500">Información sensible. Solo personal autorizado.</p>
          <ul className="mt-4 space-y-3">
            {(handovers ?? []).length === 0 ? (
              <li className="text-sm text-slate-500">Sin entregas registradas.</li>
            ) : (
              (handovers ?? []).map((handover) => (
                <li key={handover.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-900">{handover.recipient_name}</p>
                  <p className="text-xs text-slate-500">
                    {handover.recipient_relationship ? `${handover.recipient_relationship} · ` : ""}
                    {handover.recipient_document_ref ?? "Sin documento"}
                  </p>
                  {handover.notes ? <p className="mt-2 text-sm text-slate-700">{handover.notes}</p> : null}
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(handover.created_at)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
        <HandoverForm caseId={caseRecord.id} organizationId={caseRecord.organization_id} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Traslados</h2>
          <p className="mt-1 text-sm text-slate-500">Información sensible. Solo personal autorizado.</p>
          <ul className="mt-4 space-y-3">
            {(transfers ?? []).length === 0 ? (
              <li className="text-sm text-slate-500">Sin traslados registrados.</li>
            ) : (
              (transfers ?? []).map((transfer) => (
                <li key={transfer.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-900">
                    {transfer.from_zone} → {transfer.to_zone}
                  </p>
                  {transfer.reason ? <p className="mt-1 text-sm text-slate-700">{transfer.reason}</p> : null}
                  {transfer.responsible_person ? (
                    <p className="mt-1 text-xs text-slate-500">Responsable: {transfer.responsible_person}</p>
                  ) : null}
                  {transfer.from_location_exact || transfer.to_location_exact ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Ubicación exacta (sensible): {transfer.from_location_exact ?? "—"} → {transfer.to_location_exact ?? "—"}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(transfer.created_at)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
        <TransferForm caseId={caseRecord.id} organizationId={caseRecord.organization_id} />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Línea de tiempo</h2>
        <p className="mt-1 text-sm text-slate-500">Eventos registrados automáticamente por la base de datos.</p>
        <div className="mt-4">
          <EventTimeline events={events ?? []} />
        </div>
      </section>
    </main>
  );
}
