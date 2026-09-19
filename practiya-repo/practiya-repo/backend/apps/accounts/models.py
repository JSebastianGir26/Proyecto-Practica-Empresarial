"""
Epic 1 - Cuenta y acceso
HU-01 Crear cuenta · HU-02 Iniciar sesion · HU-03 Recuperar contrasena

El modelo de Usuario es la base de todo el proyecto: el campo `role`
es lo que luego decide que pantallas ve cada quien (Estudiante vs
Empresa) y que permisos aplican en el resto de las apps.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ESTUDIANTE = "ESTUDIANTE", "Estudiante"
    EMPRESA = "EMPRESA", "Empresa"
    ADMIN = "ADMIN", "Administrador"  # Epic 7 - Moderacion


class User(AbstractUser):
    """
    Usuario base de PractiYA. Los datos especificos de cada rol
    (carrera/semestre para estudiante, NIT/sector para empresa) NO
    viven aqui — viven en apps.students.StudentProfile y
    apps.companies.CompanyProfile, relacionados por OneToOne a este
    modelo. Esto evita una tabla gigante con columnas que no aplican
    a la mitad de los usuarios.
    """
    email = models.EmailField("correo electronico", unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    terms_accepted = models.BooleanField(
        default=False,
        help_text="Aceptacion de terminos y tratamiento de datos — obligatorio en HU-01",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} ({self.role})"
