"use client";

/**
 * HU-15 · Publicar vacante (mockup, pantalla 10).
 * Escenarios:
 *   - Publicar con campos completos → "Pendiente de revisión"
 *   - Guardar borrador con el formulario incompleto → "Borrador"
 *   - Publicar sin título → el campo se marca como obligatorio
 *
 * Las acciones van en una barra superior fija para que se vean sin
 * importar lo largo del formulario.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError, errorMessage } from "@/lib/api";
import { MODALITY_OPTIONS, STAGE_OPTIONS, VACANCY_CHIP } from "@/lib/format";
import type { CompanyVacancy, Modality, Stage } from "@/types";
import { IconPlus, IconX } from "./icons";
import { Field, Notice, PillGroup, Spinner, TagInput, TextArea, TextField } from "./ui";

interface FormState {
  title: string;
  city: string;
  openings: string;
  modality: Modality;
  stage: Stage;
  stipend: string;
  description: string;
  requirements: string[];
  skills: string[];
}

const REQUIRED: Partial<Record<keyof FormState, string>> = {
  title: "El título del puesto es obligatorio.",
  city: "La ciudad es obligatoria.",
  description: "La descripción es obligatoria.",
};

function initialState(v?: CompanyVacancy): FormState {
  return {
    title: v?.title ?? "",
    city: v?.city ?? "",
    openings: String(v?.openings ?? 1),
    modality: v?.modality ?? "PRESENCIAL",
    stage: v?.stage ?? "PRODUCTIVA",
    stipend: v?.stipend ?? "",
    description: v?.description ?? "",
    requirements: v?.requirements ?? [],
    skills: v?.skills ?? [],
  };
}

export default function VacancyForm({ vacancy }: { vacancy?: CompanyVacancy }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(vacancy));
  const [newRequirement, setNewRequirement] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  // Si una vacante nueva se guardó pero no se pudo publicar, los
  // siguientes intentos la actualizan en lugar de crear otra.
  const [createdId, setCreatedId] = useState<number | null>(null);
  const targetId = vacancy?.id ?? createdId;

  const isDraft = !vacancy || vacancy.status === "BORRADOR" || vacancy.status === "RECHAZADA";
  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const rest = { ...e };
        delete rest[key];
        return rest;
      });
    }
  };

  function payload() {
    const requirements = newRequirement.trim() ? [...form.requirements, newRequirement.trim()] : form.requirements;
    return { ...form, requirements, openings: Math.max(1, Number(form.openings) || 1) };
  }

  function validateRequired() {
    const found: Record<string, string> = {};
    for (const [key, message] of Object.entries(REQUIRED)) {
      if (!String(form[key as keyof FormState]).trim()) found[key] = message as string;
    }
    return found;
  }

  async function submit(mode: "draft" | "publish") {
    setFormError(null);
    // Publicar (o editar una vacante ya revisada) exige los obligatorios.
    if (mode === "publish" || !isDraft) {
      const found = validateRequired();
      setErrors(found);
      if (Object.keys(found).length) {
        document.getElementById(`v-${Object.keys(found)[0]}`)?.focus();
        return;
      }
    } else {
      setErrors({});
    }

    setSaving(mode);
    try {
      const saved = targetId
        ? await apiFetch<CompanyVacancy>(`/vacantes/mias/${targetId}/`, { method: "PATCH", body: payload() })
        : await apiFetch<CompanyVacancy>("/vacantes/mias/", { method: "POST", body: payload() });
      setCreatedId(saved.id);

      if (mode === "publish" && (saved.status === "BORRADOR" || saved.status === "RECHAZADA")) {
        await apiFetch(`/vacantes/mias/${saved.id}/publicar/`, { method: "POST" });
      }
      router.push(`/vacantes?ok=${mode === "publish" || !isDraft ? "enviada" : "borrador"}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const fields = err.fieldErrors();
        setErrors(fields);
        if (!Object.keys(fields).some((k) => k in form)) setFormError(errorMessage(err));
      } else {
        setFormError(errorMessage(err, "No pudimos guardar la vacante."));
      }
      setSaving(null);
    }
  }

  function addRequirement() {
    const text = newRequirement.trim();
    if (text && !form.requirements.includes(text)) set("requirements")([...form.requirements, text]);
    setNewRequirement("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("publish");
      }}
      noValidate
      className="-mx-4 -mt-6 sm:-mx-6 sm:-mt-10"
    >
      <div
        className="sticky z-30 flex flex-col gap-3 border-b border-line bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 64px)" }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-[22px]">{vacancy ? "Editar vacante" : "Nueva vacante"}</h1>
          {vacancy && <span className={`chip ${VACANCY_CHIP[vacancy.status]}`}>{vacancy.status_display}</span>}
        </div>
        <div className="flex gap-2.5">
          {isDraft ? (
            <>
              <button type="button" className="btn btn-secondary flex-1 sm:flex-none" disabled={saving !== null} onClick={() => submit("draft")}>
                {saving === "draft" && <Spinner />}
                Guardar borrador
              </button>
              <button type="submit" className="btn btn-primary flex-1 sm:flex-none" disabled={saving !== null}>
                {saving === "publish" && <Spinner />}
                {vacancy?.status === "RECHAZADA" ? "Reenviar a revisión" : "Publicar vacante"}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={() => router.push("/vacantes")}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary flex-1 sm:flex-none" disabled={saving !== null}>
                {saving && <Spinner />}
                Guardar cambios
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-[820px] flex-col gap-6 px-4 py-8 sm:px-6">
        {vacancy?.status === "RECHAZADA" && (
          <Notice tone="danger" title="Esta vacante fue rechazada">
            {vacancy.rejection_reason ? `Motivo: ${vacancy.rejection_reason}. ` : ""}Corrígela y reenvíala a revisión.
          </Notice>
        )}
        {vacancy && !isDraft && (
          <Notice tone="warning">
            Si guardas cambios, la vacante vuelve a revisión y deja de verse hasta que un administrador la apruebe de nuevo.
          </Notice>
        )}
        {formError && <Notice tone="danger">{formError}</Notice>}

        <TextField
          id="v-title"
          label="Título del puesto"
          placeholder="Ej. Practicante de Análisis de Datos"
          value={form.title}
          onChange={(e) => set("title")(e.target.value)}
          error={errors.title}
          maxLength={150}
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="v-city" label="Ciudad" placeholder="Ej. Bogotá" value={form.city} onChange={(e) => set("city")(e.target.value)} error={errors.city} maxLength={80} required />
          <TextField
            label="Vacantes disponibles"
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={form.openings}
            onChange={(e) => set("openings")(e.target.value)}
            error={errors.openings}
          />
        </div>
        <Field label="Modalidad">
          <PillGroup label="Modalidad" options={MODALITY_OPTIONS} value={form.modality} onChange={set("modality")} />
        </Field>
        <Field label="Etapa del contrato de aprendizaje">
          <PillGroup label="Etapa" options={STAGE_OPTIONS} value={form.stage} onChange={set("stage")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Duración">
            <div className="rounded-btn bg-brand-100 px-3.5 py-3 text-[15px] font-semibold text-brand-900">6 meses (fijo por normativa)</div>
          </Field>
          <TextField
            label="Apoyo de sostenimiento"
            placeholder="Ej. 100% de un SMLV"
            value={form.stipend}
            onChange={(e) => set("stipend")(e.target.value)}
            error={errors.stipend}
            maxLength={120}
          />
        </div>
        <TextArea
          id="v-description"
          label="Descripción"
          placeholder="Describe las responsabilidades y el acompañamiento durante la etapa productiva."
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          error={errors.description}
          maxLength={4000}
          rows={6}
          required
        />

        <Field label="Requisitos" error={errors.requirements}>
          <ul className="flex flex-col gap-2">
            {form.requirements.map((req) => (
              <li key={req} className="flex items-start justify-between gap-3 rounded-btn border border-line bg-soft px-3.5 py-2.5 text-[14.5px]">
                <span>{req}</span>
                <button
                  type="button"
                  className="mt-0.5 text-ink-3 hover:text-rose-text"
                  onClick={() => set("requirements")(form.requirements.filter((r) => r !== req))}
                  aria-label={`Quitar requisito ${req}`}
                >
                  <IconX size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Ej. Conocimientos básicos de SQL y Excel avanzado"
              value={newRequirement}
              maxLength={200}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRequirement();
                }
              }}
              aria-label="Nuevo requisito"
            />
            <button type="button" className="btn btn-secondary shrink-0" onClick={addRequirement} disabled={!newRequirement.trim()}>
              <IconPlus size={16} /> Agregar requisito
            </button>
          </div>
        </Field>

        <TagInput label="Habilidades (skills)" value={form.skills} onChange={set("skills")} placeholder="Ej. SQL" error={errors.skills} />
      </div>
    </form>
  );
}
