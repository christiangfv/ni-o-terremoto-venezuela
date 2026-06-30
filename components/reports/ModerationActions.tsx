"use client";

import { useState, useTransition } from "react";
import { reviewReportAction } from "@/app/reportes/actions";
import type { ReportStatus } from "@/lib/types/domain";

type ModeratableStatus = "en_revision" | "aprobado" | "rechazado" | "duplicado";

const STATUS_OPTIONS: { value: ModeratableStatus; label: string }[] = [
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
  { value: "duplicado", label: "Duplicado" }
];

// The initial report status may be "pendiente" (not a moderatable target),
// so the select defaults to "en_revision" when the report is still pending.
function defaultStatus(status: ReportStatus): ModeratableStatus {
  return status === "pendiente" ? "en_revision" : status;
}

export function ModerationActions({ reportId, status }: { reportId: string; status: ReportStatus }) {
  const [selectedStatus, setSelectedStatus] = useState<ModeratableStatus>(defaultStatus(status));
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    setFeedback(null);
    startTransition(async () => {
      const result = await reviewReportAction({
        id: reportId,
        status: selectedStatus,
        moderation_notes: notes
      });
      if ("error" in result) {
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      setFeedback({ kind: "ok", message: "Reporte actualizado correctamente." });
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor={`status-${reportId}`}>
            Nuevo estado
          </label>
          <select
            id={`status-${reportId}`}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm disabled:opacity-60"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as ModeratableStatus)}
            disabled={isPending}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor={`notes-${reportId}`}>
          Notas de moderación (opcional)
        </label>
        <textarea
          id={`notes-${reportId}`}
          className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm disabled:opacity-60"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Motivo de la decisión, contexto interno, etc."
          maxLength={2000}
          disabled={isPending}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Guardar moderación"}
        </button>
        {feedback ? (
          <p
            role="status"
            className={feedback.kind === "ok" ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-red-600"}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
