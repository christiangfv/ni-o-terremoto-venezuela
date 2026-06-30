"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { handoverSchema } from "@/lib/validation/schemas";
import { createHandoverAction } from "@/app/casos/[id]/actions";

type HandoverInput = z.infer<typeof handoverSchema>;

export function HandoverForm({ caseId, organizationId }: { caseId: string; organizationId: string }) {
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const form = useForm<HandoverInput>({
    resolver: zodResolver(handoverSchema),
    defaultValues: { case_id: caseId, organization_id: organizationId }
  });

  async function onSubmit(values: HandoverInput) {
    setFeedback(null);
    const result = await createHandoverAction(values);
    if ("error" in result) {
      setFeedback({ kind: "error", message: result.error });
      return;
    }
    form.reset({ case_id: caseId, organization_id: organizationId });
    setFeedback({ kind: "ok", message: "Entrega registrada. El caso pasó a estado «entregado»." });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Registrar entrega</h2>
        <p className="mt-1 text-sm text-slate-500">
          Registrar una entrega cambia automáticamente el estado del caso a «entregado» mediante un disparador de la base de
          datos.
        </p>
      </div>

      <input type="hidden" {...form.register("case_id")} />
      <input type="hidden" {...form.register("organization_id")} />

      <div>
        <label className="text-sm font-medium" htmlFor="handover-recipient-name">
          Nombre de quien recibe
        </label>
        <input
          id="handover-recipient-name"
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          {...form.register("recipient_name")}
          placeholder="Nombre completo"
        />
        {form.formState.errors.recipient_name ? (
          <p className="text-sm text-red-600">{form.formState.errors.recipient_name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="handover-relationship">
            Parentesco o relación
          </label>
          <input
            id="handover-relationship"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            {...form.register("recipient_relationship")}
            placeholder="Ej: madre, tutor legal"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="handover-document">
            Documento de referencia
          </label>
          <input
            id="handover-document"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            {...form.register("recipient_document_ref")}
            placeholder="Ej: cédula, pasaporte"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="handover-notes">
          Notas
        </label>
        <textarea
          id="handover-notes"
          className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3"
          {...form.register("notes")}
          placeholder="Detalles de la verificación y la entrega."
        />
      </div>

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {form.formState.isSubmitting ? "Registrando..." : "Registrar entrega"}
      </button>

      {feedback ? (
        <p className={`text-sm ${feedback.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>{feedback.message}</p>
      ) : null}
    </form>
  );
}
