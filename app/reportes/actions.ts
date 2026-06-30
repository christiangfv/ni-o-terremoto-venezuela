"use server";

import { revalidatePath } from "next/cache";
import { reviewPublicReportById } from "@/lib/services/report-service";

export async function reviewReportAction(input: unknown): Promise<{ ok: true } | { error: string }> {
  try {
    // reviewPublicReportById validates `input` with reportReviewSchema and
    // updates through the RLS-enforcing SSR client (moderators only).
    const { error } = await reviewPublicReportById(input);
    if (error) {
      return { error: "No se pudo actualizar el reporte. Verifica tus permisos e intenta nuevamente." };
    }
    revalidatePath("/reportes");
    return { ok: true };
  } catch {
    // Zod validation or unexpected failure.
    return { error: "Datos inválidos. Revisa el estado y las notas antes de continuar." };
  }
}
