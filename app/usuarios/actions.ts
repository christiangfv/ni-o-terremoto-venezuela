"use server";

import { revalidatePath } from "next/cache";
import { createTeamUser, updateProfile } from "@/lib/services/profile-service";

export async function createUserAction(values: unknown): Promise<{ ok: true } | { error: string }> {
  try {
    // The service layer calls requireAdmin() before touching the service-role client.
    const { error } = await createTeamUser(values);
    if (error) {
      return { error: error.message ?? "No se pudo crear el usuario." };
    }
    revalidatePath("/usuarios");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Datos inválidos." };
  }
}

export async function updateUserAction(values: unknown): Promise<{ ok: true } | { error: string }> {
  try {
    // The service layer calls requireAdmin(); RLS enforces it again at the DB.
    const { error } = await updateProfile(values);
    if (error) {
      return { error: error.message ?? "No se pudo actualizar el usuario." };
    }
    revalidatePath("/usuarios");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Datos inválidos." };
  }
}
