from django.db import transaction
from rest_framework import serializers

from apps.companies.serializers import CompanyPublicSerializer
from apps.students.serializers import limpiar_lista

from .models import Vacancy, VacancyStatus


class VacancyCardSerializer(serializers.ModelSerializer):
    """Tarjeta de resultado en Buscar (HU-06)."""

    company = CompanyPublicSerializer(read_only=True)
    modality_display = serializers.CharField(source="get_modality_display", read_only=True)
    stage_display = serializers.CharField(source="get_stage_display", read_only=True)
    summary = serializers.SerializerMethodField()

    class Meta:
        model = Vacancy
        fields = [
            "id", "title", "company", "city", "modality", "modality_display", "stage",
            "stage_display", "duration_months", "stipend", "summary", "skills", "created_at",
        ]

    def get_summary(self, obj):
        text = " ".join(obj.description.split())
        return text if len(text) <= 180 else text[:177].rsplit(" ", 1)[0] + "…"


class VacancyDetailSerializer(VacancyCardSerializer):
    """Detalle de la vacante (HU-08)."""

    applicants_count = serializers.IntegerField(read_only=True)
    my_application = serializers.SerializerMethodField()

    class Meta(VacancyCardSerializer.Meta):
        fields = VacancyCardSerializer.Meta.fields + [
            "description", "requirements", "openings", "applicants_count", "my_application",
        ]

    def get_my_application(self, obj):
        # HU-08 "Postulacion repetida": el boton muestra "Ya te postulaste".
        app = self.context.get("my_application")
        if not app:
            return None
        return {"id": app.id, "status": app.status, "status_display": app.get_status_display()}


class CompanyVacancySerializer(serializers.ModelSerializer):
    """HU-15 · La empresa crea y edita sus vacantes."""

    requirements = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
    skills = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    modality_display = serializers.CharField(source="get_modality_display", read_only=True)
    stage_display = serializers.CharField(source="get_stage_display", read_only=True)
    applicants_count = serializers.IntegerField(read_only=True, default=0)
    openings = serializers.IntegerField(min_value=1, max_value=99, required=False)

    class Meta:
        model = Vacancy
        fields = [
            "id", "title", "city", "openings", "modality", "modality_display", "stage",
            "stage_display", "duration_months", "stipend", "description", "requirements",
            "skills", "status", "status_display", "rejection_reason", "applicants_count",
            "created_at", "updated_at", "submitted_at",
        ]
        read_only_fields = [
            "duration_months", "status", "rejection_reason", "created_at", "updated_at",
            "submitted_at",
        ]

    def validate_requirements(self, value):
        return limpiar_lista(value, max_items=15, max_len=200)

    def validate_skills(self, value):
        return limpiar_lista(value, max_items=15, max_len=40)

    @transaction.atomic  # si falla la validacion de abajo, no se guarda nada
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        # Si una vacante ya revisada cambia, el administrador debe volver a
        # revisarla: si no, una empresa podria cambiar el contenido despues
        # de la aprobacion (HU-19).
        if instance.status != VacancyStatus.BORRADOR:
            errors = instance.missing_required()
            if errors:
                raise serializers.ValidationError(errors)
            if instance.status != VacancyStatus.PENDIENTE:
                instance.status = VacancyStatus.PENDIENTE
                instance.rejection_reason = ""
                instance.save(update_fields=["status", "rejection_reason"])
        return instance
