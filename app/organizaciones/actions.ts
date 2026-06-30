"use server";

import { revalidatePath } from "next/cache";
import { createOrganization, updateOrganization } from "@/lib/services/organization-service";

export async function createOrgAction(values: unknown): Promise<{ ok: true } | { error: string }> {
  try {
    const { error } = await createOrganization(values);
    if (error) {
      return { error: error.message ?? "No se pudo crear la organización." };
    }
    revalidatePath("/organizaciones");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Datos inválidos." };
  }
}

export async function toggleOrgActiveAction(input: { id: string; active: boolean }): Promise<{ ok: true } | { error: string }> {
  try {
    const { error } = await updateOrganization({ id: input.id, active: input.active });
    if (error) {
      return { error: error.message ?? "No se pudo actualizar la organización." };
    }
    revalidatePath("/organizaciones");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Datos inválidos." };
  }
}
