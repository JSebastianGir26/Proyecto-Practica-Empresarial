"use client";

/**
 * HU-02 · Iniciar sesion (T5 — Desarrollador 5)
 * Consume POST /api/auth/login/ (T3) y redirige segun el rol devuelto.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { saveSession, homePathForRole, LoginResponse } from "@/lib/auth";

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
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      saveSession(data);
      router.push(homePathForRole(data.role));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Correo o contrasena incorrectos.");
      } else {
        setError("Error de conexion. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesion</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="email" type="email" placeholder="Correo" required className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" placeholder="Contrasena" required className="w-full rounded border px-3 py-2" />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50">
          {loading ? "Ingresando..." : "Iniciar sesion"}
        </button>
      </form>
    </main>
  );
}
