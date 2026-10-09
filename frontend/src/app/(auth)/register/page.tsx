"use client";

/**
 * HU-01 · Crear cuenta (mockup, pantalla 07)
 *
 * Un solo formulario con selector de rol (Estudiante / Empresa).
 * Escenarios Gherkin:
 *   - Registro exitoso → entra a su pantalla de inicio
 *   - No acepta términos → mensaje de error, no crea la cuenta
 *   - Contraseñas no coinciden → "Las contraseñas no coinciden"
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError, errorMessage } from "@/lib/api";
import { homePathForRole, saveSession, type LoginResponse } from "@/lib/auth";
import { Spinner, TextField } from "@/components/ui";
import { IconCheck } from "@/components/icons";

type Role = "ESTUDIANTE" | "EMPRESA";
type Errors = Partial<Record<"full_name" | "email" | "password" | "password_confirm" | "terms_accepted" | "form", string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("ESTUDIANTE");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("full_name")).trim();
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    const passwordConfirm = String(form.get("password_confirm"));

    const found: Errors = {};
    if (!fullName) found.full_name = role === "EMPRESA" ? "Escribe el nombre de la empresa." : "Escribe tu nombre completo.";
    if (!/^\S+@\S+\.\S+$/.test(email)) found.email = "Escribe un correo válido.";
    if (password.length < 8) found.password = "La contraseña debe tener mínimo 8 caracteres.";
    if (password !== passwordConfirm) found.password_confirm = "Las contraseñas no coinciden";
    if (!terms) found.terms_accepted = "Debes aceptar los términos y el tratamiento de datos.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await apiFetch("/auth/register/", {
        method: "POST",
        auth: false,
        body: { full_name: fullName, email, password, password_confirm: passwordConfirm, role, terms_accepted: terms },
      });
      // "Mi cuenta queda creada Y entro a la pantalla de Inicio".
      const session = await apiFetch<LoginResponse>("/auth/login/", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      saveSession(session);
      router.replace(homePathForRole(session.role));
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const fields = err.fieldErrors();
        setErrors({
          full_name: fields.full_name,
          email: fields.email,
          password: fields.password,
          password_confirm: fields.password_confirm,
          terms_accepted: fields.terms_accepted,
          form: Object.keys(fields).length ? undefined : errorMessage(err),
        });
      } else {
        setErrors({ form: errorMessage(err, "No se pudo crear la cuenta. Intenta de nuevo.") });
      }
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex w-fit rounded-full border border-line bg-soft p-1" role="radiogroup" aria-label="Tipo de cuenta">
        {(["ESTUDIANTE", "EMPRESA"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={`rounded-full px-5 py-2 text-[14px] font-semibold ${role === r ? "bg-brand-700 text-white" : "text-ink-2"}`}
          >
            {r === "ESTUDIANTE" ? "Estudiante" : "Empresa"}
          </button>
        ))}
      </div>

      <div>
        <h1 className="text-[30px]">Crear una cuenta</h1>
        <p className="mt-1.5 text-[16px] text-ink-2">
          {role === "ESTUDIANTE"
            ? "Regístrate para empezar a buscar pasantías con contrato de aprendizaje."
            : "Regístrate para publicar vacantes de contrato de aprendizaje. Un administrador revisará tu empresa antes de que tus vacantes sean visibles."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label={role === "ESTUDIANTE" ? "Nombre completo" : "Nombre de la empresa"}
          name="full_name"
          placeholder={role === "ESTUDIANTE" ? "María Camila Ruiz" : "TechNova S.A.S."}
          autoComplete={role === "ESTUDIANTE" ? "name" : "organization"}
          error={errors.full_name}
          maxLength={150}
        />
        <TextField label="Correo electrónico" name="email" type="email" placeholder="nombre@correo.com" autoComplete="email" error={errors.email} />
        <TextField label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" error={errors.password} />
        <TextField label="Confirmar contraseña" name="password_confirm" type="password" placeholder="Repite tu contraseña" autoComplete="new-password" error={errors.password_confirm} />

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-snug text-ink-2">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="peer sr-only"
              aria-invalid={Boolean(errors.terms_accepted)}
            />
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500 ${
                terms ? "border-brand-700 bg-brand-700 text-white" : errors.terms_accepted ? "border-rose-text bg-white" : "border-[#bab6b6] bg-white"
              }`}
              aria-hidden="true"
            >
              {terms && <IconCheck size={13} />}
            </span>
            <span>
              He leído y acepto los términos y condiciones y el tratamiento de datos personales, incluyendo el manejo de mi
              hoja de vida y datos de contrato de aprendizaje.
            </span>
          </label>
          {errors.terms_accepted && <p className="field-error mt-2">{errors.terms_accepted}</p>}
        </div>

        {errors.form && (
          <p className="rounded-btn bg-rose-bg px-3.5 py-2.5 text-[14px] text-rose-text" role="alert">
            {errors.form}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading && <Spinner />}
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-[15px] text-ink-2">
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
