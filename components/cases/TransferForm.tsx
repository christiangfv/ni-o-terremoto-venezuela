"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { transferSchema } from "@/lib/validation/schemas";
import { createTransferAction } from "@/app/casos/[id]/actions";

type TransferInput = z.infer<typeof transferSchema>;

export function TransferForm({ caseId, organizationId }: { caseId: string; organizationId: string }) {
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const form = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: { case_id: caseId, organization_id: organizationId }
  });

  async function onSubmit(values: TransferInput) {
    setFeedback(null);
    const result = await createTransferAction(values);
    if ("error" in result) {
      setFeedback({ kind: "error", message: result.error });
      return;
    }
    form.reset({ case_id: caseId, organization_id: organizationId });
    setFeedback({ kind: "ok", message: "Traslado registrado. El caso pasó a estado «en traslado»." });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Registrar traslado</h2>
        <p className="mt-1 text-sm text-slate-500">
          Registrar un traslado cambia automáticamente el estado del caso a «en traslado» mediante un disparador de la base de
          datos.
        </p>
      </div>

      <input type="hidden" {...form.register("case_id")} />
      <input type="hidden" {...form.register("organization_id")} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="transfer-from-zone">
            Zona de origen
          </label>
          <input
            id="transfer-from-zone"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            {...form.register("from_zone")}
            placeholder="Ej: sector norte"
          />
          {form.formState.errors.from_zone ? (
            <p className="text-sm text-red-600">{form.formState.errors.from_zone.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="transfer-to-zone">
            Zona de destino
          </label>
          <input
            id="transfer-to-zone"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            {...form.register("to_zone")}
            placeholder="Ej: albergue central"
          />
          {form.formState.errors.to_zone ? (
            <p className="text-sm text-red-600">{form.formState.errors.to_zone.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="transfer-from-location">
            Ubicación exacta de origen
          </label>
          <input
            id="transfer-from-location"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            {...form.register("from_location_exact")}
            placeholder="Información sensible. Solo personal autorizado."
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="transfer-to-location">
            Ubicación exacta de destino
          </label>
          <input
            id="transfer-to-location"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            {...form.register("to_location_exact")}
            placeholder="Información sensible. Solo personal autorizado."
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="transfer-reason">
          Motivo
        </label>
        <textarea
          id="transfer-reason"
          className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3"
          {...form.register("reason")}
          placeholder="Motivo del traslado."
        />
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="transfer-responsible">
          Persona responsable
        </label>
        <input
          id="transfer-responsible"
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          {...form.register("responsible_person")}
          placeholder="Nombre del responsable del traslado"
        />
      </div>

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {form.formState.isSubmitting ? "Registrando..." : "Registrar traslado"}
      </button>

      {feedback ? (
        <p className={`text-sm ${feedback.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>{feedback.message}</p>
      ) : null}
    </form>
  );
}
