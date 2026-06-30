"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { organizationSchema } from "@/lib/validation/schemas";
import { createOrgAction } from "@/app/organizaciones/actions";

type OrganizationInput = z.infer<typeof organizationSchema>;

function toKebabCase(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OrganizationForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: "", slug: "", contact_email: "", contact_phone: "", active: true }
  });

  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: OrganizationInput) {
    setServerError(null);
    setSuccess(false);
    const result = await createOrgAction(values);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    form.reset({ name: "", slug: "", contact_email: "", contact_phone: "", active: true });
    setSlugEdited(false);
    setSuccess(true);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Nombre
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="Ej: Fundación Refugio Seguro"
            {...form.register("name", {
              onChange: (event) => {
                if (!slugEdited) {
                  form.setValue("slug", toKebabCase(event.target.value), { shouldValidate: true });
                }
              }
            })}
          />
        </label>
        {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Slug
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="fundacion-refugio-seguro"
            {...form.register("slug", {
              onChange: () => setSlugEdited(true)
            })}
          />
        </label>
        <p className="mt-1 text-xs text-slate-500">Se sugiere automáticamente desde el nombre. Solo minúsculas, números y guiones.</p>
        {errors.slug ? <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email de contacto
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              type="email"
              placeholder="contacto@organizacion.org"
              {...form.register("contact_email")}
            />
          </label>
          {errors.contact_email ? <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p> : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Teléfono de contacto
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="+58..."
              {...form.register("contact_phone")}
            />
          </label>
          {errors.contact_phone ? <p className="mt-1 text-sm text-red-600">{errors.contact_phone.message}</p> : null}
        </div>
      </div>

      {serverError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Organización creada correctamente.
        </div>
      ) : null}

      <button
        className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creando..." : "Crear organización"}
      </button>
    </form>
  );
}
