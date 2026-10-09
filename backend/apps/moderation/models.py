"""
Epic 7 - Moderacion
HU-19 Aprobar empresas y vacantes

Esta app no tiene tablas propias: el estado de aprobacion vive en
CompanyProfile.status y en Vacancy.status. Aqui estan los estados que
comparten y la logica de aprobar/rechazar, que usan tanto el Django
Admin como la pantalla /moderacion.
"""
from django.db import models
from django.utils import timezone


class ReviewStatus(models.TextChoices):
    PENDIENTE = "PENDIENTE", "Pendiente de revisión"
    APROBADA = "APROBADA", "Aprobada"
    RECHAZADA = "RECHAZADA", "Rechazada"


def aprobar(obj, admin_user):
    obj.status = ReviewStatus.APROBADA
    obj.rejection_reason = ""
    obj.reviewed_at = timezone.now()
    obj.reviewed_by = admin_user
    obj.save(update_fields=["status", "rejection_reason", "reviewed_at", "reviewed_by"])


def rechazar(obj, admin_user, reason=""):
    obj.status = ReviewStatus.RECHAZADA
    obj.rejection_reason = reason.strip()[:500]
    obj.reviewed_at = timezone.now()
    obj.reviewed_by = admin_user
    obj.save(update_fields=["status", "rejection_reason", "reviewed_at", "reviewed_by"])
