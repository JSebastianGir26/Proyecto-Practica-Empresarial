"""
Epic 2 - Perfil del estudiante
HU-04 Editar mi perfil · HU-05 Subir hoja de vida

El perfil se crea vacio al registrarse (ver accounts.serializers.crear_perfil)
y el estudiante lo completa despues desde /perfil.
"""
import uuid

from django.conf import settings
from django.db import models


def ruta_hoja_de_vida(instance, filename):
    # Nombre aleatorio: la URL de un archivo no debe revelar de quien es.
    return f"hojas-de-vida/{instance.user_id}/{uuid.uuid4().hex}.pdf"


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile"
    )
    institution = models.CharField("institucion", max_length=150, blank=True)
    program = models.CharField("carrera o programa", max_length=150, blank=True)
    semester = models.PositiveSmallIntegerField("semestre", null=True, blank=True)
    city = models.CharField("ciudad", max_length=80, blank=True)
    about = models.TextField("sobre mi", max_length=1500, blank=True)
    skills = models.JSONField("habilidades", default=list, blank=True)
    cv = models.FileField("hoja de vida (PDF)", upload_to=ruta_hoja_de_vida, blank=True)
    cv_filename = models.CharField("nombre original del PDF", max_length=255, blank=True)
    cv_size = models.PositiveIntegerField("tamano del PDF (bytes)", null=True, blank=True)
    cv_uploaded_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "perfil de estudiante"
        verbose_name_plural = "perfiles de estudiante"

    def __str__(self):
        return self.full_name or self.user.email

    @property
    def full_name(self):
        return self.user.first_name

    # HU-04: "el porcentaje de perfil completo aumenta" y "veo que me falta
    # completar". Cada elemento pesa lo mismo.
    CAMPOS_COMPLETITUD = [
        ("full_name", "Nombre completo"),
        ("program", "Carrera o programa"),
        ("institution", "Institucion"),
        ("semester", "Semestre"),
        ("city", "Ciudad"),
        ("about", "Sobre mi"),
        ("skills", "Habilidades"),
        ("cv", "Hoja de vida"),
    ]

    def missing_fields(self):
        return [label for field, label in self.CAMPOS_COMPLETITUD if not getattr(self, field)]

    def completion(self):
        total = len(self.CAMPOS_COMPLETITUD)
        return round(100 * (total - len(self.missing_fields())) / total)
