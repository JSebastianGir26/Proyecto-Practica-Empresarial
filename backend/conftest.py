"""
Fixtures compartidas por las pruebas de todas las apps.
Uso: escribe el nombre de la fixture como parametro del test.
"""
import shutil

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.accounts.serializers import crear_perfil
from apps.jobs.models import Vacancy, VacancyStatus
from apps.moderation.models import ReviewStatus

PDF_MINIMO = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


@pytest.fixture(autouse=True)
def media_temporal(settings, tmp_path):
    """Los archivos subidos en pruebas van a una carpeta temporal, nunca a media/."""
    # Hash de contrasenas rapido: solo para pruebas, acelera la suite.
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
    settings.MEDIA_ROOT = tmp_path / "media"
    settings.STORAGES = {
        **settings.STORAGES,
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    }
    yield
    shutil.rmtree(tmp_path / "media", ignore_errors=True)


def crear_usuario(email, role, nombre="Usuario Prueba"):
    user = User.objects.create_user(
        username=email.split("@")[0], email=email, password="ClaveSegura123",
        role=role, first_name=nombre, terms_accepted=True,
    )
    crear_perfil(user)
    return user


def cliente_para(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def anon():
    return APIClient()


@pytest.fixture
def estudiante(db):
    return crear_usuario("maria@example.com", Role.ESTUDIANTE, "María Camila Ruiz")


@pytest.fixture
def otro_estudiante(db):
    return crear_usuario("julian@example.com", Role.ESTUDIANTE, "Julián Cortés")


@pytest.fixture
def empresa(db):
    user = crear_usuario("rrhh@technova.co", Role.EMPRESA, "TechNova S.A.S.")
    perfil = user.company_profile
    perfil.status = ReviewStatus.APROBADA
    perfil.city = "Bogotá"
    perfil.save()
    return user


@pytest.fixture
def empresa_pendiente(db):
    return crear_usuario("info@andina.co", Role.EMPRESA, "Grupo Andina Logística")


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin", email="admin@practiya.co", password="ClaveSegura123"
    )


@pytest.fixture
def client_estudiante(estudiante):
    return cliente_para(estudiante)


@pytest.fixture
def client_empresa(empresa):
    return cliente_para(empresa)


@pytest.fixture
def client_admin(admin_user):
    return cliente_para(admin_user)


@pytest.fixture
def pdf():
    def _pdf(name="CV_MariaCamilaRuiz.pdf", content=PDF_MINIMO):
        return SimpleUploadedFile(name, content, content_type="application/pdf")
    return _pdf


@pytest.fixture
def vacante(empresa):
    """Una vacante aprobada de una empresa aprobada: visible para estudiantes."""
    return crear_vacante(empresa.company_profile)


def crear_vacante(company, **kwargs):
    datos = {
        "title": "Practicante de Análisis de Datos",
        "city": "Bogotá",
        "modality": "HIBRIDA",
        "stage": "PRODUCTIVA",
        "description": "Apoyo al equipo de datos en reportes y dashboards.",
        "skills": ["SQL", "Excel"],
        "status": VacancyStatus.APROBADA,
    }
    datos.update(kwargs)
    return Vacancy.objects.create(company=company, **datos)


@pytest.fixture
def con_hoja_de_vida(estudiante, pdf):
    perfil = estudiante.student_profile
    perfil.cv.save("cv.pdf", pdf(), save=True)
    return perfil
