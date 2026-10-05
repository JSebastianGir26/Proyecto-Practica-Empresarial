"use client";

/**
 * Portada temporal de PractiYA.
 * Sirve para tener una URL publica mientras se construye el MVP: enlaza a
 * registro e inicio de sesion, y muestra si hay una sesion activa.
 * Se reemplaza por la portada real del mockup en un sprint posterior.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { clearSession, getRole, homePathForRole } from "@/lib/auth";

const ROLE_LABEL: Record<string, string> = {
  ESTUDIANTE: "Estudiante",
  EMPRESA: "Empresa",
  ADMIN: "Administrador",
};

export default function HomePage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // La sesion vive en localStorage, que solo existe en el navegador.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRole(getRole());
  }, []);

  function handleLogout() {
    clearSession();
    setRole(null);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">PractiYA</h1>
        <p className="mt-2 text-gray-600">
          La red donde estudiantes y empresas se encuentran para contratos de aprendizaje.
        </p>
      </div>

      {role ? (
        <div className="space-y-3 rounded border p-4">
          <p>
            Sesión iniciada como <strong>{ROLE_LABEL[role] ?? role}</strong>.
          </p>
          <div className="flex gap-2">
            <Link
              href={homePathForRole(role)}
              className="flex-1 rounded bg-blue-600 py-2 text-center text-white"
            >
              Ir a mi inicio
            </Link>
            <button onClick={handleLogout} className="flex-1 rounded border py-2">
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Link href="/register" className="flex-1 rounded bg-blue-600 py-2 text-center text-white">
            Crear cuenta
          </Link>
          <Link href="/login" className="flex-1 rounded border py-2 text-center">
            Iniciar sesión
          </Link>
        </div>
      )}

      <p className="text-xs text-gray-400">Versión en construcción · Sprint 1</p>
    </main>
  );
}
