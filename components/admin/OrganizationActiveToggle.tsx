"use client";

import { useState, useTransition } from "react";
import { toggleOrgActiveAction } from "@/app/organizaciones/actions";

export function OrganizationActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleOrgActiveAction({ id, active: !active });
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        aria-pressed={active}
        className={
          active
            ? "rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
            : "rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
        }
      >
        {isPending ? "Guardando..." : active ? "Desactivar" : "Activar"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
