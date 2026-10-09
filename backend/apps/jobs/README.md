# apps/jobs

**Épica:** Epic 3 / Epic 5 - Vacantes
**Historias de usuario:** HU-06 Buscar con filtros, HU-08 Ver detalle, HU-15 Publicar vacante

Implementada en el MVP.

- `Vacancy`: ciclo `BORRADOR → PENDIENTE → APROBADA ⇄ PAUSADA` (o `RECHAZADA`). Ver el diagrama en `models.py`.
- `Vacancy.objects.visibles()` es lo único que puede ver un estudiante: vacantes aprobadas de empresas aprobadas.
- Comando `python manage.py datos_demo` (en `management/commands/`).

Pruebas en `tests/`: cada escenario Gherkin del backlog tiene al menos una.
