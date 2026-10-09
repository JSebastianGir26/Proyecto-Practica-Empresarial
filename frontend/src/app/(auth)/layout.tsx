import Link from "next/link";

/** Pantallas de acceso: panel de marca a la izquierda (mockup, pantalla 07). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col justify-between gap-6 bg-brand-900 px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:w-[440px] lg:px-12 lg:py-16 xl:w-[480px]">
        <Link href="/" className="text-[24px] font-bold text-white hover:text-white">
          PractiYA
        </Link>
        <div className="hidden flex-col gap-4 lg:flex">
          <p className="text-[34px] font-semibold leading-tight">Un solo lugar para tu contrato de aprendizaje.</p>
          <p className="text-[17px] leading-relaxed text-brand-50">
            Crea tu cuenta como estudiante para postularte a pasantías de 6 meses, o como empresa para publicar
            vacantes y encontrar talento.
          </p>
        </div>
        <p className="hidden text-[14px] text-brand-50 lg:block">Universidades públicas, privadas y SENA</p>
      </aside>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:px-8 sm:py-12">
        <div className="w-full max-w-[480px] rounded-[20px] border border-line bg-white p-6 sm:p-11">{children}</div>
      </main>
    </div>
  );
}
