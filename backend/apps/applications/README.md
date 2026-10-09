# apps/applications

**Épica:** Epic 3 / Epic 5 - Postulaciones
**Historias de usuario:** HU-08 Postularme, HU-10 Seguir mis postulaciones, HU-16 Gestionar postulantes

Implementada en el MVP.

- `Application`: estudiante + vacante (única por pareja) con estado `APLICADO → EN_REVISION → ENTREVISTA → ACEPTADO | RECHAZADO`.
- Postularse exige hoja de vida (`code: cv_required`); repetir devuelve `code: already_applied`.

Pruebas en `tests/`: cada escenario Gherkin del backlog tiene al menos una.
