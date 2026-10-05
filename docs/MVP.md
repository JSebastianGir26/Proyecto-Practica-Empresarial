# PractiYA — Alcance del MVP

## Objetivo

Demostrar el **ciclo completo de una práctica** con usuarios reales:

> Una empresa se registra y publica una vacante → el administrador las aprueba → un estudiante se registra, completa su perfil, sube su hoja de vida, busca, se postula y sigue su postulación → la empresa revisa a los postulantes y cambia su estado.

Si ese ciclo funciona de punta a punta en producción (Vercel + Render + Supabase), el MVP está terminado. Todo lo demás viene después.

---

## Qué entra (11 historias)

Todas vienen de `docs/backlog/PRACTIYA_BACKLOG.xlsx`, donde están sus criterios de aceptación en formato Gherkin.

| HU | Historia | Épica | Prioridad | Puntos | App backend | Pantalla |
|---|---|---|---|---|---|---|
| HU-01 | Crear cuenta | 1 · Cuenta | Alta | 5 | `accounts` | `/register` |
| HU-02 | Iniciar sesión | 1 · Cuenta | Alta | 3 | `accounts` | `/login` |
| HU-04 | Editar mi perfil (básico) | 2 · Estudiante | Media | 5 | `students` | `/perfil` |
| HU-05 | Subir hoja de vida (PDF) | 2 · Estudiante | Alta | 3 | `students` | `/perfil` |
| HU-14 | Perfil de empresa | 5 · Empresa | Media | 3 | `companies` | `/panel` |
| HU-15 | Publicar vacante | 5 · Empresa | Alta | 5 | `jobs` | `/vacantes` |
| HU-19 | Aprobar empresas y vacantes | 7 · Moderación | Alta | 5 | `moderation` | Django Admin |
| HU-06 | Buscar pasantías con filtros | 3 · Búsqueda | Alta | 8 | `jobs` | `/buscar` |
| HU-08 | Ver detalle y postularme | 3 · Búsqueda | Alta | 5 | `applications` | `/buscar/[id]` |
| HU-10 | Seguir mis postulaciones | 3 · Búsqueda | Media | 3 | `applications` | `/postulaciones` |
| HU-16 | Gestionar postulantes | 5 · Empresa | Alta | 8 | `applications` | `/postulantes` |

**Total: 53 puntos.** HU-04 y HU-14 son la versión mínima: los campos necesarios para postularse y para publicar, sin foto ni porcentaje de completitud.

**Decisión de alcance:** HU-19 se resuelve con el **Django Admin** (un campo `estado` en Empresa y Vacante, más acciones "Aprobar" y "Rechazar"). No se construye una pantalla aparte en Next.js para el MVP.

## Qué queda fuera (después del MVP)

| HU | Historia | Por qué espera |
|---|---|---|
| HU-03 | Recuperar contraseña | Necesita envío de correos. Mientras tanto, el admin puede cambiar la contraseña desde Django Admin. |
| HU-07a/b | Compatibilidad | Requiere definir el algoritmo. Se agrega cuando haya datos reales. |
| HU-09 | Guardar vacante | Prioridad baja. |
| HU-11, 12, 13 | Feed y comunidades | Es otra funcionalidad completa. No es necesaria para conectar estudiantes y empresas. |
| HU-17 | Panel de métricas de la empresa | Prioridad baja. |
| HU-18 | Notificaciones | Mientras tanto, el estudiante ve el estado en "Mis postulaciones". |
| — | Chat en tiempo real | Necesita Redis y Django Channels, lo que complica el despliegue. |

---

## Modelo de datos del MVP (propuesta)

Se define en el Sprint 2 y lo revisa todo el equipo **antes** de que alguien escriba código, porque todas las historias dependen de él.

```
User (accounts)            ── ya existe
 ├─ 1:1 StudentProfile     (students)    carrera, institución, semestre, ciudad, habilidades, hoja_de_vida (PDF)
 └─ 1:1 CompanyProfile     (companies)   razón social, NIT, ciudad, sector, sitio web, descripción, estado_aprobación
                                 │
                                 └─ 1:N Vacancy (jobs)   título, descripción, ciudad, modalidad, etapa (lectiva/productiva),
                                          │               duración, apoyo de sostenimiento, requisitos, estado_aprobación
                                          │
StudentProfile ── 1:N Application (applications) ── N:1 Vacancy
                       estado: APLICADO → EN_REVISION → ENTREVISTA → ACEPTADO | RECHAZADO
```

---

## Plan de sprints (sugerido, sprints de 2 semanas)

Seis desarrolladores organizados en **3 parejas**. Cada pareja toma una historia completa (backend + frontend), así todos aprenden las dos partes y nadie se queda bloqueado esperando a otro.

### Sprint 1 · Cuenta y acceso (en curso)

Ya existe una base: el modelo de Usuario, los endpoints de registro y login con sus pruebas, y los formularios de `/register` y `/login`. El objetivo del sprint es **que cada persona complete el flujo de Git una vez** y dejar el primer despliegue en línea.

| Tarea | Quién | Entregable |
|---|---|---|
| T1 · Infraestructura | Líder técnico | Supabase, Render y Vercel conectados (ver `DESPLIEGUE.md`) |
| T2 · HU-01 backend | Dev 2 | Revisar los endpoints existentes y agregar las pruebas que falten |
| T3 · HU-02 backend | Dev 3 | Ídem para login |
| T4 · HU-01 frontend | Dev 4 | Pantalla `/register` con el diseño del mockup |
| T5 · HU-02 frontend | Dev 5 | Pantalla `/login` con el diseño del mockup, y cerrar sesión |
| T6 · Verificación E2E | Dev 6 | Checklist de los 5 escenarios Gherkin en producción |

### Sprint 2 · Perfiles, vacantes y moderación

1. **Todo el equipo (día 1–2):** acordar y unir los modelos de datos en un solo PR.
2. Pareja A: HU-04 + HU-05 (perfil del estudiante y hoja de vida en Supabase Storage).
3. Pareja B: HU-14 + HU-15 (perfil de empresa y publicar vacante).
4. Pareja C: HU-19 (aprobación en Django Admin) + diseño base compartido (barra de navegación, colores, componentes de formulario).

### Sprint 3 · Búsqueda y postulación

1. Pareja A: HU-06 (buscar con filtros).
2. Pareja B: HU-08 + HU-10 (postularse y seguir postulaciones).
3. Pareja C: HU-16 (gestionar postulantes).

### Sprint 4 · Estabilizar y presentar

Pruebas de punta a punta en producción, corrección de errores, datos de demostración y la presentación.

---

## Definición de "terminado" (para cada historia)

- [ ] Cumple todos los escenarios Gherkin de la historia en el backlog.
- [ ] El backend tiene pruebas (`pytest`) para esos escenarios.
- [ ] Los permisos por rol están validados en el backend, no solo en el frontend.
- [ ] El PR fue revisado y aprobado por un compañero, y la CI está en verde.
- [ ] Está unido a `develop` y se probó en la versión de vista previa de Vercel.
- [ ] Si agregó endpoints, se actualizó la tabla del README.
