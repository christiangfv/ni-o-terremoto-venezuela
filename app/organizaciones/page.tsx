export const dynamic = "force-dynamic";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function OrganizationsPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Organizaciones</h1>
        <p className="mt-3 text-slate-600">Administración de organizaciones. RLS limita acceso por organización y rol.</p>
      </main>
    </ProtectedRoute>
  );
}
