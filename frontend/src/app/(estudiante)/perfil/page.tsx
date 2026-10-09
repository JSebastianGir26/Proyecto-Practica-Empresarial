"use client";

/**
 * HU-04 · Editar mi perfil  ·  HU-05 · Subir hoja de vida
 * Escenario: agrego la habilidad "Power BI", pulso "Guardar" → aparece
 * en mi perfil y el porcentaje de perfil completo aumenta.
 */
import { useState } from "react";
import { apiFetch, ApiError, errorMessage } from "@/lib/api";
import { updateSessionName } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { initials } from "@/lib/format";
import type { StudentProfile } from "@/types";
import CvUploader from "@/components/CvUploader";
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

type Form = Pick<StudentProfile, "full_name" | "program" | "institution" | "city" | "about" | "skills"> & {
  semester: string;
};

function toForm(p: StudentProfile): Form {
  return {
    full_name: p.full_name,
    program: p.program,
    institution: p.institution,
    semester: p.semester ? String(p.semester) : "",
    city: p.city,
    about: p.about,
    skills: p.skills,
  };
}

export default function PerfilPage() {
  const { data: profile, error, reload, setData } = useApi<StudentProfile>("/estudiantes/perfil/");
  const [edits, setEdits] = useState<Partial<Form>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!profile) return <LoadingBlock />;

  const form: Form = { ...toForm(profile), ...edits };
  const dirty = Object.keys(edits).length > 0;
  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setEdits((e) => ({ ...e, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setErrors({ full_name: "Tu nombre es obligatorio." });
      return;
    }
    setSaving(true);
    setErrors({});
    setSaveError(null);
    try {
      const updated = await apiFetch<StudentProfile>("/estudiantes/perfil/", {
        method: "PATCH",
        body: { ...form, semester: form.semester ? Number(form.semester) : null },
      });
      setData(updated);
      setEdits({});
      updateSessionName(updated.full_name);
      toast.show(`Perfil guardado. Está al ${updated.completion}%.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setErrors(err.fieldErrors());
      else setSaveError(errorMessage(err, "No pudimos guardar tus cambios."));
    } finally {
      setSaving(false);
    }
  }

  const subtitle = [profile.program, profile.semester && `${profile.semester}º semestre`].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader title="Mi perfil" subtitle="Así te ven las empresas cuando te postulas." />

      <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        <aside className="card-soft flex flex-col items-center gap-3.5 text-center lg:sticky lg:top-24">
          <Avatar initials={initials(profile.full_name || profile.email)} size={80} round />
          <div>
            <p className="text-[19px] font-semibold">{profile.full_name || "Sin nombre"}</p>
            {subtitle && <p className="text-[14px] text-ink-2">{subtitle}</p>}
            {profile.institution && <p className="text-[14px] text-ink-2">{profile.institution}</p>}
          </div>
          <ProgressBar value={profile.completion} label={`Perfil ${profile.completion}% completo`} />
          {profile.missing_fields.length > 0 && (
            <p className="text-[13px] text-ink-2">Te falta: {profile.missing_fields.join(", ")}.</p>
          )}
        </aside>

        <div className="flex flex-col gap-6">
          <section className="card flex flex-col gap-4">
            <h2 className="section-title">Hoja de vida</h2>
            <p className="-mt-2 text-[14px] text-ink-2">Solo PDF, máximo 5 MB. La usamos en todas tus postulaciones.</p>
            <CvUploader profile={profile} onUploaded={(updated) => setData(updated)} />
          </section>

          <form className="card flex flex-col gap-5" onSubmit={save} noValidate>
            <h2 className="section-title">Datos personales y académicos</h2>
            <TextField label="Nombre completo" value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} error={errors.full_name} maxLength={150} autoComplete="name" />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Carrera o programa" placeholder="Ej. Ingeniería Industrial" value={form.program} onChange={(e) => set("program")(e.target.value)} error={errors.program} maxLength={150} />
              <TextField label="Institución" placeholder="Ej. SENA, Universidad de Antioquia" value={form.institution} onChange={(e) => set("institution")(e.target.value)} error={errors.institution} maxLength={150} />
              <TextField label="Semestre o trimestre" type="number" inputMode="numeric" min={1} max={12} placeholder="Ej. 8" value={form.semester} onChange={(e) => set("semester")(e.target.value)} error={errors.semester} />
              <TextField label="Ciudad" placeholder="Ej. Bogotá" value={form.city} onChange={(e) => set("city")(e.target.value)} error={errors.city} maxLength={80} autoComplete="address-level2" />
            </div>
            <TextArea
              label="Sobre mí"
              placeholder="Cuéntales a las empresas qué te interesa y qué quieres aprender."
              value={form.about}
              onChange={(e) => set("about")(e.target.value)}
              error={errors.about}
              maxLength={1500}
              rows={5}
            />
            <TagInput label="Habilidades" value={form.skills} onChange={set("skills")} placeholder="Ej. Power BI" max={30} error={errors.skills} />

            {saveError && <Notice tone="danger">{saveError}</Notice>}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
                {saving && <Spinner />}
                {saving ? "Guardando…" : "Guardar"}
              </button>
              {dirty && !saving && (
                <button type="button" className="btn btn-ghost" onClick={() => setEdits({})}>
                  Descartar cambios
                </button>
              )}
              {!dirty && <span className="text-[13.5px] text-ink-3">Sin cambios por guardar</span>}
            </div>
          </form>
        </div>
      </div>

      <Toast message={toast.message} onClose={toast.close} />
    </>
  );
}
