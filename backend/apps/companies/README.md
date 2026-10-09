# apps/companies

**Épica:** Epic 5 - Empresa
**Historias de usuario:** HU-14 Perfil de empresa (+ métricas del panel)

Implementada en el MVP.

- `CompanyProfile` (1:1 con `User`): razón social, NIT, ciudad, sitio web, sectores, logo y **estado de aprobación** (HU-19).
- Nace `PENDIENTE`. Si está `RECHAZADA` y la empresa corrige sus datos, vuelve a `PENDIENTE`.
- `GET /api/empresas/panel/` devuelve las métricas del panel.

Pruebas en `tests/`: cada escenario Gherkin del backlog tiene al menos una.
