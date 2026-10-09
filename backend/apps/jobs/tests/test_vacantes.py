"""Pruebas de HU-15 (Publicar vacante) y HU-06 (Buscar con filtros)."""
import pytest
from django.urls import reverse

from apps.jobs.models import Vacancy, VacancyStatus
from conftest import cliente_para, crear_vacante

pytestmark = pytest.mark.django_db

COMPLETA = {
    "title": "Practicante de Análisis de Datos",
    "city": "Bogotá",
    "openings": 2,
    "modality": "HIBRIDA",
    "stage": "PRODUCTIVA",
    "stipend": "100% de un SMLV",
    "description": "Apoyo al equipo de datos.",
    "requirements": ["Conocimientos básicos de SQL"],
    "skills": ["SQL", "Excel"],
}


# --- HU-15 · Publicar vacante -----------------------------------------------

def test_guardar_borrador_incompleto(client_empresa):
    response = client_empresa.post(reverse("company-vacancies"), {"city": "Cali"}, format="json")
    assert response.status_code == 201
    assert response.data["status"] == "BORRADOR"
    panel = client_empresa.get(reverse("company-vacancies")).data
    assert panel[0]["status_display"] == "Borrador"


def test_publicar_queda_pendiente_de_revision(client_empresa):
    vid = client_empresa.post(reverse("company-vacancies"), COMPLETA, format="json").data["id"]
    response = client_empresa.post(reverse("company-vacancy-publish", args=[vid]))
    assert response.status_code == 200
    assert response.data["status"] == "PENDIENTE"
    assert response.data["status_display"] == "Pendiente de revisión"


def test_publicar_sin_titulo_marca_campo_obligatorio(client_empresa):
    datos = {**COMPLETA, "title": ""}
    vid = client_empresa.post(reverse("company-vacancies"), datos, format="json").data["id"]
    response = client_empresa.post(reverse("company-vacancy-publish", args=[vid]))
    assert response.status_code == 400
    assert "title" in response.data
    assert Vacancy.objects.get(pk=vid).status == VacancyStatus.BORRADOR


def test_duracion_es_fija_seis_meses(client_empresa):
    datos = {**COMPLETA, "duration_months": 12}
    response = client_empresa.post(reverse("company-vacancies"), datos, format="json")
    assert response.data["duration_months"] == 6


def test_editar_vacante_activa_vuelve_a_revision(client_empresa, vacante):
    response = client_empresa.patch(
        reverse("company-vacancy", args=[vacante.id]), {"stipend": "Otro"}, format="json"
    )
    assert response.status_code == 200
    assert response.data["status"] == "PENDIENTE"


def test_pausar_y_reanudar(client_empresa, vacante):
    assert client_empresa.post(reverse("company-vacancy-pause", args=[vacante.id])).data[
        "status"] == "PAUSADA"
    assert client_empresa.post(reverse("company-vacancy-resume", args=[vacante.id])).data[
        "status"] == "APROBADA"


def test_empresa_no_ve_ni_edita_vacantes_ajenas(empresa_pendiente, vacante):
    client = cliente_para(empresa_pendiente)
    assert client.get(reverse("company-vacancies")).data == []
    assert client.patch(reverse("company-vacancy", args=[vacante.id]), {"title": "x"},
                        format="json").status_code == 404


def test_estudiante_no_puede_crear_vacantes(client_estudiante):
    response = client_estudiante.post(reverse("company-vacancies"), COMPLETA, format="json")
    assert response.status_code == 403


# --- HU-06 · Buscar pasantias con filtros -----------------------------------

@pytest.fixture
def varias_vacantes(empresa):
    company = empresa.company_profile
    crear_vacante(company, title="Practicante de Datos", modality="REMOTA", city="Bogotá")
    crear_vacante(company, title="Practicante de Diseño UX", modality="PRESENCIAL",
                  city="Medellín")
    crear_vacante(company, title="Practicante de Logística", modality="PRESENCIAL",
                  stage="LECTIVA", city="Cali")
    crear_vacante(company, title="Borrador oculto", status=VacancyStatus.BORRADOR)
    crear_vacante(company, title="Pendiente oculta", status=VacancyStatus.PENDIENTE)


def test_filtrar_remotas(client_estudiante, varias_vacantes):
    response = client_estudiante.get(reverse("vacancy-search"), {"modalidad": "REMOTA"})
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert all(v["modality"] == "REMOTA" for v in response.data["results"])


def test_solo_se_ven_vacantes_aprobadas(client_estudiante, varias_vacantes):
    titulos = [v["title"] for v in client_estudiante.get(reverse("vacancy-search")).data["results"]]
    assert len(titulos) == 3
    assert "Borrador oculto" not in titulos and "Pendiente oculta" not in titulos


def test_filtros_por_etapa_ciudad_y_palabra(client_estudiante, varias_vacantes):
    url = reverse("vacancy-search")
    assert client_estudiante.get(url, {"etapa": "LECTIVA"}).data["count"] == 1
    assert client_estudiante.get(url, {"ciudad": "medell"}).data["count"] == 1
    assert client_estudiante.get(url, {"q": "diseño"}).data["count"] == 1
    assert client_estudiante.get(url, {"q": "technova"}).data["count"] == 3


def test_sin_resultados(client_estudiante, varias_vacantes):
    response = client_estudiante.get(reverse("vacancy-search"), {"q": "astronauta"})
    assert response.data["count"] == 0
    assert response.data["results"] == []


def test_vacantes_de_empresa_no_aprobada_no_se_ven(client_estudiante, empresa_pendiente):
    crear_vacante(empresa_pendiente.company_profile)
    assert client_estudiante.get(reverse("vacancy-search")).data["count"] == 0


def test_buscar_requiere_sesion(anon):
    assert anon.get(reverse("vacancy-search")).status_code == 401
