"use client";

/**
 * Marco de todas las pantallas con sesión: barra superior (escritorio),
 * barra inferior (móvil, docs/diseno punto 4) y protección por rol.
 *
 * La protección aquí es solo para la experiencia de uso: quien decide de
 * verdad qué puede hacer cada rol es el backend.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearSession, homePathForRole, useSession } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { initials } from "@/lib/format";
import type { Role } from "@/types";
import {
  IconBriefcase,
  IconBuilding,
  IconChecklist,
  IconGrid,
  IconHome,
  IconLogout,
  IconSearch,
  IconShield,
  IconUser,
  IconUsers,
} from "./icons";
import { LoadingBlock } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: (p: { size?: number }) => React.ReactElement;
}

const NAV: Record<Role, NavItem[]> = {
  ESTUDIANTE: [
    { href: "/inicio", label: "Inicio", icon: IconHome },
    { href: "/buscar", label: "Buscar", icon: IconSearch },
    { href: "/postulaciones", label: "Postulaciones", icon: IconChecklist },
    { href: "/perfil", label: "Perfil", icon: IconUser },
  ],
  EMPRESA: [
    { href: "/panel", label: "Panel", icon: IconGrid },
    { href: "/vacantes", label: "Vacantes", icon: IconBriefcase },
    { href: "/postulantes", label: "Postulantes", icon: IconUsers },
    { href: "/perfil-empresa", label: "Empresa", icon: IconBuilding },
  ],
  ADMIN: [{ href: "/moderacion", label: "Moderación", icon: IconShield }],
};

const ROLE_LABEL: Record<Role, string> = {
  ESTUDIANTE: "Estudiante",
  EMPRESA: "Empresa",
  ADMIN: "Administrador",
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session === null) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (session && session.role !== role) router.replace(homePathForRole(session.role));
  }, [session, role, router, pathname]);

  if (!session || session.role !== role) {
    return (
      <div className="min-h-screen">
        <LoadingBlock />
      </div>
    );
  }

  const items = NAV[role];
  const name = session.fullName || session.email;

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-line bg-white" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href={homePathForRole(role)} className="text-[20px] font-bold text-ink hover:text-ink">
            PractiYA
          </Link>
          <nav className="hidden flex-1 items-center gap-1 sm:flex" aria-label="Principal">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-[14.5px] font-semibold transition-colors ${
                  isActive(pathname, item.href)
                    ? "bg-brand-100 text-brand-900"
                    : "text-ink-2 hover:bg-soft hover:text-brand-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {role === "ADMIN" && (
              <a
                href={API_URL.replace(/\/api\/?$/, "/admin/")}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-3.5 py-2 text-[14.5px] font-semibold text-ink-2 hover:bg-soft"
              >
                Django Admin ↗
              </a>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight md:block">
              <p className="max-w-[200px] truncate text-[14px] font-semibold">{name}</p>
              <p className="text-[12.5px] text-ink-2">{ROLE_LABEL[role]}</p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-[13px] font-bold text-white"
              title={name}
              aria-hidden="true"
            >
              {initials(session.fullName || session.email)}
            </div>
            <button onClick={logout} className="btn btn-ghost btn-sm" title="Cerrar sesión">
              <IconLogout size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>

      {/* Navegación inferior en móvil */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-white pt-2.5 sm:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
        aria-label="Principal"
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[64px] flex-col items-center gap-1 text-[11.5px] ${
                active ? "font-semibold text-brand-700" : "text-ink-2"
              }`}
            >
              <Icon size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
