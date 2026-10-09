import type { ApplicationStatus } from "@/types";

/**
 * Línea de tiempo de una postulación (HU-10). El mockup pide mantener
 * "el timeline de Seguimiento con color de progreso".
 */
const STEPS: { key: ApplicationStatus; label: string }[] = [
  { key: "APLICADO", label: "Aplicado" },
  { key: "EN_REVISION", label: "En revisión" },
  { key: "ENTREVISTA", label: "Entrevista" },
  { key: "ACEPTADO", label: "Resultado" },
];

const ORDER: Record<ApplicationStatus, number> = {
  APLICADO: 0,
  EN_REVISION: 1,
  ENTREVISTA: 2,
  ACEPTADO: 3,
  RECHAZADO: 3,
};

export default function ApplicationTimeline({ status }: { status: ApplicationStatus }) {
  const current = ORDER[status];
  const rejected = status === "RECHAZADO";

  return (
    <ol className="flex items-center" aria-label="Progreso de la postulación">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const isLast = i === STEPS.length - 1;
        const label = isLast ? (rejected ? "Rechazado" : status === "ACEPTADO" ? "Aceptado" : step.label) : step.label;
        const dot = !done
          ? "border-line bg-white"
          : isLast && rejected
            ? "border-ink-3 bg-ink-3"
            : isLast
              ? "border-rose-text bg-rose-text"
              : "border-brand-500 bg-brand-500";
        return (
          <li key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`} aria-current={i === current ? "step" : undefined}>
            <div className="flex flex-col items-center gap-1.5">
              <span className={`h-3.5 w-3.5 rounded-full border-2 ${dot}`} />
              <span className={`whitespace-nowrap text-[11.5px] sm:text-[12.5px] ${done ? "font-semibold text-ink" : "text-ink-3"}`}>
                {label}
              </span>
            </div>
            {!isLast && <span className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < current ? "bg-brand-500" : "bg-line"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
