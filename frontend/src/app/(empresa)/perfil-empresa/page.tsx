"use client";

/**
 * HU-14 · Perfil de empresa (mockup, pantalla 12)
 * Escenario: cambio el logo y pulso "Guardar cambios" → el nuevo logo
 * aparece en mis vacantes publicadas.
 */
import { useRef, useState } from "react";
import { apiFetch, ApiError, errorMessage } from "@/lib/api";
import { updateSessionName } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import type { CompanyProfile } from "@/types";
import { CompanyStatusNotice } from "@/components/company";
import {
  Avatar,
  ErrorState,
  LoadingBlock,
  Notice,
  PageHeader,
  ProgressBar,
  Spinner,
  TagInput,
  TextArea,
  TextField,
  Toast,
  useToast,
} from "@/components/ui";

type Form = Pick<CompanyProfile, "legal_name" | "nit" | "city" | "website" | "about" | "sectors">;

export default function PerfilEmpresaPage() {
  const { data: company, error, reload, setData } = useApi<CompanyProfile>("/empresas/perfil/");
  const [edits, setEdits] = useState<Partial<Form>>({});
  const [logo, setLogo] = useState<{ file: File; preview: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!company) return <LoadingBlock />;

  const form: Form = {
    legal_name: company.legal_name,
    nit: company.nit,
    city: company.city,
    website: company.website,
    about: company.about,
    sectors: company.sectors,
    ...edits,
  };
  const dirty = Object.keys(edits).length > 0 || logo !== null;
  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setEdits((e) => ({ ...e, [key]: value }));

  function pickLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setErrors((e) => ({ ...e, logo: "Sube una imagen (PNG o JPG) de máximo 2 MB." }));
      return;
    }
    setErrors((e) => {
      const rest = { ...e };
      delete rest.logo;
      return rest;
    });
    setLogo({ file, preview: URL.createObjectURL(file) });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.legal_name.trim()) {
      setErrors({ legal_name: "La razón social es obligatoria." });
      return;
    }
    setSaving(true);
    setErrors({});
    setSaveError(null);
    try {
      let updated = await apiFetch<CompanyProfile>("/empresas/perfil/", { method: "PATCH", body: form });
      if (logo) {
        const body = new FormData();
        body.append("logo", logo.file);
        updated = await apiFetch<CompanyProfile>("/empresas/perfil/", { method: "PATCH", body });
      }
      setData(updated);
      setEdits({});
      setLogo(null);
      updateSessionName(updated.legal_name);
      toast.show("Cambios guardados.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setErrors(err.fieldErrors());
      else setSaveError(errorMessage(err, "No pudimos guardar los cambios."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        title="Editar perfil"
        subtitle="Un perfil completo genera confianza en los estudiantes y agiliza la aprobación."
        actions={
          <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
            {saving && <Spinner />}
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        }
      />

      <div className="mb-6">
        <CompanyStatusNotice company={company} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr] lg:gap-7">
        <aside className="card-soft flex flex-col items-center gap-3.5 text-center">
          <Avatar src={logo?.preview ?? company.logo_url} initials={company.initials} size={88} />
          <div>
            <p className="text-[19px] font-semibold">{form.legal_name || "Tu empresa"}</p>
            <p className="text-[14px] text-ink-2">{[form.city, form.sectors[0]].filter(Boolean).join(" · ")}</p>
          </div>
          <ProgressBar value={company.completion} label={`Perfil ${company.completion}% completo`} />
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => pickLogo(e.target.files?.[0])}
          />
          <button type="button" className="btn btn-secondary w-full" onClick={() => fileRef.current?.click()}>
            {company.logo_url || logo ? "Cambiar logo" : "Subir logo"}
          </button>
          {logo && <p className="text-[13px] text-ink-2">Pulsa &quot;Guardar cambios&quot; para aplicar el nuevo logo.</p>}
          {errors.logo && <p className="field-error">{errors.logo}</p>}
        </aside>

        <div className="card flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Razón social" value={form.legal_name} onChange={(e) => set("legal_name")(e.target.value)} error={errors.legal_name} maxLength={150} autoComplete="organization" />
            <TextField label="NIT" placeholder="901.234.567-8" value={form.nit} onChange={(e) => set("nit")(e.target.value)} error={errors.nit} maxLength={20} />
            <TextField label="Ciudad" placeholder="Ej. Bogotá" value={form.city} onChange={(e) => set("city")(e.target.value)} error={errors.city} maxLength={80} />
            <TextField label="Sitio web" placeholder="www.tuempresa.com.co" value={form.website} onChange={(e) => set("website")(e.target.value)} error={errors.website} maxLength={200} />
          </div>
          <TextArea
            label="Sobre la empresa"
            placeholder="¿A qué se dedica tu empresa y cómo acompaña a sus practicantes?"
            value={form.about}
            onChange={(e) => set("about")(e.target.value)}
            error={errors.about}
            maxLength={2000}
            rows={5}
          />
          <TagInput label="Sectores" value={form.sectors} onChange={set("sectors")} placeholder="Ej. Tecnología" max={10} error={errors.sectors} />
          {saveError && <Notice tone="danger">{saveError}</Notice>}
        </div>
      </div>
      <Toast message={toast.message} onClose={toast.close} />
    </form>
  );
}
