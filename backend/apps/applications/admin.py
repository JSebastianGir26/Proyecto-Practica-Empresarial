from django.contrib import admin

from .models import Application


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("student", "vacancy", "status", "created_at", "status_changed_at")
    list_filter = ("status",)
    search_fields = ("student__user__first_name", "student__user__email", "vacancy__title")
    raw_id_fields = ("student", "vacancy")
    date_hierarchy = "created_at"
