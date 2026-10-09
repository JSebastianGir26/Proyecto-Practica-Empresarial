"""
Serializers de HU-01 (registro) y HU-02 (login).

El login usa TokenObtainPairSerializer de simplejwt, extendido para
devolver el rol y el nombre junto al token.
"""
import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Role

User = get_user_model()


def generar_username(email):
    """
    El formulario pide "Nombre completo" (con espacios y tildes), pero
    el `username` de Django solo acepta letras, numeros y @.+-_. Por eso
    el username se genera a partir del correo y el nombre se guarda en
    `first_name`.
    """
    base = re.sub(r"[^\w.@+-]", "", email.split("@")[0])[:140] or "usuario"
    candidato, n = base, 1
    while User.objects.filter(username=candidato).exists():
        n += 1
        candidato = f"{base}{n}"
    return candidato


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    username = serializers.CharField(max_length=150, required=False)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField()
    role = serializers.ChoiceField(choices=[Role.ESTUDIANTE, Role.EMPRESA])

    class Meta:
        model = User
        fields = [
            "email", "full_name", "username", "password", "password_confirm",
            "role", "terms_accepted",
        ]

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este correo.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya esta en uso.")
        return value

    def validate_terms_accepted(self, value):
        # Escenario Gherkin HU-01: "No acepta los terminos"
        if not value:
            raise serializers.ValidationError(
                "Debes aceptar los terminos y el tratamiento de datos."
            )
        return value

    def validate(self, attrs):
        # Escenario Gherkin HU-01: "Contrasenas no coinciden"
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Las contrasenas no coinciden"}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        full_name = validated_data.pop("full_name", "").strip()
        if not validated_data.get("username"):
            validated_data["username"] = generar_username(validated_data["email"])
        user = User(first_name=full_name[:150], **validated_data)
        user.set_password(password)
        user.save()
        crear_perfil(user)
        return user


def crear_perfil(user):
    """Cada estudiante y cada empresa nace con su perfil vacio (HU-04, HU-14)."""
    # Import local para evitar dependencias circulares entre apps.
    from apps.companies.models import CompanyProfile
    from apps.students.models import StudentProfile

    if user.role == Role.ESTUDIANTE:
        return StudentProfile.objects.get_or_create(user=user)[0]
    if user.role == Role.EMPRESA:
        return CompanyProfile.objects.get_or_create(
            user=user, defaults={"legal_name": user.first_name}
        )[0]
    return None


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="first_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "full_name", "role"]


class UserRoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Devuelve el rol y el nombre del usuario junto con el access/refresh
    token: el frontend los necesita para redirigir a la pantalla correcta
    (HU-02) y para saludar al usuario.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["role"] = self.user.role
        data["email"] = self.user.email
        data["full_name"] = self.user.first_name
        return data
