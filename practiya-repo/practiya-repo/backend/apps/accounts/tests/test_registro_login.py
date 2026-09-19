"""
Pruebas de HU-01 y HU-02 — sirven de referencia para T2/T3 (backend) y
como base de lo que Desarrollador 6 (T6, verificacion end-to-end) debe
confirmar tambien contra el frontend real.
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


def test_registro_exitoso(client):
    payload = {
        "email": "maria@example.com",
        "username": "mariac",
        "password": "ClaveSegura123",
        "password_confirm": "ClaveSegura123",
        "role": "ESTUDIANTE",
        "terms_accepted": True,
    }
    response = client.post(reverse("register"), payload)
    assert response.status_code == 201


def test_registro_sin_aceptar_terminos(client):
    payload = {
        "email": "maria@example.com",
        "username": "mariac",
        "password": "ClaveSegura123",
        "password_confirm": "ClaveSegura123",
        "role": "ESTUDIANTE",
        "terms_accepted": False,
    }
    response = client.post(reverse("register"), payload)
    assert response.status_code == 400


def test_registro_contrasenas_no_coinciden(client):
    payload = {
        "email": "maria@example.com",
        "username": "mariac",
        "password": "ClaveSegura123",
        "password_confirm": "OtraClave456",
        "role": "ESTUDIANTE",
        "terms_accepted": True,
    }
    response = client.post(reverse("register"), payload)
    assert response.status_code == 400


def test_login_credenciales_incorrectas(client):
    response = client.post(reverse("login"), {"email": "no-existe@example.com", "password": "x"})
    assert response.status_code == 401
