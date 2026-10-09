"use client";

/**
 * HU-02 · Iniciar sesión
 * Escenarios: credenciales correctas → pantalla principal del rol;
 * credenciales incorrectas → mensaje de error y sigue en esta pantalla.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError, errorMessage } from "@/lib/api";
import { homePathForRole, saveSession, type LoginResponse } from "@/lib/auth";
import { Spinner, TextField } from "@/components/ui";

function safeNext(role: string) {
  // Solo rutas internas: evita redirigir a otro sitio con ?next=https://...
  const next = new URLSearchParams(window.location.search).get("next");
  const home = homePathForRole(role);
  if (!next || !next.startsWith("/") || next.startsWith("//")) return home;
  // No mandar a una empresa a una pantalla de estudiante (o al revés).
  const prefixes: Record<string, string[]> = {
    ESTUDIANTE: ["/inicio", "/buscar", "/postulaciones", "/perfil"],
    EMPRESA: ["/panel", "/vacantes", "/postulantes", "/perfil-empresa"],
    ADMIN: ["/moderacion"],
  };
  return (prefixes[role] ?? []).some((p) => next === p || next.startsWith(`${p}/`) || next.startsWith(`${p}?`))
    ? next
    : home;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);

    try {
      const data = await apiFetch<LoginResponse>("/auth/login/", {
        method: "POST",
        auth: false,
        body: {
          email: String(form.get("email")).trim().toLowerCase(),
          password: form.get("password"),
        },
      });
      saveSession(data);
      router.replace(safeNext(data.role));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Correo o contraseña incorrectos."
          : errorMessage(err, "No pudimos iniciar sesión. Intenta de nuevo."),
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[30px]">Bienvenido de nuevo</h1>
        <p className="mt-1.5 text-[16px] text-ink-2">Inicia sesión para buscar pasantías con contrato de aprendizaje.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="Correo electrónico" name="email" type="email" placeholder="nombre@correo.com" required autoComplete="email" />
        <TextField label="Contraseña" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />

        {error && (
          <p className="rounded-btn bg-rose-bg px-3.5 py-2.5 text-[14px] text-rose-text" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg mt-1 w-full">
          {loading && <Spinner />}
          {loading ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="text-center text-[15px] text-ink-2">
        ¿No tienes cuenta? <Link href="/register">Crear una cuenta nueva</Link>
      </p>
      <p className="text-center text-[13px] text-ink-3">
        ¿Olvidaste tu contraseña? Escríbele al administrador de PractiYA para restablecerla.
      </p>
    </div>
  );
}
