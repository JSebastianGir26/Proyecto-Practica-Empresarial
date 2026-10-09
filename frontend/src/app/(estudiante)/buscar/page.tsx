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

interface Filters {
  q: string;
  modalidad: string;
  etapa: string;
  ciudad: string;
}

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    modalidad: params.get("modalidad") ?? "",
    etapa: params.get("etapa") ?? "",
    ciudad: params.get("ciudad") ?? "",
  };
}

function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const applied = readFilters(params);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const appliedKey = params.toString();

  // Borrador de filtros: se aplican al pulsar "Aplicar filtros".
  // Cuando cambia la URL (atrás, limpiar…), el borrador se reinicia.
  const [draft, setDraft] = useState<Filters & { key: string }>({ ...applied, key: appliedKey });
  const current = draft.key === appliedKey ? draft : { ...applied, key: appliedKey };
  const setField = (field: keyof Filters) => (value: string) => setDraft({ ...current, [field]: value });
  // En móvil los filtros se pliegan para que los resultados se vean primero.
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

  const empty = { q: "", modalidad: "", etapa: "", ciudad: "" };
  const hasFilters = Object.values(applied).some(Boolean);
  const activeCount = Object.values(applied).filter(Boolean).length;
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Buscar pasantías"
        subtitle={data ? `${data.count} ${data.count === 1 ? "contrato de aprendizaje disponible" : "contratos de aprendizaje disponibles"}` : "Contratos de aprendizaje disponibles"}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[280px_1fr] lg:gap-7">
        <button
          type="button"
          className="btn btn-ghost w-full lg:hidden"
          aria-expanded={filtersOpen}
          aria-controls="filtros"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          {filtersOpen ? "Ocultar filtros" : `Filtros${activeCount ? ` (${activeCount})` : ""}`}
        </button>
        <form
          id="filtros"
          className={`card-soft flex-col gap-5 lg:sticky lg:top-24 lg:flex ${filtersOpen ? "flex" : "hidden"}`}
          onSubmit={(e) => {
            e.preventDefault();
            go(current);
          }}
          aria-label="Filtros de búsqueda"
        >
          <div className="flex flex-col gap-2">
            <label className="field-label" htmlFor="f-q">
              Palabra clave
            </label>
            <input id="f-q" className="input" placeholder="Ej. analista de datos" value={current.q} onChange={(e) => setField("q")(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="field-label">Modalidad</span>
            <PillGroup label="Modalidad" options={MODALIDADES} value={current.modalidad} onChange={setField("modalidad")} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="field-label">Etapa de formación</span>
            <PillGroup label="Etapa de formación" options={ETAPAS} value={current.etapa} onChange={setField("etapa")} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="field-label" htmlFor="f-city">
              Ciudad
            </label>
            <input id="f-city" className="input" placeholder="Ej. Bogotá" value={current.ciudad} onChange={(e) => setField("ciudad")(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Aplicar filtros
          </button>
          {hasFilters && (
            <button type="button" className="btn btn-ghost w-full" onClick={() => go(empty)}>
              Limpiar filtros
            </button>
          )}
        </form>

        <section className="flex min-w-0 flex-col gap-4" aria-live="polite" aria-busy={loading}>
          {data && (
            <p className="text-[14px] text-ink-2">
              {data.count} {data.count === 1 ? "resultado" : "resultados"}
              {loading && " · actualizando…"}
            </p>
          )}

          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : !data ? (
            <SkeletonCards count={4} />
          ) : data.results.length === 0 ? (
            <EmptyState
              icon={<IconSearch size={40} />}
              title={hasFilters ? "No encontramos pasantías con estos filtros" : "Todavía no hay pasantías publicadas"}
              description={
                hasFilters
                  ? "Prueba con otra ciudad o modalidad, o quita el filtro de etapa de formación."
                  : "Las empresas están preparando sus vacantes. Vuelve pronto."
              }
              action={
                hasFilters && (
                  <button className="btn btn-primary" onClick={() => go(empty)}>
                    Limpiar filtros
                  </button>
                )
              }
            />
          ) : (
            <div className={`flex flex-col gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
              {data.results.map((v) => (
                <VacancyCard key={v.id} vacancy={v} />
              ))}
            </div>
          )}

          {data && totalPages > 1 && (
            <nav className="flex justify-center gap-2 pt-2" aria-label="Páginas">
              <button className="pagebtn" disabled={page <= 1} onClick={() => go(applied, page - 1)} aria-label="Página anterior">
                <IconChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`pagebtn ${n === page ? "pagebtn-active" : ""}`}
                  aria-current={n === page ? "page" : undefined}
                  onClick={() => go(applied, n)}
                >
                  {n}
                </button>
              ))}
              <button className="pagebtn" disabled={page >= totalPages} onClick={() => go(applied, page + 1)} aria-label="Página siguiente">
                <IconChevronRight size={16} />
              </button>
            </nav>
          )}
        </section>
      </div>
    </>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<SkeletonCards count={4} />}>
      <Search />
    </Suspense>
  );
}
