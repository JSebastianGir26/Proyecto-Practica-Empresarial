"""Pruebas de HU-19 (Aprobar empresas y vacantes)."""
import pytest
from django.urls import reverse

from apps.jobs.models import VacancyStatus
from conftest import crear_vacante

pytestmark = pytest.mark.django_db


def test_aprobar_empresa_hace_visibles_sus_vacantes(client_admin, client_estudiante,
                                                    empresa_pendiente):
    crear_vacante(empresa_pendiente.company_profile)
    assert client_estudiante.get(reverse("vacancy-search")).data["count"] == 0

    pendientes = client_admin.get(reverse("moderation-companies")).data
    assert [c["name"] for c in pendientes] == ["Grupo Andina Logística"]

    company_id = empresa_pendiente.company_profile.id
    response = client_admin.post(reverse("moderation-company-approve", args=[company_id]))
    assert response.status_code == 200
    assert response.data["status"] == "APROBADA"
    assert client_estudiante.get(reverse("vacancy-search")).data["count"] == 1


def test_rechazar_vacante(client_admin, client_empresa, client_estudiante, empresa):
    vacante = crear_vacante(empresa.company_profile, status=VacancyStatus.PENDIENTE)
    response = client_admin.post(
        reverse("moderation-vacancy-reject", args=[vacante.id]),
        {"reason": "La descripción no corresponde a un contrato de aprendizaje."},
        format="json",
    )
    assert response.status_code == 200
    # No es visible para estudiantes...
    assert client_estudiante.get(reverse("vacancy-search")).data["count"] == 0
    # ...y la empresa ve el aviso del rechazo con el motivo.
    mia = client_empresa.get(reverse("company-vacancy", args=[vacante.id])).data
    assert mia["status_display"] == "Rechazada"
    assert "contrato de aprendizaje" in mia["rejection_reason"]


def test_aprobar_vacante(client_admin, client_estudiante, empresa):
    vacante = crear_vacante(empresa.company_profile, status=VacancyStatus.PENDIENTE)
    client_admin.post(reverse("moderation-vacancy-approve", args=[vacante.id]))
    assert client_estudiante.get(reverse("vacancy-search")).data["count"] == 1


def test_no_se_revisan_borradores(client_admin, empresa):
    borrador = crear_vacante(empresa.company_profile, status=VacancyStatus.BORRADOR)
    response = client_admin.post(reverse("moderation-vacancy-approve", args=[borrador.id]))
    assert response.status_code == 400


def test_resumen(client_admin, empresa_pendiente, empresa):
    crear_vacante(empresa.company_profile, status=VacancyStatus.PENDIENTE)
    assert client_admin.get(reverse("moderation-summary")).data == {
        "pending_companies": 1, "pending_vacancies": 1,
    }


@pytest.mark.parametrize("cliente", ["client_estudiante", "client_empresa"])
def test_solo_admin_puede_moderar(request, cliente, empresa_pendiente):
    client = request.getfixturevalue(cliente)
    company_id = empresa_pendiente.company_profile.id
    assert client.get(reverse("moderation-companies")).status_code == 403
    assert client.post(reverse("moderation-company-approve",
                               args=[company_id])).status_code == 403
