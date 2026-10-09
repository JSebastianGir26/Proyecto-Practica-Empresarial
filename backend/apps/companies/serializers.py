import re

from rest_framework import serializers

from apps.moderation.models import ReviewStatus
from apps.students.serializers import file_url, limpiar_lista

from .models import CompanyProfile

LOGO_MAX_BYTES = 2 * 1024 * 1024


class CompanyProfileSerializer(serializers.ModelSerializer):
    """HU-14 · GET/PATCH /api/empresas/perfil/ (JSON, o multipart si trae `logo`)"""

    email = serializers.EmailField(source="user.email", read_only=True)
    sectors = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
    logo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    logo_url = serializers.SerializerMethodField()
    initials = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = CompanyProfile
        fields = [
            "id", "email", "legal_name", "nit", "city", "website", "about", "sectors",
            "logo", "logo_url", "initials", "status", "status_display", "rejection_reason",
        ]
        read_only_fields = ["status", "rejection_reason"]

    def get_logo_url(self, obj):
        return file_url(self.context.get("request"), obj.logo)

    def validate_nit(self, value):
        value = value.strip()
        if value and not re.fullmatch(r"[0-9][0-9.\- ]{4,18}", value):
            raise serializers.ValidationError("Escribe un NIT válido, por ejemplo 901.234.567-8.")
        return value

    def validate_sectors(self, value):
        return limpiar_lista(value, max_items=10, max_len=40)

    def validate_logo(self, value):
        if value and value.size > LOGO_MAX_BYTES:
            raise serializers.ValidationError("El logo debe pesar máximo 2 MB.")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["completion"] = instance.completion()
        data["missing_fields"] = instance.missing_fields()
        return data

    def update(self, instance, validated_data):
        old_logo = instance.logo.name if instance.logo else None
        logo_changed = "logo" in validated_data
        instance = super().update(instance, validated_data)
        if logo_changed and old_logo and old_logo != instance.logo.name:
            instance.logo.storage.delete(old_logo)
        # Una empresa rechazada que corrige sus datos vuelve a la cola de revision.
        if instance.status == ReviewStatus.RECHAZADA:
            instance.status = ReviewStatus.PENDIENTE
            instance.save(update_fields=["status"])
        return instance


class CompanyPublicSerializer(serializers.ModelSerializer):
    """Lo que ve un estudiante de la empresa en una vacante (HU-08, HU-14)."""

    name = serializers.CharField(source="display_name")
    logo_url = serializers.SerializerMethodField()
    initials = serializers.CharField()

    class Meta:
        model = CompanyProfile
        fields = ["id", "name", "initials", "logo_url", "city", "website", "about", "sectors"]

    def get_logo_url(self, obj):
        return file_url(self.context.get("request"), obj.logo)
