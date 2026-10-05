"""
Serializers de HU-01 (registro). El login usa los serializers que trae
djangorestframework-simplejwt de fabrica (ver urls.py) — no hace falta
reescribirlos salvo que se quiera devolver el `role` junto al token
(recomendado: sobreescribir TokenObtainPairSerializer, ver nota abajo).
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField()

    class Meta:
        model = User
        fields = ["email", "username", "password", "password_confirm", "role", "terms_accepted"]

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

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserRoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extiende el serializer de login de simplejwt para devolver el rol
    del usuario junto con el access/refresh token — el frontend lo
    necesita para redirigir a la pantalla correcta (HU-02).
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["role"] = self.user.role
        data["email"] = self.user.email
        return data
