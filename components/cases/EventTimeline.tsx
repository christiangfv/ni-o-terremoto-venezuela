import type { CaseEvent } from "@/lib/types/domain";

export function EventTimeline({ events }: { events: CaseEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">Sin eventos registrados.</p>;
  }

  return (
    <ol className="space-y-3 border-l border-slate-200 pl-4">
      {events.map((event) => (
        <li key={event.id} className="rounded-lg bg-white p-3 shadow-sm">
          <p className="font-medium text-slate-900">{event.title}</p>
          <p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString("es-CL")}</p>
          <p className="mt-1 text-xs text-slate-500">Tipo: {event.type}</p>
        </li>
      ))}
    </ol>
  );
}
