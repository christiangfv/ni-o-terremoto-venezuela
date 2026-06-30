export const dynamic = "force-dynamic";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppNav } from "@/components/layout/AppNav";
import { CaseForm } from "@/components/cases/CaseForm";
import { listOrganizations } from "@/lib/services/organization-service";
import { getCurrentProfile } from "@/lib/services/auth-service";

export default async function NewCasePage() {
  const [{ data: organizations }, profile] = await Promise.all([listOrganizations(), getCurrentProfile()]);

  return (
    <ProtectedRoute roles={["admin", "organizacion", "voluntario", "salud_albergue"]}>
      <AppNav active="casos" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Nuevo caso</h1>
          <Link className="text-sm font-medium text-slate-600 hover:text-slate-950 hover:underline" href={"/casos" as never}>
            Volver a casos
          </Link>
        </div>
        <p className="mt-3 text-slate-600">
          Registra a un niño, niña o adolescente. La información sensible solo es visible para el equipo autorizado.
        </p>
        <div className="mt-6">
          <CaseForm organizations={organizations ?? []} profile={profile} />
        </div>
      </main>
    </ProtectedRoute>
  );
}
