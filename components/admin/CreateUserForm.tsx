"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import type { Organization } from "@/lib/types/domain";
import { createUserAction } from "@/app/usuarios/actions";

type CreateUserInput = z.infer<typeof createUserSchema>;

const ROLE_LABELS: Record<CreateUserInput["role"], string> = {
  admin: "Administrador",
  organizacion: "Organización",
  voluntario: "Voluntario",
  salud_albergue: "Salud / Albergue"
};

export function CreateUserForm({ organizations }: { organizations: Organization[] }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      role: "voluntario",
      organization_id: null
    }
  });

  const selectedRole = form.watch("role");
  const requiresOrg = selectedRole !== "admin";

  async function onSubmit(values: CreateUserInput) {
    setServerError(null);
    setSuccess(null);

    // organization_id is already normalized to null on empty selection (setValueAs).
    // Non-admin roles must belong to an organization.
    if (values.role !== "admin" && !values.organization_id) {
      form.setError("organization_id", {
        type: "manual",
        message: "Selecciona una organización para este rol."
      });
      return;
    }

    const result = await createUserAction(values);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    setSuccess(`Cuenta creada para ${values.email}. Ya está aprobada y con el correo confirmado.`);
    form.reset({ email: "", full_name: "", password: "", role: "voluntario", organization_id: null });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">
        Esta cuenta se crea <strong>aprobada</strong> y con el <strong>correo ya confirmado</strong>: la persona podrá
        iniciar sesión de inmediato con el correo y la contraseña que definas aquí. No existe registro público; solo un
        administrador puede crear cuentas del equipo.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="cu-full_name">
            Nombre completo
          </label>
          <input
            id="cu-full_name"
            className="mt-1 w-full rounded-lg border p-3"
            {...form.register("full_name")}
            placeholder="Nombre y apellido"
          />
          {form.formState.errors.full_name ? (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.full_name.message}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="cu-email">
            Correo electrónico
          </label>
          <input
            id="cu-email"
            type="email"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border p-3"
            {...form.register("email")}
            placeholder="persona@organizacion.org"
          />
          {form.formState.errors.email ? (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="cu-password">
            Contraseña temporal
          </label>
          <input
            id="cu-password"
            type="password"
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border p-3"
            {...form.register("password")}
            placeholder="Mínimo 8 caracteres"
          />
          {form.formState.errors.password ? (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="cu-role">
            Rol
          </label>
          <select id="cu-role" className="mt-1 w-full rounded-lg border bg-white p-3" {...form.register("role")}>
            {(Object.keys(ROLE_LABELS) as CreateUserInput["role"][]).map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>
          {form.formState.errors.role ? (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.role.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="cu-organization">
          Organización {requiresOrg ? "(obligatoria)" : "(opcional para administradores)"}
        </label>
        <select
          id="cu-organization"
          className="mt-1 w-full rounded-lg border bg-white p-3"
          {...form.register("organization_id", {
            // A select yields "" for "Sin organización"; null keeps the uuid schema happy.
            setValueAs: (value) => (value ? value : null)
          })}
        >
          <option value="">Sin organización</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        {form.formState.errors.organization_id ? (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.organization_id.message}</p>
        ) : null}
      </div>

      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-60"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
