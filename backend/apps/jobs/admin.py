"""HU-19 · Moderacion de vacantes desde el Django Admin (/admin/)."""
from django.contrib import admin, messages

from apps.moderation.models import aprobar, rechazar

from .models import Vacancy


@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "city", "modality", "stage", "status", "submitted_at")
    list_filter = ("status", "modality", "stage")
    search_fields = ("title", "company__legal_name", "city")
    readonly_fields = ("reviewed_at", "reviewed_by", "submitted_at", "created_at", "updated_at")
    raw_id_fields = ("company",)
    actions = ["aprobar_vacantes", "rechazar_vacantes"]

    @admin.action(description="Aprobar vacantes seleccionadas")
    def aprobar_vacantes(self, request, queryset):
        for vacancy in queryset:
            aprobar(vacancy, request.user)
        self.message_user(request, f"{queryset.count()} vacante(s) aprobada(s).", messages.SUCCESS)

    @admin.action(description="Rechazar vacantes seleccionadas")
    def rechazar_vacantes(self, request, queryset):
        for vacancy in queryset:
            rechazar(vacancy, request.user, vacancy.rejection_reason)
        self.message_user(request, f"{queryset.count()} vacante(s) rechazada(s).", messages.WARNING)
