"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";

interface State<T> {
  key: string;
  data?: T;
  error?: unknown;
}

/**
 * Carga datos de la API al montar el componente (y cuando cambia `path`).
 *
 *   const { data, loading, error, reload, setData } = useApi<Tipo>("/vacantes/");
 *
 * Pasa `null` como path para no cargar nada todavía. Mientras se recarga
 * se siguen mostrando los datos anteriores (`data`), así la pantalla no
 * parpadea al cambiar un filtro.
 */
export function useApi<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<State<T>>({ key: "" });
  const key = path ? `${path}#${version}` : "";

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    apiFetch<T>(path).then(
      (data) => !cancelled && setState({ key, data }),
      (error) => !cancelled && setState((prev) => ({ key, data: prev.data, error })),
    );
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (updater: T | ((prev: T | undefined) => T)) =>
      setState((prev) => ({
        ...prev,
        data: typeof updater === "function" ? (updater as (p: T | undefined) => T)(prev.data) : updater,
      })),
    [],
  );

  return {
    data: state.data,
    error: state.key === key ? state.error : undefined,
    loading: Boolean(path) && state.key !== key,
    reload,
    setData,
  };
}
