"""
Epic 5 - Empresa
HU-14 Perfil de empresa (HU-15 y HU-16 viven en apps.jobs y apps.applications)

La empresa nace "Pendiente de revision" al registrarse. Mientras un
administrador no la apruebe (HU-19), sus vacantes no son visibles para
los estudiantes.
"""
import uuid

from django.conf import settings
from django.db import models

from apps.moderation.models import ReviewStatus


def ruta_logo(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "png"
    return f"logos/{instance.user_id}/{uuid.uuid4().hex}.{ext}"


class CompanyProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="company_profile"
    )
    legal_name = models.CharField("razon social", max_length=150, blank=True)
    nit = models.CharField("NIT", max_length=20, blank=True)
    city = models.CharField("ciudad", max_length=80, blank=True)
    website = models.CharField("sitio web", max_length=200, blank=True)
    about = models.TextField("sobre la empresa", max_length=2000, blank=True)
    sectors = models.JSONField("sectores", default=list, blank=True)
    logo = models.ImageField("logo", upload_to=ruta_logo, blank=True)

    # HU-19 · Moderacion
    status = models.CharField(
        "estado", max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDIENTE
    )
    rejection_reason = models.CharField("motivo del rechazo", max_length=500, blank=True)
    reviewed_at = models.DateTimeField("revisada el", null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="+", verbose_name="revisada por",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "empresa"
        verbose_name_plural = "empresas"
        ordering = ["-created_at"]

    def __str__(self):
        return self.display_name

    @property
    def display_name(self):
        return self.legal_name or self.user.first_name or self.user.email

    @property
    def is_approved(self):
        return self.status == ReviewStatus.APROBADA

    SUFIJOS_SOCIETARIOS = {
        "sas", "s.a.s", "s.a.s.", "sa", "s.a", "s.a.", "ltda", "ltda.", "e.u", "e.u.", "y", "de", "la",
    }

    @property
    def initials(self):
        """'TechNova S.A.S.' → 'TN', 'Grupo Andina Logística' → 'GA' (mockup)."""
        palabras = [p for p in self.display_name.split() if p.lower() not in self.SUFIJOS_SOCIETARIOS]
        if not palabras:
            return "?"
        if len(palabras) == 1:
            palabra = palabras[0]
            mayusculas = [c for c in palabra[1:] if c.isupper()]
            return (palabra[0] + (mayusculas[0] if mayusculas else palabra[1:2])).upper()
        return (palabras[0][0] + palabras[1][0]).upper()

    CAMPOS_COMPLETITUD = [
        ("legal_name", "Razón social"),
        ("nit", "NIT"),
        ("city", "Ciudad"),
        ("website", "Sitio web"),
        ("about", "Sobre la empresa"),
        ("sectors", "Sectores"),
        ("logo", "Logo"),
    ]

    def missing_fields(self):
        return [label for field, label in self.CAMPOS_COMPLETITUD if not getattr(self, field)]

    def completion(self):
        total = len(self.CAMPOS_COMPLETITUD)
        return round(100 * (total - len(self.missing_fields())) / total)
