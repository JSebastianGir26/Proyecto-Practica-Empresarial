"use client";

/**
 * HU-01 · Crear cuenta (T4 — Desarrollador 4)
 *
 * Un solo formulario con selector de rol (Estudiante / Empresa) — no
 * dos pantallas separadas, para no duplicar la validacion de
 * contrasenas y terminos. Consume POST /api/auth/register/ (T2).
 *
 * Escenarios Gherkin a cubrir (ver docs/backlog):
 *   - Registro exitoso -> redirige a /inicio
 *   - No acepta terminos -> mensaje de error, no crea la cuenta
 *   - Contrasenas no coinciden -> "Las contrasenas no coinciden"
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

type Role = "ESTUDIANTE" | "EMPRESA";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("ESTUDIANTE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const passwordConfirm = form.get("password_confirm") as string;
    const termsAccepted = form.get("terms_accepted") === "on";

    if (!termsAccepted) {
      setError("Debes aceptar los terminos y el tratamiento de datos.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          username: form.get("username"),
          password,
          password_confirm: passwordConfirm,
          role,
          terms_accepted: termsAccepted,
        }),
      });
      router.push("/inicio");
    } catch (err) {
      if (err instanceof ApiError) {
        setError("No se pudo crear la cuenta. Revisa los datos ingresados.");
      } else {
        setError("Error de conexion. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Crear una cuenta</h1>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setRole("ESTUDIANTE")}
          className={`flex-1 rounded border px-3 py-2 ${role === "ESTUDIANTE" ? "bg-blue-600 text-white" : ""}`}
        >
          Estudiante
        </button>
        <button
          type="button"
          onClick={() => setRole("EMPRESA")}
          className={`flex-1 rounded border px-3 py-2 ${role === "EMPRESA" ? "bg-blue-600 text-white" : ""}`}
        >
          Empresa
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="username" placeholder="Nombre" required className="w-full rounded border px-3 py-2" />
        <input name="email" type="email" placeholder="Correo" required className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" placeholder="Contrasena" required className="w-full rounded border px-3 py-2" />
        <input name="password_confirm" type="password" placeholder="Confirmar contrasena" required className="w-full rounded border px-3 py-2" />

        <label className="flex items-center gap-2 text-sm">
          <input name="terms_accepted" type="checkbox" />
          Acepto los terminos y el tratamiento de datos
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50">
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </main>
  );
}
