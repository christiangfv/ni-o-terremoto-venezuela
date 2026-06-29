import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm md:p-12">
        <p className="mb-4 inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">MVP privado · datos ficticios</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Niño Terremoto Venezuela</h1>
        <p className="mt-6 max-w-3xl text-lg text-slate-600">
          Plataforma para registro y seguimiento interno de menores en emergencias por equipos autorizados. Diseñada con privacidad, RLS, auditoría y moderación desde la base.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white" href="/dashboard">Dashboard privado</Link>
          <Link className="rounded-xl border border-slate-300 px-5 py-3 font-semibold" href="/reportar">Reportar información</Link>
          <Link className="rounded-xl border border-slate-300 px-5 py-3 font-semibold" href="/caso/demo">Consultar código</Link>
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {["Sin datos reales", "Storage privado", "Auditoría activa"].map((item) => (
          <div key={item} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{item}</h2>
            <p className="mt-2 text-sm text-slate-600">Controles pensados para evitar exposición accidental de información sensible.</p>
          </div>
        ))}
      </section>
    </main>
  );
}
