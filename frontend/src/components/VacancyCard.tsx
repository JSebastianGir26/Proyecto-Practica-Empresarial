import Link from "next/link";
import type { VacancyCard as Vacancy } from "@/types";
import { Avatar } from "./ui";

/** Tarjeta de resultado de búsqueda (HU-06, mockup pantalla 09). */
export default function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  return (
    <Link
      href={`/buscar/${vacancy.id}`}
      className="group flex gap-4 rounded-[14px] border border-line bg-white p-4 text-ink transition-shadow hover:border-brand-50 hover:text-ink hover:shadow-card sm:p-5"
    >
      <Avatar src={vacancy.company.logo_url} initials={vacancy.company.initials} size={48} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="kicker truncate">
          {vacancy.company.name} · {vacancy.city}
        </p>
        <p className="text-[18px] font-semibold leading-snug group-hover:text-brand-900 sm:text-[19px]">{vacancy.title}</p>
        {vacancy.summary && <p className="line-clamp-2 text-[14.5px] text-ink-2">{vacancy.summary}</p>}
        <div className="mt-1.5 flex flex-wrap gap-2">
          <span className="chip chip-info">{vacancy.modality_display}</span>
          <span className="chip chip-bright">{vacancy.duration_months} meses</span>
          <span className="chip chip-neutral">{vacancy.stage_display}</span>
        </div>
      </div>
    </Link>
  );
}
