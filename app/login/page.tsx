import { loginAction } from "./actions";

const messages: Record<string, string> = {
  missing: "Ingresa email y contraseña.",
  invalid: "Credenciales inválidas o usuario no aprobado.",
  required: "Debes iniciar sesión con un usuario aprobado."
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error ? messages[error] ?? "No se pudo iniciar sesión." : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Acceso autorizado</p>
        <h1 className="mt-2 text-3xl font-bold">Entrar al dashboard</h1>
        <p className="mt-3 text-sm text-slate-600">
          Solo usuarios aprobados por la organización. No usar datos reales sin revisión legal.
        </p>
        {message ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</div>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800" type="submit">
            Iniciar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
