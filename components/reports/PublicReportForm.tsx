"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicReportSchema } from "@/lib/validation/schemas";
import type { z } from "zod";

type PublicReportInput = z.infer<typeof publicReportSchema>;

export function PublicReportForm() {
  const form = useForm<PublicReportInput>({ resolver: zodResolver(publicReportSchema) });

  async function onSubmit(values: PublicReportInput) {
    const response = await fetch("/api/reportes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!response.ok) {
      alert("No se pudo enviar el reporte. Intenta nuevamente.");
      return;
    }
    form.reset();
    alert("Reporte recibido. Será revisado antes de cualquier acción.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-medium">Código del caso, si lo tienes</label>
        <input className="mt-1 w-full rounded-lg border p-3" {...form.register("public_code")} placeholder="NTV..." />
      </div>
      <div>
        <label className="text-sm font-medium">Zona general</label>
        <input className="mt-1 w-full rounded-lg border p-3" {...form.register("zone_general")} placeholder="Ej: sector norte, albergue central" />
      </div>
      <div>
        <label className="text-sm font-medium">Mensaje</label>
        <textarea className="mt-1 min-h-32 w-full rounded-lg border p-3" {...form.register("message")} placeholder="No incluyas datos sensibles innecesarios." />
        {form.formState.errors.message ? <p className="text-sm text-red-600">{form.formState.errors.message.message}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="rounded-lg border p-3" {...form.register("reporter_name")} placeholder="Nombre opcional" />
        <input className="rounded-lg border p-3" {...form.register("reporter_contact")} placeholder="Contacto opcional" />
      </div>
      <button className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white" type="submit">Enviar a moderación</button>
    </form>
  );
}
