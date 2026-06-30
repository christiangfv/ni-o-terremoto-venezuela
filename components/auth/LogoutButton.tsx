import { logoutAction } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50" type="submit">
        Cerrar sesión
      </button>
    </form>
  );
}
