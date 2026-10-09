"""Pruebas de HU-04 (Editar mi perfil) y HU-05 (Subir hoja de vida)."""
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from conftest import PDF_MINIMO, cliente_para

pytestmark = pytest.mark.django_db

CV_ERROR = "Formato no permitido. Sube un PDF de máximo 5 MB."


# --- HU-04 · Editar mi perfil -----------------------------------------------

def test_guardar_habilidad_aumenta_porcentaje(client_estudiante):
    antes = client_estudiante.get(reverse("student-profile")).data["completion"]
    response = client_estudiante.patch(
        reverse("student-profile"), {"skills": ["SQL", "Power BI"]}, format="json"
    )
    assert response.status_code == 200
    assert "Power BI" in response.data["skills"]
    assert response.data["completion"] > antes


def test_perfil_incompleto_dice_que_falta(client_estudiante):
    data = client_estudiante.get(reverse("student-profile")).data
    assert data["completion"] < 100
    assert "Hoja de vida" in data["missing_fields"]
    assert "Habilidades" in data["missing_fields"]


def test_editar_nombre_y_datos_academicos(client_estudiante, estudiante):
    response = client_estudiante.patch(reverse("student-profile"), {
        "full_name": "María Camila Ruiz Gómez",
        "program": "Ingeniería Industrial",
        "institution": "SENA",
        "semester": 8,
        "city": "Bogotá",
    }, format="json")
    assert response.status_code == 200
    estudiante.refresh_from_db()
    assert estudiante.first_name == "María Camila Ruiz Gómez"
    assert response.data["semester"] == 8


def test_habilidades_repetidas_se_limpian(client_estudiante):
    response = client_estudiante.patch(
        reverse("student-profile"), {"skills": ["SQL", " sql ", "", "Excel"]}, format="json"
    )
    assert response.data["skills"] == ["SQL", "Excel"]


def test_semestre_invalido(client_estudiante):
    response = client_estudiante.patch(reverse("student-profile"), {"semester": 40}, format="json")
    assert response.status_code == 400


def test_empresa_no_puede_usar_perfil_de_estudiante(empresa):
    assert cliente_para(empresa).get(reverse("student-profile")).status_code == 403


# --- HU-05 · Subir hoja de vida ---------------------------------------------

def test_subir_pdf_valido(client_estudiante, pdf):
    response = client_estudiante.put(reverse("student-cv"), {"cv": pdf()}, format="multipart")
    assert response.status_code == 200
    assert response.data["cv_filename"] == "CV_MariaCamilaRuiz.pdf"
    assert response.data["cv_url"]
    assert "Hoja de vida" not in response.data["missing_fields"]


def test_reemplazar_pdf(client_estudiante, pdf):
    client_estudiante.put(reverse("student-cv"), {"cv": pdf("viejo.pdf")}, format="multipart")
    response = client_estudiante.put(reverse("student-cv"), {"cv": pdf("nuevo.pdf")},
                                     format="multipart")
    assert response.data["cv_filename"] == "nuevo.pdf"


def test_formato_no_permitido(client_estudiante):
    docx = SimpleUploadedFile("CV.docx", b"PK\x03\x04 contenido", content_type="application/msword")
    response = client_estudiante.put(reverse("student-cv"), {"cv": docx}, format="multipart")
    assert response.status_code == 400
    assert response.data["cv"] == [CV_ERROR]


def test_docx_renombrado_a_pdf_se_rechaza(client_estudiante):
    falso = SimpleUploadedFile("CV.pdf", b"PK\x03\x04 no soy un pdf")
    response = client_estudiante.put(reverse("student-cv"), {"cv": falso}, format="multipart")
    assert response.status_code == 400


def test_archivo_muy_pesado(client_estudiante, pdf):
    grande = pdf(content=PDF_MINIMO + b"0" * (5 * 1024 * 1024))
    response = client_estudiante.put(reverse("student-cv"), {"cv": grande}, format="multipart")
    assert response.status_code == 400
    assert response.data["cv"] == [CV_ERROR]


def test_eliminar_hoja_de_vida(client_estudiante, pdf):
    client_estudiante.put(reverse("student-cv"), {"cv": pdf()}, format="multipart")
    assert client_estudiante.delete(reverse("student-cv")).status_code == 204
    assert client_estudiante.get(reverse("student-profile")).data["cv_url"] is None
