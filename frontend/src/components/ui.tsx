"use client";

/**
 * Piezas de interfaz reutilizables. Antes de crear un componente nuevo,
 * revisa si alguno de estos sirve.
 */
import { useId, useState } from "react";
import { IconAlert, IconCheck, IconPlus, IconX } from "./icons";
import { errorMessage } from "@/lib/api";

// --- Encabezado de página -----------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {back}
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[26px] sm:text-[30px]">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}

// --- Estados de carga, error y vacío -----------------------------------------

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      aria-hidden="true"
    />
  );
}

export function LoadingBlock({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-2" role="status">
      <Spinner className="text-brand-500" />
      {label}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card-soft animate-pulse space-y-3">
          <div className="h-3 w-40 rounded bg-line" />
          <div className="h-5 w-72 max-w-full rounded bg-line" />
          <div className="h-3 w-full rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-text/30 bg-rose-bg px-6 py-10 text-center">
      <IconAlert size={28} className="text-rose-text" />
      <p className="max-w-md text-rose-text">{errorMessage(error, "No pudimos cargar la información.")}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-dashed border-[#d7d3d3] bg-soft px-6 py-12 text-center">
      {icon && <div className="text-[#B7B4B4]">{icon}</div>}
      <p className="text-[19px] font-semibold">{title}</p>
      {description && <div className="max-w-md text-[15px] text-ink-2">{description}</div>}
      {action}
    </div>
  );
}

// --- Avisos -------------------------------------------------------------------

export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "warning" | "success" | "danger";
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const styles = {
    info: "border-brand-50 bg-brand-100 text-brand-900",
    success: "border-brand-50 bg-brand-100 text-brand-900",
    warning: "border-[#f0e2b6] bg-[#fdf8e7] text-[#5c4a0c]",
    danger: "border-rose-text/30 bg-rose-bg text-rose-text",
  }[tone];
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${styles}`} role={tone === "danger" ? "alert" : "status"}>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-[14.5px] opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Mensaje breve que aparece abajo y se cierra solo. */
export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-ink px-4 py-3 text-[14.5px] text-white shadow-frame sm:bottom-8"
      role="status"
    >
      <IconCheck size={18} className="shrink-0 text-brand-50" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white" aria-label="Cerrar">
        <IconX size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  function show(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage((current) => (current === text ? null : current)), 3500);
  }
  return { message, show, close: () => setMessage(null) };
}

// --- Formularios ----------------------------------------------------------------

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[13px] text-ink-3">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

/** Input con su etiqueta. Acepta todas las props de <input>. */
export function TextField({
  label,
  error,
  hint,
  ...props
}: { label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={id}>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        className={`input ${error ? "input-error" : ""} ${props.className ?? ""}`}
      />
    </Field>
  );
}

export function TextArea({
  label,
  error,
  hint,
  ...props
}: { label: string; error?: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={id}>
      <textarea
        rows={4}
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        className={`input resize-y ${error ? "input-error" : ""}`}
      />
    </Field>
  );
}

/** Selector de una opción con píldoras (modalidad, etapa…). */
export function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`pill ${value === opt.value ? "pill-active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Lista de etiquetas editable (habilidades, sectores). */
export function TagInput({
  label,
  value,
  onChange,
  placeholder = "Escribe y presiona Enter",
  max = 15,
  error,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  max?: number;
  error?: string;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();

  function add() {
    const text = draft.trim().replace(/\s+/g, " ");
    if (!text) return;
    if (!value.some((v) => v.toLowerCase() === text.toLowerCase()) && value.length < max) {
      onChange([...value, text]);
    }
    setDraft("");
  }

  return (
    <Field label={label} error={error} htmlFor={id}>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span key={tag} className="tagchip">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-brand-700 hover:text-rose-text"
              aria-label={`Quitar ${tag}`}
            >
              <IconX size={14} />
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="text-[14px] text-ink-3">Aún no has agregado ninguna.</span>}
      </div>
      {value.length < max && (
        <div className="flex gap-2">
          <input
            id={id}
            className="input"
            value={draft}
            placeholder={placeholder}
            maxLength={40}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="btn btn-secondary shrink-0" onClick={add} disabled={!draft.trim()}>
            <IconPlus size={16} /> Agregar
          </button>
        </div>
      )}
    </Field>
  );
}

// --- Barra de progreso (perfil completo) --------------------------------------

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="w-full">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progreso"}
      >
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${value}%` }} />
      </div>
      {label && <p className="mt-2 text-[13px] text-ink-2">{label}</p>}
    </div>
  );
}

// --- Avatar de empresa / persona ------------------------------------------------

/**
 * Logo de la empresa o sus iniciales. El color es siempre el mismo
 * (brand-900) en todas las pantallas: corrige el punto 3 de docs/diseno.
 */
export function Avatar({
  src,
  initials,
  size = 52,
  round = false,
}: {
  src?: string | null;
  initials: string;
  size?: number;
  round?: boolean;
}) {
  const radius = round ? "9999px" : `${Math.round(size * 0.26)}px`;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URLs firmadas de Supabase
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 border border-line bg-white object-contain"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center bg-brand-900 font-bold text-white"
      style={{ width: size, height: size, borderRadius: radius, fontSize: Math.round(size * 0.32) }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
