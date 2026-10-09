"""
Epic 3 / Epic 5 - Vacantes
HU-15 Publicar vacante · HU-06 Buscar con filtros · HU-08 Ver detalle

Ciclo de vida de una vacante:

    BORRADOR ──publicar──► PENDIENTE ──admin──► APROBADA ◄──► PAUSADA
                                  └────admin──► RECHAZADA ──editar y publicar──► PENDIENTE

Un estudiante solo ve vacantes APROBADAS de empresas APROBADAS.
"""
from django.conf import settings
from django.db import models

from apps.moderation.models import ReviewStatus


class Modality(models.TextChoices):
    PRESENCIAL = "PRESENCIAL", "Presencial"
    HIBRIDA = "HIBRIDA", "Híbrida"
    REMOTA = "REMOTA", "Remota"


class Stage(models.TextChoices):
    LECTIVA = "LECTIVA", "Lectiva"
    PRODUCTIVA = "PRODUCTIVA", "Productiva"


class VacancyStatus(models.TextChoices):
    BORRADOR = "BORRADOR", "Borrador"
    # Mismos valores que moderation.ReviewStatus, para aprobar/rechazar igual.
    PENDIENTE = "PENDIENTE", "Pendiente de revisión"
    APROBADA = "APROBADA", "Activa"
    RECHAZADA = "RECHAZADA", "Rechazada"
    PAUSADA = "PAUSADA", "En pausa"


class VacancyQuerySet(models.QuerySet):
    def visibles(self):
        """Lo que puede ver un estudiante (HU-06, HU-19)."""
        return self.filter(
            status=VacancyStatus.APROBADA, company__status=ReviewStatus.APROBADA
        )


class Vacancy(models.Model):
    company = models.ForeignKey(
        "companies.CompanyProfile", on_delete=models.CASCADE, related_name="vacancies",
        verbose_name="empresa",
    )
    # blank=True porque un borrador puede guardarse incompleto (HU-15).
    title = models.CharField("titulo del puesto", max_length=150, blank=True)
    city = models.CharField("ciudad", max_length=80, blank=True)
    openings = models.PositiveSmallIntegerField("vacantes disponibles", default=1)
    modality = models.CharField(
        "modalidad", max_length=20, choices=Modality.choices, default=Modality.PRESENCIAL
    )
    stage = models.CharField(
        "etapa", max_length=20, choices=Stage.choices, default=Stage.PRODUCTIVA
    )
    # El contrato de aprendizaje dura 6 meses por normativa (pantalla 10 del mockup).
    duration_months = models.PositiveSmallIntegerField("duracion (meses)", default=6)
    stipend = models.CharField("apoyo de sostenimiento", max_length=120, blank=True)
    description = models.TextField("descripcion", max_length=4000, blank=True)
    requirements = models.JSONField("requisitos", default=list, blank=True)
    skills = models.JSONField("habilidades", default=list, blank=True)

    status = models.CharField(
        "estado", max_length=20, choices=VacancyStatus.choices, default=VacancyStatus.BORRADOR
    )
    rejection_reason = models.CharField("motivo del rechazo", max_length=500, blank=True)
    reviewed_at = models.DateTimeField("revisada el", null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="+", verbose_name="revisada por",
    )
    submitted_at = models.DateTimeField("enviada a revision el", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = VacancyQuerySet.as_manager()

    class Meta:
        verbose_name = "vacante"
        verbose_name_plural = "vacantes"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "modality", "stage"])]

    def __str__(self):
        return f"{self.title} · {self.company}"

    # HU-15 "Campos obligatorios vacios": lo minimo para enviar a revision.
    CAMPOS_OBLIGATORIOS = {
        "title": "El título del puesto es obligatorio.",
        "city": "La ciudad es obligatoria.",
        "description": "La descripción es obligatoria.",
    }

    def missing_required(self):
        return {
            field: message
            for field, message in self.CAMPOS_OBLIGATORIOS.items()
            if not str(getattr(self, field) or "").strip()
        }
