"""Pruebas de HU-14 (Perfil de empresa) y del panel de la empresa."""
import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image

from apps.applications.models import Application
from conftest import cliente_para

pytestmark = pytest.mark.django_db


def logo_png():
    buffer = io.BytesIO()
    Image.new("RGB", (8, 8), "#004961").save(buffer, "PNG")
    return SimpleUploadedFile("logo.png", buffer.getvalue(), content_type="image/png")


def test_guardar_perfil(client_empresa):
    response = client_empresa.patch(reverse("company-profile"), {
        "legal_name": "TechNova S.A.S.",
        "nit": "901.234.567-8",
        "website": "www.technova.com.co",
        "sectors": ["Tecnología", "Datos"],
    }, format="json")
    assert response.status_code == 200
    assert response.data["sectors"] == ["Tecnología", "Datos"]


def test_cambiar_logo_aparece_en_mis_vacantes(client_empresa, client_estudiante, vacante):
    response = client_empresa.patch(reverse("company-profile"), {"logo": logo_png()},
                                    format="multipart")
    assert response.status_code == 200
    assert response.data["logo_url"]
    tarjeta = client_estudiante.get(reverse("vacancy-search")).data["results"][0]
    assert tarjeta["company"]["logo_url"] == response.data["logo_url"]


def test_nit_invalido(client_empresa):
    response = client_empresa.patch(reverse("company-profile"), {"nit": "abc"}, format="json")
    assert response.status_code == 400


def test_empresa_rechazada_que_corrige_vuelve_a_revision(empresa_pendiente):
    perfil = empresa_pendiente.company_profile
    perfil.status = "RECHAZADA"
    perfil.save()
    response = cliente_para(empresa_pendiente).patch(
        reverse("company-profile"), {"nit": "890.112.334-2"}, format="json"
    )
    assert response.data["status"] == "PENDIENTE"


def test_empresa_no_puede_aprobarse_a_si_misma(empresa_pendiente):
    response = cliente_para(empresa_pendiente).patch(
        reverse("company-profile"), {"status": "APROBADA"}, format="json"
    )
    assert response.data["status"] == "PENDIENTE"


def test_panel_metricas(client_empresa, con_hoja_de_vida, vacante):
    Application.objects.create(student=con_hoja_de_vida, vacancy=vacante, status="ENTREVISTA")
    data = client_empresa.get(reverse("company-dashboard")).data
    assert data == {"active_vacancies": 1, "new_applicants": 1, "interviews": 1,
                    "accepted": 0, "total_applicants": 1}


def test_estudiante_no_ve_panel_de_empresa(client_estudiante):
    assert client_estudiante.get(reverse("company-dashboard")).status_code == 403
