"use client";

/**
 * HU-05 · Subir hoja de vida (mockup, pantalla 15).
 * Tres estados: vacío, error ("Formato no permitido…" + "Intentar de
 * nuevo") y correcto (nombre, tamaño + "Reemplazar").
 */
import { useRef, useState } from "react";
import { apiFetch, ApiError, errorMessage } from "@/lib/api";
import { formatFileSize, formatRelative } from "@/lib/format";
import type { StudentProfile } from "@/types";
import { IconAlert, IconCheck, IconFile, IconUpload } from "./icons";
import { Spinner } from "./ui";

const MAX_BYTES = 5 * 1024 * 1024;
const FORMAT_ERROR = "Formato no permitido. Sube un PDF de máximo 5 MB.";

export default function CvUploader({
  profile,
  onUploaded,
}: {
  profile: Pick<StudentProfile, "cv_url" | "cv_filename" | "cv_size" | "cv_uploaded_at">;
  onUploaded: (profile: StudentProfile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<{ file: string; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function pick() {
    inputRef.current?.click();
  }

  async function upload(file: File) {
    // La misma validación del backend, para responder al instante.
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size > MAX_BYTES) {
      setError({ file: file.name, message: FORMAT_ERROR });
      return;
    }
    setError(null);
    setUploading(true);
    const body = new FormData();
    body.append("cv", file);
    try {
      const updated = await apiFetch<StudentProfile>("/estudiantes/perfil/hoja-de-vida/", { method: "PUT", body });
      onUploaded(updated);
    } catch (err) {
      const message = err instanceof ApiError && err.status === 400 ? err.fieldErrors().cv ?? FORMAT_ERROR : errorMessage(err);
      setError({ file: file.name, message });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      className="sr-only"
      tabIndex={-1}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
      }}
    />
  );

  if (uploading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-line bg-white px-5 py-6 text-ink-2" role="status">
        <Spinner className="text-brand-500" /> Subiendo tu hoja de vida…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3.5 rounded-2xl border border-rose-text bg-rose-bg p-5">
        {input}
        <div className="flex flex-col items-center gap-2 rounded-xl border-[1.5px] border-rose-text bg-white px-4 py-6 text-center" role="alert">
          <IconAlert size={30} className="text-rose-text" />
          <p className="break-all text-[14.5px] font-semibold">{error.file}</p>
          <p className="text-[13.5px] text-rose-text">{error.message}</p>
        </div>
        <button type="button" className="btn btn-secondary border-rose-text text-rose-text hover:bg-white" onClick={pick}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (profile.cv_url) {
    return (
      <div className="flex flex-col gap-3">
        {input}
        <div className="flex items-center gap-3.5 rounded-xl border-[1.5px] border-line bg-white px-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-100 text-brand-900">
            <IconFile size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <a href={profile.cv_url} target="_blank" rel="noreferrer" className="block truncate text-[14.5px] font-semibold text-ink hover:text-brand-700">
              {profile.cv_filename || "Hoja de vida.pdf"}
            </a>
            <p className="text-[12.5px] text-ink-2">
              {[formatFileSize(profile.cv_size), profile.cv_uploaded_at && `Subido ${formatRelative(profile.cv_uploaded_at).toLowerCase()}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <IconCheck size={18} className="shrink-0 text-brand-700" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={pick}>
            Reemplazar
          </button>
          <a href={profile.cv_url} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Ver PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {input}
      <button
        type="button"
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={`flex flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? "border-brand-500 bg-brand-100" : "border-[#d7d3d3] bg-white hover:border-brand-500"
        }`}
      >
        <IconUpload size={30} className="text-brand-500" />
        <span className="text-[14.5px] font-semibold">Arrastra tu hoja de vida</span>
        <span className="text-[13px] text-ink-2">o haz clic para elegir un archivo PDF (máximo 5 MB)</span>
      </button>
      <button type="button" className="btn btn-secondary" onClick={pick}>
        Elegir archivo
      </button>
    </div>
  );
}
