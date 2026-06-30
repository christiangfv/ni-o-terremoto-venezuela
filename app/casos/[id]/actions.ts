"use server";

import { revalidatePath } from "next/cache";
import { updateCase, uploadCasePhoto } from "@/lib/services/case-service";
import { createHandover, createTransfer } from "@/lib/services/operations-service";
import type { CaseStatus } from "@/lib/types/domain";

type ActionResult = { ok: true } | { error: string };

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "No se pudo completar la operación.";
}

export async function updateCaseStatusAction({ id, status }: { id: string; status: CaseStatus }): Promise<ActionResult> {
  try {
    const { error } = await updateCase({ id, status });
    if (error) return { error: describeError(error) };
    revalidatePath(`/casos/${id}` as never);
    return { ok: true };
  } catch (error) {
    return { error: describeError(error) };
  }
}

export async function createHandoverAction(values: unknown): Promise<ActionResult> {
  try {
    const { data, error } = await createHandover(values);
    if (error) return { error: describeError(error) };
    if (data?.case_id) revalidatePath(`/casos/${data.case_id}` as never);
    return { ok: true };
  } catch (error) {
    return { error: describeError(error) };
  }
}

export async function createTransferAction(values: unknown): Promise<ActionResult> {
  try {
    const { data, error } = await createTransfer(values);
    if (error) return { error: describeError(error) };
    if (data?.case_id) revalidatePath(`/casos/${data.case_id}` as never);
    return { ok: true };
  } catch (error) {
    return { error: describeError(error) };
  }
}

export async function uploadCasePhotoAction(formData: FormData): Promise<ActionResult> {
  try {
    const caseId = String(formData.get("caseId") ?? "").trim();
    const file = formData.get("file");

    if (!caseId) return { error: "Falta el identificador del caso." };
    if (!(file instanceof File) || file.size === 0) return { error: "Selecciona una imagen válida." };

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.type)) return { error: "Formato no permitido. Usa JPG, PNG o WEBP." };
    if (file.size > 5 * 1024 * 1024) return { error: "La imagen excede 5MB." };

    const { error } = await uploadCasePhoto({ caseId, file });
    if (error) return { error: describeError(error) };

    revalidatePath(`/casos/${caseId}` as never);
    return { ok: true };
  } catch (error) {
    return { error: describeError(error) };
  }
}
