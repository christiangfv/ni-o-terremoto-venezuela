"use client";

import { useState, useTransition } from "react";
import { updateCaseStatusAction } from "@/app/casos/[id]/actions";
import type { CaseStatus } from "@/lib/types/domain";

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: "registrado", label: "Registrado" },
  { value: "en_resguardo", label: "En resguardo" },
  { value: "requiere_atencion", label: "Requiere atención" },
  { value: "en_traslado", label: "En traslado" },
  { value: "reunificacion_pendiente", label: "Reunificación pendiente" },
  { value: "entregado", label: "Entregado" },
  { value: "cerrado", label: "Cerrado" }
];

export function CaseStatusControl({ caseId, status }: { caseId: string; status: CaseStatus }) {
  const [value, setValue] = useState<CaseStatus>(status);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpdate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateCaseStatusAction({ id: caseId, status: value });
      if ("error" in result) {
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      setFeedback({ kind: "ok", message: "Estado actualizado." });
    });
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Estado del caso</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cambiar el estado queda registrado automáticamente en la auditoría y la línea de tiempo.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="case-status">
          Estado del caso
        </label>
        <select
          id="case-status"
          className="rounded-lg border border-slate-300 p-3 text-sm"
          value={value}
          disabled={isPending}
          onChange={(event) => setValue(event.target.value as CaseStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isPending || value === status}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
      {feedback ? (
        <p className={`mt-3 text-sm ${feedback.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
