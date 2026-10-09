"""
HU-19 · Moderacion desde el Django Admin (/admin/). Las mismas acciones
estan disponibles en la pantalla /moderacion del frontend.
"""
from django.contrib import admin, messages

from apps.moderation.models import aprobar, rechazar

from .models import CompanyProfile


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ("__str__", "nit", "city", "status", "created_at", "reviewed_at")
    list_filter = ("status", "city")
    search_fields = ("legal_name", "nit", "user__email")
    readonly_fields = ("reviewed_at", "reviewed_by", "created_at", "updated_at")
    raw_id_fields = ("user",)
    actions = ["aprobar_empresas", "rechazar_empresas"]

    @admin.action(description="Aprobar empresas seleccionadas")
    def aprobar_empresas(self, request, queryset):
        for company in queryset:
            aprobar(company, request.user)
        self.message_user(request, f"{queryset.count()} empresa(s) aprobada(s).", messages.SUCCESS)

    @admin.action(description="Rechazar empresas seleccionadas")
    def rechazar_empresas(self, request, queryset):
        for company in queryset:
            rechazar(company, request.user, company.rejection_reason)
        self.message_user(request, f"{queryset.count()} empresa(s) rechazada(s).", messages.WARNING)
