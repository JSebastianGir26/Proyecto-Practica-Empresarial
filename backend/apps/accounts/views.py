from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer, UserRoleTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """HU-01 · Crear cuenta — POST /api/auth/register/"""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    """HU-02 · Iniciar sesion — POST /api/auth/login/"""
    serializer_class = UserRoleTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
