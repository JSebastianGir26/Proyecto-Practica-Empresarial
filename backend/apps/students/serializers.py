from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import StudentProfile

CV_MAX_BYTES = 5 * 1024 * 1024
CV_ERROR = "Formato no permitido. Sube un PDF de máximo 5 MB."


def limpiar_lista(values, max_items=30, max_len=60):
    """Quita espacios, vacios y repetidos (sin importar mayusculas)."""
    vistos, limpios = set(), []
    for value in values:
        if not isinstance(value, str):
            raise serializers.ValidationError("Cada elemento debe ser texto.")
        value = " ".join(value.split())[:max_len]
        if value and value.lower() not in vistos:
            vistos.add(value.lower())
            limpios.append(value)
    if len(limpios) > max_items:
        raise serializers.ValidationError(f"Maximo {max_items} elementos.")
    return limpios


def file_url(request, field):
    if not field:
        return None
    url = field.url
    # En local (FileSystemStorage) la URL es relativa; en Supabase ya es absoluta y firmada.
    return request.build_absolute_uri(url) if request and url.startswith("/") else url


class StudentProfileSerializer(serializers.ModelSerializer):
    """HU-04 · GET/PATCH /api/estudiantes/perfil/"""

    full_name = serializers.CharField(source="user.first_name", max_length=150, required=False)
    email = serializers.EmailField(source="user.email", read_only=True)
    skills = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
    semester = serializers.IntegerField(min_value=1, max_value=12, required=False, allow_null=True)
    cv_url = serializers.SerializerMethodField()
    completion = serializers.IntegerField(read_only=True)
    missing_fields = serializers.ListField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id", "full_name", "email", "institution", "program", "semester", "city",
            "about", "skills", "cv_url", "cv_filename", "cv_size", "cv_uploaded_at",
            "completion", "missing_fields",
        ]
        read_only_fields = ["cv_filename", "cv_size", "cv_uploaded_at"]

    def get_cv_url(self, obj):
        return file_url(self.context.get("request"), obj.cv)

    def validate_skills(self, value):
        return limpiar_lista(value)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["completion"] = instance.completion()
        data["missing_fields"] = instance.missing_fields()
        return data

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if "first_name" in user_data:
            instance.user.first_name = user_data["first_name"].strip()
            instance.user.save(update_fields=["first_name"])
        return super().update(instance, validated_data)


class CVUploadSerializer(serializers.Serializer):
    """HU-05 · PUT /api/estudiantes/perfil/hoja-de-vida/ (multipart, campo `cv`)"""

    cv = serializers.FileField(error_messages={"required": CV_ERROR, "invalid": CV_ERROR})

    def validate_cv(self, file):
        # Escenarios "Formato no permitido" y "Archivo muy pesado": mismo mensaje.
        if not file.name.lower().endswith(".pdf") or file.size > CV_MAX_BYTES:
            raise serializers.ValidationError(CV_ERROR)
        # Un .docx renombrado a .pdf no empieza con la firma de un PDF.
        head = file.read(5)
        file.seek(0)
        if head != b"%PDF-":
            raise serializers.ValidationError(CV_ERROR)
        return file

    def save(self, profile):
        file = self.validated_data["cv"]
        old = profile.cv.name if profile.cv else None
        profile.cv_filename = file.name[:255]
        profile.cv_size = file.size
        profile.cv_uploaded_at = timezone.now()
        profile.cv.save(file.name, file, save=False)
        profile.save()
        if old:
            profile.cv.storage.delete(old)
        return profile


class StudentSummarySerializer(serializers.ModelSerializer):
    """Datos del estudiante que ve la empresa en la lista de postulantes (HU-16)."""

    full_name = serializers.CharField(source="user.first_name")
    email = serializers.EmailField(source="user.email")
    cv_url = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "id", "full_name", "email", "institution", "program", "semester", "city",
            "about", "skills", "cv_url",
        ]

    def get_cv_url(self, obj):
        return file_url(self.context.get("request"), obj.cv)
