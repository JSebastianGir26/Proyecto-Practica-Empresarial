"""
Pruebas de HU-01 (Crear cuenta) y HU-02 (Iniciar sesion).
Cada prueba corresponde a un escenario Gherkin del backlog.
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


def payload(**overrides):
    data = {
        "email": "maria@example.com",
        "full_name": "María Camila Ruiz",
        "password": "ClaveSegura123",
        "password_confirm": "ClaveSegura123",
        "role": "ESTUDIANTE",
        "terms_accepted": True,
    }
    data.update(overrides)
    return data


# --- HU-01 · Crear cuenta ---------------------------------------------------

def test_registro_exitoso(client):
    response = client.post(reverse("register"), payload())
    assert response.status_code == 201
    user = User.objects.get(email="maria@example.com")
    assert user.first_name == "María Camila Ruiz"
    assert user.username  # se genera a partir del correo


def test_registro_crea_perfil_segun_rol(client):
    client.post(reverse("register"), payload())
    client.post(reverse("register"), payload(email="rrhh@technova.co", role="EMPRESA",
                                             full_name="TechNova S.A.S."))
    assert User.objects.get(email="maria@example.com").student_profile
    empresa = User.objects.get(email="rrhh@technova.co").company_profile
    assert empresa.legal_name == "TechNova S.A.S."
    assert empresa.status == "PENDIENTE"  # HU-19: nace pendiente de revision


def test_registro_con_username_explicito_sigue_funcionando(client):
    response = client.post(reverse("register"), payload(username="mariac"))
    assert response.status_code == 201
    assert User.objects.get(email="maria@example.com").username == "mariac"


def test_registro_sin_aceptar_terminos(client):
    response = client.post(reverse("register"), payload(terms_accepted=False))
    assert response.status_code == 400
    assert "terms_accepted" in response.data
    assert not User.objects.exists()


def test_registro_contrasenas_no_coinciden(client):
    response = client.post(reverse("register"), payload(password_confirm="OtraClave456"))
    assert response.status_code == 400
    assert response.data["password_confirm"] == ["Las contrasenas no coinciden"]


def test_registro_correo_repetido(client):
    client.post(reverse("register"), payload())
    response = client.post(reverse("register"), payload(email="MARIA@example.com"))
    assert response.status_code == 400
    assert "email" in response.data


def test_registro_no_permite_crear_administradores(client):
    response = client.post(reverse("register"), payload(role="ADMIN"))
    assert response.status_code == 400


# --- HU-02 · Iniciar sesion -------------------------------------------------

def test_login_credenciales_correctas_devuelve_rol(client):
    client.post(reverse("register"), payload(role="EMPRESA"))
    response = client.post(reverse("login"), {"email": "maria@example.com",
                                              "password": "ClaveSegura123"})
    assert response.status_code == 200
    assert response.data["role"] == "EMPRESA"
    assert response.data["full_name"] == "María Camila Ruiz"
    assert "access" in response.data and "refresh" in response.data


def test_login_credenciales_incorrectas(client):
    response = client.post(reverse("login"), {"email": "no-existe@example.com", "password": "x"})
    assert response.status_code == 401


def test_me_requiere_sesion(client):
    assert client.get(reverse("me")).status_code == 401
