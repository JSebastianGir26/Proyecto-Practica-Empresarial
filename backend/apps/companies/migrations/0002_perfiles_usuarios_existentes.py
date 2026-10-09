"""
Crea el perfil vacio de los usuarios que se registraron antes de que
existiera esta tabla (por ejemplo, los del Sprint 1 en produccion).
"""
from django.db import migrations


def crear_perfiles(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Profile = apps.get_model("companies", "CompanyProfile")
    for user in User.objects.filter(role="EMPRESA").filter(company_profile__isnull=True):
        Profile.objects.create(user=user, legal_name=user.first_name)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("companies", "0001_initial"),
    ]

    operations = [migrations.RunPython(crear_perfiles, migrations.RunPython.noop)]
