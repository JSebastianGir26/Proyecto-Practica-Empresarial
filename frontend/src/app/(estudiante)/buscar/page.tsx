"use client";

/**
 * HU-06 · Buscar pasantías con filtros (mockup, pantallas 09 y 16)
 *
 * Los filtros viven en la URL (?q=&modalidad=&etapa=&ciudad=&page=) para
 * que "atrás" y compartir el enlace conserven la búsqueda.
 * Escenarios: filtrar resultados (con contador) y sin resultados
 * ("No encontramos pasantías con estos filtros" + "Limpiar filtros").
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useApi } from "@/lib/useApi";
import { MODALITY_OPTIONS, STAGE_OPTIONS } from "@/lib/format";
import type { Paginated, VacancyCard as Vacancy } from "@/types";
import VacancyCard from "@/components/VacancyCard";
import { EmptyState, ErrorState, PageHeader, PillGroup, SkeletonCards } from "@/components/ui";
import { IconChevronLeft, IconChevronRight, IconSearch } from "@/components/icons";

const PAGE_SIZE = 10;
const MODALIDADES = [{ value: "", label: "Todas" }, ...MODALITY_OPTIONS] as const;
const ETAPAS = [{ value: "", label: "Todas" }, ...STAGE_OPTIONS] as const;

// Opciones adicionales para filtros enriquecidos
const JORNADAS = [
  { value: "", label: "Todas" },
  { value: "completa", label: "Tiempo completo" },
  { value: "medio_tiempo", label: "Medio tiempo" },
] as const;

const NIVELES = [
  { value: "", label: "Todos" },
  { value: "tecnico", label: "Técnico" },
  { value: "tecnologico", label: "Tecnológico" },
  { value: "profesional", label: "Profesional" },
] as const;

interface Filters {
  q: string;
  modalidad: string;
  etapa: string;
  ciudad: string;
  jornada: string;
  nivel: string;
}

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    modalidad: params.get("modalidad") ?? "",
    etapa: params.get("etapa") ?? "",
    ciudad: params.get("ciudad") ?? "",
    jornada: params.get("jornada") ?? "",
    nivel: params.get("nivel") ?? "",
  };
}

function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const applied = readFilters(params);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const appliedKey = params.toString();

  const [draft, setDraft] = useState<Filters & { key: string }>({ ...applied, key: appliedKey });
  const current = draft.key === appliedKey ? draft : { ...applied, key: appliedKey };
  const setField = (field: keyof Filters) => (value: string) => setDraft({ ...current, [field]: value });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = new URLSearchParams();
  Object.entries(applied).forEach(([k, v]) => v && query.set(k, v));
  if (page > 1) query.set("page", String(page));
  const { data, error, loading, reload } = useApi<Paginated<Vacancy>>(`/vacantes/?${query}`);

  function go(filters: Filters, newPage = 1) {
    const next = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v.trim() && next.set(k, v.trim()));
    if (newPage > 1) next.set("page", String(newPage));
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: newPage !== page });
    setFiltersOpen(false);
  }

  const empty = { q: "", modalidad: "", etapa: "", ciudad: "", jornada: "", nivel: "" };
  const hasFilters = Object.values(applied).some(Boolean);
  const activeCount = Object.values(applied).filter(Boolean).length;
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <PageHeader
          title="Buscar pasantías"
          subtitle={data ? `${data.count} ${data.count === 1 ? "contrato de aprendizaje disponible" : "contratos de aprendizaje disponibles"}` : "Contratos de aprendizaje disponibles"}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
        <button
          type="button"
          className="btn btn-ghost w-full lg:hidden border border-slate-200 shadow-sm"
          aria-expanded={filtersOpen}
          aria-controls="filtros"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          {filtersOpen ? "Ocultar filtros" : `Filtros${activeCount ? ` (${activeCount})` : ""}`}
        </button>
        
        <form
          id="filtros"
          className={`bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex-col gap-5 lg:sticky lg:top-24 lg:flex ${filtersOpen ? "flex" : "hidden"}`}
          onSubmit={(e) => {
            e.preventDefault();
            go(current);
          }}
          aria-label="Filtros de búsqueda"
        >
          {/* Palabra clave */}
          <div className="flex flex-col gap-2">
            <label className="field-label text-xs font-semibold text-slate-700 uppercase tracking-wide" htmlFor="f-q">
              Palabra clave o Área
            </label>
            <input 
              id="f-q" 
              className="input bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" 
              placeholder="Ej. analista, desarrollo, contabilidad" 
              value={current.q} 
              onChange={(e) => setField("q")(e.target.value)} 
            />
          </div>

          {/* Nivel de Formación */}
          <div className="flex flex-col gap-2">
            <span className="field-label text-xs font-semibold text-slate-700 uppercase tracking-wide">Nivel académico</span>
            <PillGroup label="Nivel académico" options={NIVELES} value={current.nivel} onChange={setField("nivel")} />
          </div>

          {/* Modalidad */}
          <div className="flex flex-col gap-2">
            <span className="field-label text-xs font-semibold text-slate-700 uppercase tracking-wide">Modalidad</span>
            <PillGroup label="Modalidad" options={MODALIDADES} value={current.modalidad} onChange={setField("modalidad")} />
          </div>

          {/* Etapa de Formación */}
          <div className="flex flex-col gap-2">
            <span className="field-label text-xs font-semibold text-slate-700 uppercase tracking-wide">Etapa de formación</span>
            <PillGroup label="Etapa de formación" options={ETAPAS} value={current.etapa} onChange={setField("etapa")} />
          </div>

          {/* Tipo de Jornada */}
          <div className="flex flex-col gap-2">
            <span className="field-label text-xs font-semibold text-slate-700 uppercase tracking-wide">Jornada</span>
            <PillGroup label="Jornada" options={JORNADAS} value={current.jornada} onChange={setField("jornada")} />
          </div>

          {/* Ciudad */}
          <div className="flex flex-col gap-2">
            <label className="field-label text-xs font-semibold text-slate-700 uppercase tracking-wide" htmlFor="f-city">
              Ciudad
            </label>
            <input 
              id="f-city" 
              className="input bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" 
              placeholder="Ej. Bogotá, Medellín" 
              value={current.ciudad} 
              onChange={(e) => setField("ciudad")(e.target.value)} 
            />
          </div>

          {/* Botones de acción */}
          <button type="submit" className="btn btn-primary w-full shadow-sm hover:opacity-95 transition-all">
            Aplicar filtros
          </button>
          {hasFilters && (
            <button type="button" className="btn btn-ghost w-full border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => go(empty)}>
              Limpiar filtros
            </button>
          )}
        </form>

        {/* Sección de resultados */}
        <section className="flex min-w-0 flex-col gap-4" aria-live="polite" aria-busy={loading}>
          {data && (
            <p className="text-[14px] text-slate-500 font-medium">
              {data.count} {data.count === 1 ? "resultado" : "resultados"}
              {loading && " · actualizando…"}
            </p>
          )}

          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : !data ? (
            <SkeletonCards count={4} />
          ) : data.results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center">
              <EmptyState
                icon={<IconSearch size={40} />}
                title={hasFilters ? "No encontramos pasantías con estos filtros" : "Todavía no hay pasantías publicadas"}
                description={
                  hasFilters
                    ? "Prueba cambiando las palabras clave, ciudad o quita algunos de los filtros seleccionados."
                    : "Las empresas están preparando sus vacantes. Vuelve pronto."
                }
                action={
                  hasFilters && (
                    <button className="btn btn-primary shadow-sm" onClick={() => go(empty)}>
                      Limpiar filtros
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <div className={`flex flex-col gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
              {data.results.map((v) => (
                <VacancyCard key={v.id} vacancy={v} />
              ))}
            </div>
          )}

          {data && totalPages > 1 && (
            <nav className="flex justify-center gap-2 pt-4" aria-label="Páginas">
              <button className="pagebtn border border-slate-200 rounded-lg" disabled={page <= 1} onClick={() => go(applied, page - 1)} aria-label="Página anterior">
                <IconChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`pagebtn rounded-lg border border-slate-200 ${n === page ? "pagebtn-active bg-[#025a75] text-white border-transparent" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                  aria-current={n === page ? "page" : undefined}
                  onClick={() => go(applied, n)}
                >
                  {n}
                </button>
              ))}
              <button className="pagebtn border border-slate-200 rounded-lg" disabled={page >= totalPages} onClick={() => go(applied, page + 1)} aria-label="Página siguiente">
                <IconChevronRight size={16} />
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<SkeletonCards count={4} />}>
      <Search />
    </Suspense>
  );
}
