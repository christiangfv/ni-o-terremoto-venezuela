import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentProfile, isRoleAllowed } from "@/lib/services/auth-service";
import type { UserRole } from "@/lib/types/domain";

type NavItem = {
  key: string;
  label: string;
  href: string;
  roles: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", roles: ["admin", "organizacion", "voluntario", "salud_albergue"] },
  { key: "casos", label: "Casos", href: "/casos", roles: ["admin", "organizacion", "voluntario", "salud_albergue"] },
  { key: "reportes", label: "Reportes", href: "/reportes", roles: ["admin", "organizacion", "salud_albergue"] },
  { key: "usuarios", label: "Usuarios", href: "/usuarios", roles: ["admin"] },
  { key: "organizaciones", label: "Organizaciones", href: "/organizaciones", roles: ["admin"] }
];

export async function AppNav({ active }: { active?: string }) {
  const profile = await getCurrentProfile();

  if (!profile?.approved) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link className="text-base font-bold text-slate-950" href={"/dashboard" as never}>
            Niño Terremoto Venezuela
          </Link>
          <Link
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            href={"/login" as never}
          >
            Entrar
          </Link>
        </nav>
      </header>
    );
  }

  const visibleItems = NAV_ITEMS.filter((item) => isRoleAllowed(profile, item.roles));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <Link className="text-base font-bold text-slate-950" href={"/dashboard" as never}>
            Niño Terremoto Venezuela
          </Link>
          <ul className="flex items-center gap-1">
            {visibleItems.map((item) => {
              const isActive = active === item.key;
              return (
                <li key={item.key}>
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                        : "rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }
                    href={item.href as never}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <LogoutButton />
      </nav>
    </header>
  );
}
