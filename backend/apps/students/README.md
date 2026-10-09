# apps/students

**Épica:** Epic 2 - Perfil del estudiante
**Historias de usuario:** HU-04 Editar mi perfil, HU-05 Subir hoja de vida

Implementada en el MVP.

- `StudentProfile` (1:1 con `User`): carrera, institución, semestre, ciudad, sobre mí, habilidades y hoja de vida (PDF).
- `completion()` y `missing_fields()` calculan el % de perfil completo (HU-04).
- La hoja de vida se valida en `serializers.CVUploadSerializer`: solo PDF real (firma `%PDF-`) de máximo 5 MB.

Pruebas en `tests/`: cada escenario Gherkin del backlog tiene al menos una.
