"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCase } from "@/lib/services/case-service";

export async function createCaseAction(values: unknown): Promise<{ error: string } | void> {
  let newId: string;
  try {
    const { data, error } = await createCase(values);
    if (error || !data) {
      return { error: error?.message ?? "No se pudo crear el caso." };
    }
    newId = data.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Datos inválidos. Revisa el formulario.";
    return { error: message };
  }

  revalidatePath("/casos");
  redirect(`/casos/${newId}` as never);
}
