"""
Pruebas de HU-08 (Ver detalle y postularme), HU-10 (Seguir mis
postulaciones) y HU-16 (Gestionar postulantes).
"""
import pytest
from django.urls import reverse

from apps.applications.models import Application
from conftest import cliente_para, crear_vacante

pytestmark = pytest.mark.django_db


# --- HU-08 · Ver detalle y postularme ---------------------------------------

def test_postulacion_exitosa(client_estudiante, con_hoja_de_vida, vacante):
    antes = client_estudiante.get(reverse("vacancy-detail", args=[vacante.id])).data
    response = client_estudiante.post(reverse("student-applications"), {"vacancy": vacante.id})
    assert response.status_code == 201
    assert response.data["status_display"] == "Aplicado"
    despues = client_estudiante.get(reverse("vacancy-detail", args=[vacante.id])).data
    assert despues["applicants_count"] == antes["applicants_count"] + 1


def test_postularse_sin_hoja_de_vida(client_estudiante, vacante):
    response = client_estudiante.post(reverse("student-applications"), {"vacancy": vacante.id})
    assert response.status_code == 400
    assert response.data["code"] == "cv_required"
    assert not Application.objects.exists()


def test_postulacion_repetida(client_estudiante, con_hoja_de_vida, vacante):
    client_estudiante.post(reverse("student-applications"), {"vacancy": vacante.id})
    detalle = client_estudiante.get(reverse("vacancy-detail", args=[vacante.id])).data
    assert detalle["my_application"]["status"] == "APLICADO"  # → "Ya te postulaste"
    response = client_estudiante.post(reverse("student-applications"), {"vacancy": vacante.id})
    assert response.status_code == 400
    assert response.data["code"] == "already_applied"
    assert Application.objects.count() == 1


def test_no_se_puede_postular_a_vacante_no_aprobada(client_estudiante, con_hoja_de_vida, empresa):
    oculta = crear_vacante(empresa.company_profile, status="PENDIENTE")
    response = client_estudiante.post(reverse("student-applications"), {"vacancy": oculta.id})
    assert response.status_code == 404


def test_detalle_de_vacante_no_aprobada_no_existe(client_estudiante, empresa):
    oculta = crear_vacante(empresa.company_profile, status="BORRADOR")
    assert client_estudiante.get(reverse("vacancy-detail", args=[oculta.id])).status_code == 404


def test_empresa_no_puede_postularse(client_empresa, vacante):
    response = client_empresa.post(reverse("student-applications"), {"vacancy": vacante.id})
    assert response.status_code == 403


# --- HU-10 · Seguir mis postulaciones ---------------------------------------

def test_ver_estados_de_mis_postulaciones(client_estudiante, con_hoja_de_vida, empresa):
    v1 = crear_vacante(empresa.company_profile, title="Datos")
    v2 = crear_vacante(empresa.company_profile, title="Diseño")
    Application.objects.create(student=con_hoja_de_vida, vacancy=v1)
    Application.objects.create(student=con_hoja_de_vida, vacancy=v2, status="ENTREVISTA")
    data = client_estudiante.get(reverse("student-applications")).data
    estados = {a["vacancy"]["title"]: a["status_display"] for a in data}
    assert estados == {"Datos": "Aplicado", "Diseño": "Entrevista"}


def test_solo_veo_mis_postulaciones(otro_estudiante, con_hoja_de_vida, vacante):
    Application.objects.create(student=con_hoja_de_vida, vacancy=vacante)
    assert cliente_para(otro_estudiante).get(reverse("student-applications")).data == []


# --- HU-16 · Gestionar postulantes ------------------------------------------

@pytest.fixture
def postulacion(con_hoja_de_vida, vacante):
    return Application.objects.create(student=con_hoja_de_vida, vacancy=vacante,
                                      status="EN_REVISION")


def test_cambiar_estado_se_refleja_en_el_estudiante(client_empresa, client_estudiante,
                                                    postulacion):
    response = client_empresa.patch(
        reverse("application-status", args=[postulacion.id]), {"status": "ENTREVISTA"},
        format="json",
    )
    assert response.status_code == 200
    assert response.data["status_display"] == "Entrevista"
    lista = client_empresa.get(reverse("company-applications")).data
    assert lista[0]["status"] == "ENTREVISTA"
    mias = client_estudiante.get(reverse("student-applications")).data
    assert mias[0]["status_display"] == "Entrevista"


def test_ver_hoja_de_vida_del_postulante(client_empresa, postulacion):
    lista = client_empresa.get(reverse("company-applications"),
                               {"vacante": postulacion.vacancy_id}).data
    assert lista[0]["student"]["full_name"] == "María Camila Ruiz"
    assert lista[0]["student"]["cv_url"].endswith(".pdf")


def test_otra_empresa_no_ve_ni_cambia_mis_postulantes(empresa_pendiente, postulacion):
    client = cliente_para(empresa_pendiente)
    assert client.get(reverse("company-applications")).data == []
    response = client.patch(reverse("application-status", args=[postulacion.id]),
                            {"status": "ACEPTADO"}, format="json")
    assert response.status_code == 404


def test_estudiante_no_puede_cambiar_estados(client_estudiante, postulacion):
    response = client_estudiante.patch(reverse("application-status", args=[postulacion.id]),
                                       {"status": "ACEPTADO"}, format="json")
    assert response.status_code == 403


def test_estado_invalido(client_empresa, postulacion):
    response = client_empresa.patch(reverse("application-status", args=[postulacion.id]),
                                    {"status": "CONTRATADISIMO"}, format="json")
    assert response.status_code == 400
