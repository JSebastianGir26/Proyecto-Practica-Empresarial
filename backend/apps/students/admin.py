from django.contrib import admin

from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("__str__", "program", "institution", "semester", "city", "tiene_hoja_de_vida")
    search_fields = ("user__first_name", "user__email", "program", "institution")
    list_filter = ("city",)
    raw_id_fields = ("user",)

    @admin.display(boolean=True, description="Hoja de vida")
    def tiene_hoja_de_vida(self, obj):
        return bool(obj.cv)
