export const dynamic = "force-dynamic";

import { getPublicCaseByCode } from "@/lib/services/case-service";

export default async function PublicCasePage({ params }: { params: { codigo: string } }) {
  const { data: item } = await getPublicCaseByCode(params.codigo);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Consulta pública limitada</h1>
      <p className="mt-3 text-slate-600">Esta vista nunca muestra ubicación exacta, salud, familia, contactos, eventos, entregas ni traslados.</p>
      {!item ? (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">No encontramos un caso con ese código.</div>
      ) : (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Código</p>
          <h2 className="text-2xl font-bold">{item.public_code}</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-slate-500">Nombre parcial</dt><dd className="font-medium">{item.display_name}</dd></div>
            <div><dt className="text-sm text-slate-500">Edad aprox.</dt><dd className="font-medium">{item.approximate_age ?? "No informada"}</dd></div>
            <div><dt className="text-sm text-slate-500">Sexo</dt><dd className="font-medium">{item.sex}</dd></div>
            <div><dt className="text-sm text-slate-500">Estado</dt><dd className="font-medium">{item.status}</dd></div>
            <div><dt className="text-sm text-slate-500">Zona general</dt><dd className="font-medium">{item.zone_general ?? "No pública"}</dd></div>
          </dl>
        </section>
      )}
    </main>
  );
}
