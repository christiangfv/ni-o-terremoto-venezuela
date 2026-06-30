"use client";

import { useRef, useState, useTransition } from "react";
import { uploadCasePhotoAction } from "@/app/casos/[id]/actions";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function PhotoUpload({ caseId }: { caseId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setFeedback({ kind: "error", message: "Selecciona una imagen." });
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setFeedback({ kind: "error", message: "Formato no permitido. Usa JPG, PNG o WEBP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setFeedback({ kind: "error", message: "La imagen excede 5MB." });
      return;
    }

    const formData = new FormData();
    formData.set("caseId", caseId);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadCasePhotoAction(formData);
      if ("error" in result) {
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      setFeedback({ kind: "ok", message: "Foto subida correctamente." });
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Subir foto</h2>
        <p className="mt-1 text-sm text-slate-500">
          Las fotos se guardan en almacenamiento privado y solo son visibles para personal autorizado. Formatos JPG, PNG o
          WEBP, máximo 5MB.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={isPending}
        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "Subiendo..." : "Subir foto"}
      </button>
      {feedback ? (
        <p className={`text-sm ${feedback.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>{feedback.message}</p>
      ) : null}
    </form>
  );
}
