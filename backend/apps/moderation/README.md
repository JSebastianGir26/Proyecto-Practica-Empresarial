# apps/moderation

**Épica:** Epic 7 - Moderación
**Historias de usuario:** HU-19 Aprobar empresas y vacantes

Implementada en el MVP.

- No tiene tablas: el estado vive en `CompanyProfile.status` y `Vacancy.status`.
- `models.aprobar()` y `models.rechazar()` los usan el Django Admin (acciones en `companies/admin.py` y `jobs/admin.py`) y la API `/api/moderacion/` (pantalla `/moderacion`).

Pruebas en `tests/`: cada escenario Gherkin del backlog tiene al menos una.
