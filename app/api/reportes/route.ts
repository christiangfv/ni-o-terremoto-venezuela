export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPublicReport } from "@/lib/services/report-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await createPublicReport(body);
    if (error) {
      return NextResponse.json({ error: "Reporte rechazado por políticas de seguridad" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, report: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
}
