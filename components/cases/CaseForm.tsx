"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { caseCreateSchema } from "@/lib/validation/schemas";
import type { Organization, Profile } from "@/lib/types/domain";
import { createCaseAction } from "@/app/casos/actions";

type CaseFormValues = z.infer<typeof caseCreateSchema>;

const SEX_OPTIONS: { value: CaseFormValues["sex"]; label: string }[] = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
  { value: "otro", label: "Otro" },
  { value: "desconocido", label: "Desconocido" }
];

const STATUS_OPTIONS: { value: CaseFormValues["status"]; label: string }[] = [
  { value: "registrado", label: "Registrado" },
  { value: "en_resguardo", label: "En resguardo" },
  { value: "requiere_atencion", label: "Requiere atención" },
  { value: "en_traslado", label: "En traslado" },
  { value: "reunificacion_pendiente", label: "Reunificación pendiente" },
  { value: "entregado", label: "Entregado" },
  { value: "cerrado", label: "Cerrado" }
];

const RISK_OPTIONS: { value: CaseFormValues["risk"]; label: string }[] = [
  { value: "bajo", label: "Bajo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
  { value: "critico", label: "Crítico" }
];

export function CaseForm({
  organizations,
  profile
}: {
  organizations: Organization[];
  profile: Profile | null;
}) {
  const lockOrganization = profile?.role !== "admin" && Boolean(profile?.organization_id);
  const lockedOrganizationId = lockOrganization ? profile?.organization_id ?? "" : "";

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseCreateSchema),
    defaultValues: {
      organization_id: lockedOrganizationId,
      first_name: "",
      last_name: "",
      approximate_age: undefined,
      sex: "desconocido",
      status: "registrado",
      risk: "medio",
      zone_general: "",
      location_exact: "",
      health_notes: "",
      family_contact_notes: "",
      internal_notes: ""
    }
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const errors = form.formState.errors;

  async function onSubmit(values: CaseFormValues) {
    setServerError(null);
    const result = await createCaseAction(values);
    // A successful action redirects and never returns; only errors come back.
    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Datos del caso</h2>

        <div>
          <label className="text-sm font-medium" htmlFor="organization_id">
            Organización
          </label>
          <select
            id="organization_id"
            className="mt-1 w-full rounded-lg border p-3 disabled:bg-slate-100 disabled:text-slate-500"
            disabled={lockOrganization}
            {...form.register("organization_id")}
          >
            <option value="">Selecciona una organización</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {errors.organization_id ? (
            <p className="mt-1 text-sm text-red-600">Selecciona una organización válida.</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="first_name">
              Nombre
            </label>
            <input id="first_name" className="mt-1 w-full rounded-lg border p-3" {...form.register("first_name")} />
            {errors.first_name ? <p className="mt-1 text-sm text-red-600">El nombre es obligatorio.</p> : null}
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="last_name">
              Apellido
            </label>
            <input id="last_name" className="mt-1 w-full rounded-lg border p-3" {...form.register("last_name")} />
            {errors.last_name ? <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="approximate_age">
              Edad aproximada
            </label>
            <input
              id="approximate_age"
              type="number"
              min={0}
              max={17}
              className="mt-1 w-full rounded-lg border p-3"
              {...form.register("approximate_age", {
                setValueAs: (value) => (value === "" || value === null || value === undefined ? null : Number(value))
              })}
            />
            {errors.approximate_age ? (
              <p className="mt-1 text-sm text-red-600">Ingresa una edad entre 0 y 17.</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="sex">
              Sexo
            </label>
            <select id="sex" className="mt-1 w-full rounded-lg border p-3" {...form.register("sex")}>
              {SEX_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="status">
              Estado
            </label>
            <select id="status" className="mt-1 w-full rounded-lg border p-3" {...form.register("status")}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="risk">
              Riesgo
            </label>
            <select id="risk" className="mt-1 w-full rounded-lg border p-3" {...form.register("risk")}>
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="zone_general">
            Zona general
          </label>
          <input
            id="zone_general"
            className="mt-1 w-full rounded-lg border p-3"
            placeholder="Ej: sector norte, albergue central"
            {...form.register("zone_general")}
          />
          {errors.zone_general ? <p className="mt-1 text-sm text-red-600">{errors.zone_general.message}</p> : null}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-amber-900">Información sensible — solo equipo autorizado</h2>
          <p className="mt-1 text-sm text-amber-800">
            Estos datos nunca se muestran en superficies públicas. El acceso se controla con RLS en backend.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="location_exact">
            Ubicación exacta
          </label>
          <textarea
            id="location_exact"
            className="mt-1 min-h-24 w-full rounded-lg border p-3"
            {...form.register("location_exact")}
          />
          {errors.location_exact ? <p className="mt-1 text-sm text-red-600">{errors.location_exact.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="health_notes">
            Notas de salud
          </label>
          <textarea
            id="health_notes"
            className="mt-1 min-h-24 w-full rounded-lg border p-3"
            {...form.register("health_notes")}
          />
          {errors.health_notes ? <p className="mt-1 text-sm text-red-600">{errors.health_notes.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="family_contact_notes">
            Notas de familia y contacto
          </label>
          <textarea
            id="family_contact_notes"
            className="mt-1 min-h-24 w-full rounded-lg border p-3"
            {...form.register("family_contact_notes")}
          />
          {errors.family_contact_notes ? (
            <p className="mt-1 text-sm text-red-600">{errors.family_contact_notes.message}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="internal_notes">
            Notas internas
          </label>
          <textarea
            id="internal_notes"
            className="mt-1 min-h-24 w-full rounded-lg border p-3"
            {...form.register("internal_notes")}
          />
          {errors.internal_notes ? <p className="mt-1 text-sm text-red-600">{errors.internal_notes.message}</p> : null}
        </div>
      </section>

      {serverError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
      ) : null}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {form.formState.isSubmitting ? "Guardando..." : "Crear caso"}
      </button>
    </form>
  );
}
