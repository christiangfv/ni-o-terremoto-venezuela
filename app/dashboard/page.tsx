export const dynamic = "force-dynamic";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppNav } from "@/components/layout/AppNav";
import { getCurrentProfile, isRoleAllowed } from "@/lib/services/auth-service";
import { listCases } from "@/lib/services/case-service";
import { listModerationQueue } from "@/lib/services/report-service";
import type { UserRole } from "@/lib/types/domain";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  organizacion: "Organización",
  voluntario: "Voluntario",
  salud_albergue: "Salud / Albergue",
  publico: "Público"
};

const CASE_ROLES: UserRole[] = ["admin", "organizacion", "voluntario", "salud_albergue"];
const REPORT_ROLES: UserRole[] = ["admin", "organizacion", "salud_albergue"];
const ADMIN_ROLES: UserRole[] = ["admin"];

type QuickAction = {
  key: string;
  title: string;
  description: string;
  href: string;
  roles: UserRole[];
  count?: number | null;
  countLabel?: string;
};

// Defensively count visible casos; a query error must not crash the dashboard.
async function loadCaseCount(): Promise<number | null> {
  try {
    const { data, error } = await listCases();
    if (error) return null;
    return (data ?? []).length;
  } catch {
    return null;
  }
}

// Defensively count pending reportes for moderators; a query error must not crash the dashboard.
async function loadPendingReportCount(): Promise<number | null> {
  try {
    const { data, error } = await listModerationQueue();
    if (error) return null;
    return (data ?? []).filter((report) => report.status === "pendiente").length;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  const canSeeCases = isRoleAllowed(profile, CASE_ROLES);
  const canSeeReports = isRoleAllowed(profile, REPORT_ROLES);

  const [caseCount, pendingReportCount] = await Promise.all([
    canSeeCases ? loadCaseCount() : Promise.resolve(null),
    canSeeReports ? loadPendingReportCount() : Promise.resolve(null)
  ]);

  const roleLabel = profile ? ROLE_LABELS[profile.role] : "sin perfil";
  const greetingName = profile?.full_name?.trim();

  const actions: QuickAction[] = [
    {
      key: "casos",
      title: "Casos",
      description: "Registra y da seguimiento a los casos de niñas y niños.",
      href: "/casos",
      roles: CASE_ROLES,
      count: caseCount,
      countLabel: "casos visibles"
    },
    {
      key: "reportes",
      title: "Reportes",
      description: "Revisa y modera los reportes recibidos del público.",
      href: "/reportes",
      roles: REPORT_ROLES,
      count: pendingReportCount,
      countLabel: "pendientes de revisión"
    },
    {
      key: "usuarios",
      title: "Usuarios",
      description: "Administra el equipo y aprueba los accesos.",
      href: "/usuarios",
      roles: ADMIN_ROLES
    },
    {
      key: "organizaciones",
      title: "Organizaciones",
      description: "Gestiona las organizaciones participantes.",
      href: "/organizaciones",
      roles: ADMIN_ROLES
    }
  ];

  const visibleActions = actions.filter((action) => isRoleAllowed(profile, action.roles));

  return (
    <ProtectedRoute roles={["admin", "organizacion", "voluntario", "salud_albergue"]}>
      <AppNav active="dashboard" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <header>
          <h1 className="text-3xl font-bold">
            Hola{greetingName ? `, ${greetingName}` : ""}
          </h1>
          <p className="mt-3 text-slate-600">
            Tu rol actual es <span className="font-medium text-slate-900">{roleLabel}</span>. Accede a las secciones disponibles para tu equipo.
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleActions.map((action) => (
            <Link
              key={action.key}
              href={action.href as never}
              className="group flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{action.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{action.description}</p>
              </div>
              {action.count !== undefined ? (
                <p className="mt-6 text-sm text-slate-500">
                  {action.count === null ? (
                    <span className="text-slate-400">Conteo no disponible</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-slate-900">{action.count}</span>{" "}
                      {action.countLabel}
                    </>
                  )}
                </p>
              ) : (
                <span className="mt-6 text-sm font-medium text-slate-500 group-hover:text-slate-900">
                  Abrir sección →
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}
