"""
Epic 3 / Epic 5 - Postulaciones
HU-08 Postularme · HU-10 Seguir mis postulaciones · HU-16 Gestionar postulantes

    APLICADO → EN_REVISION → ENTREVISTA → ACEPTADO
                                     └──→ RECHAZADO (desde cualquier estado)
"""
from django.db import models


class ApplicationStatus(models.TextChoices):
    APLICADO = "APLICADO", "Aplicado"
    EN_REVISION = "EN_REVISION", "En revisión"
    ENTREVISTA = "ENTREVISTA", "Entrevista"
    ACEPTADO = "ACEPTADO", "Aceptado"
    RECHAZADO = "RECHAZADO", "Rechazado"


class Application(models.Model):
    student = models.ForeignKey(
        "students.StudentProfile", on_delete=models.CASCADE, related_name="applications",
        verbose_name="estudiante",
    )
    vacancy = models.ForeignKey(
        "jobs.Vacancy", on_delete=models.CASCADE, related_name="applications",
        verbose_name="vacante",
    )
    status = models.CharField(
        "estado", max_length=20, choices=ApplicationStatus.choices,
        default=ApplicationStatus.APLICADO,
    )
    created_at = models.DateTimeField("fecha de postulacion", auto_now_add=True)
    status_changed_at = models.DateTimeField("ultimo cambio de estado", auto_now_add=True)

    class Meta:
        verbose_name = "postulación"
        verbose_name_plural = "postulaciones"
        ordering = ["-created_at"]
        constraints = [
            # HU-08 "Postulacion repetida": un estudiante, una postulacion por vacante.
            models.UniqueConstraint(fields=["student", "vacancy"], name="postulacion_unica"),
        ]

    def __str__(self):
        return f"{self.student} → {self.vacancy.title} ({self.get_status_display()})"
