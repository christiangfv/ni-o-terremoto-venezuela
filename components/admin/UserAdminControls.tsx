"use client";

import { useState, useTransition } from "react";
import type { AssignableRole, Organization, ProfileWithOrg } from "@/lib/types/domain";
import { updateUserAction } from "@/app/usuarios/actions";

const ASSIGNABLE_ROLES: AssignableRole[] = ["admin", "organizacion", "voluntario", "salud_albergue"];

const ROLE_LABELS: Record<AssignableRole, string> = {
  admin: "Administrador",
  organizacion: "Organización",
  voluntario: "Voluntario",
  salud_albergue: "Salud / Albergue"
};

// The persisted role may still be 'publico' for a freshly created auth user that
// has not been promoted yet. The <select> only offers assignable roles, so we keep
// the raw value to detect that "no real role chosen yet" state.
type RoleOption = AssignableRole | "publico";

export function UserAdminControls({
  user,
  organizations
}: {
  user: ProfileWithOrg;
  organizations: Organization[];
}) {
  const [role, setRole] = useState<RoleOption>(user.role);
  const [orgId, setOrgId] = useState<string>(user.organization_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(patch: { role?: AssignableRole; organization_id?: string | null; approved?: boolean }) {
    setError(null);
    startTransition(async () => {
      const result = await updateUserAction({ id: user.id, ...patch });
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  function handleRoleChange(next: AssignableRole) {
    setRole(next);
    run({ role: next });
  }

  function handleOrgChange(next: string) {
    setOrgId(next);
    run({ organization_id: next.length > 0 ? next : null });
  }

  function handleApprove() {
    // Guard: cannot approve while the role is still 'publico'. The backend
    // constraint forbids approved=true with role='publico', so promote first.
    if (role === "publico") {
      setError("Asigna un rol del equipo antes de aprobar a este usuario.");
      return;
    }
    // Send role together with approved so the role + approval change atomically,
    // satisfying profiles_approved_requires_non_public_role.
    run({ role, approved: true });
  }

  function handleDisable() {
    run({ approved: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`role-${user.id}`}>
        Rol
      </label>
      <select
        id={`role-${user.id}`}
        className="rounded-lg border bg-white p-2 text-sm disabled:opacity-60"
        value={role === "publico" ? "" : role}
        disabled={isPending}
        onChange={(event) => handleRoleChange(event.target.value as AssignableRole)}
      >
        {role === "publico" ? (
          <option value="" disabled>
            Sin rol
          </option>
        ) : null}
        {ASSIGNABLE_ROLES.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor={`org-${user.id}`}>
        Organización
      </label>
      <select
        id={`org-${user.id}`}
        className="rounded-lg border bg-white p-2 text-sm disabled:opacity-60"
        value={orgId}
        disabled={isPending}
        onChange={(event) => handleOrgChange(event.target.value)}
      >
        <option value="">Sin organización</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>

      {user.approved ? (
        <button
          type="button"
          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          disabled={isPending}
          onClick={handleDisable}
        >
          Deshabilitar
        </button>
      ) : (
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          disabled={isPending || role === "publico"}
          onClick={handleApprove}
        >
          Aprobar
        </button>
      )}

      {error ? <span className="w-full text-sm text-red-600">{error}</span> : null}
    </div>
  );
}
