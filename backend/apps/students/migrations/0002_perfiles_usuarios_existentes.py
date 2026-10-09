"""
Crea el perfil vacio de los usuarios que se registraron antes de que
existiera esta tabla (por ejemplo, los del Sprint 1 en produccion).
"""
from django.db import migrations


def crear_perfiles(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Profile = apps.get_model("students", "StudentProfile")
    for user in User.objects.filter(role="ESTUDIANTE").filter(student_profile__isnull=True):
        Profile.objects.create(user=user)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("students", "0001_initial"),
    ]

    operations = [migrations.RunPython(crear_perfiles, migrations.RunPython.noop)]
