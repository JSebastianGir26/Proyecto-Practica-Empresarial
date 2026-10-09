"use client";

/** Portada de PractiYA. */
import Link from "next/link";
import { homePathForRole, useSession } from "@/lib/auth";
import { IconBriefcase, IconChecklist, IconSearch } from "@/components/icons";

const STEPS = [
  { icon: IconSearch, title: "Busca", text: "Filtra pasantías por modalidad, etapa de formación y ciudad." },
  { icon: IconBriefcase, title: "Postúlate", text: "Sube tu hoja de vida una vez y postúlate con un clic." },
  { icon: IconChecklist, title: "Haz seguimiento", text: "Mira en qué va cada proceso: en revisión, entrevista o aceptado." },
];

export default function HomePage() {
  const session = useSession();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="text-[22px] font-bold">PractiYA</span>
        {session ? (
          <Link href={homePathForRole(session.role)} className="btn btn-primary btn-sm">
            Ir a mi inicio
          </Link>
        ) : (
          <Link href="/login" className="btn btn-ghost btn-sm">
            Iniciar sesión
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="flex flex-col gap-6 py-12 sm:py-20 lg:max-w-3xl">
          <p className="text-[14px] font-semibold uppercase tracking-[0.06em] text-brand-700">Contratos de aprendizaje</p>
          <h1 className="text-[38px] font-bold leading-[1.08] sm:text-[52px]">
            Tu práctica empieza aquí.
          </h1>
          <p className="max-w-2xl text-[18px] leading-relaxed text-ink-2">
            PractiYA conecta a estudiantes de universidades públicas, privadas y del SENA con empresas que buscan a quién
            formar mediante contratos de aprendizaje.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {session ? (
              <Link href={homePathForRole(session.role)} className="btn btn-primary btn-lg">
                Ir a mi inicio
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn btn-primary btn-lg">
                  Crear cuenta gratis
                </Link>
                <Link href="/login" className="btn btn-secondary btn-lg">
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex flex-col gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-100 text-brand-900">
                <Icon size={20} />
              </div>
              <p className="text-[18px] font-semibold">{title}</p>
              <p className="text-[15px] text-ink-2">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-2xl bg-brand-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-[20px] font-semibold">¿Eres una empresa?</p>
            <p className="mt-1 text-brand-50">Publica tus vacantes de contrato de aprendizaje y gestiona a tus postulantes en un solo lugar.</p>
          </div>
          {!session && (
            <Link href="/register" className="btn shrink-0 bg-white text-brand-900 hover:bg-brand-100 hover:text-brand-900">
              Registrar mi empresa
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}
