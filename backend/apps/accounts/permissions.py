from rest_framework.permissions import BasePermission

from .models import Role


class _HasRole(BasePermission):
    role = None

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == self.role)


class IsEstudiante(_HasRole):
    message = "Solo los estudiantes pueden hacer esto."
    role = Role.ESTUDIANTE


class IsEmpresa(_HasRole):
    message = "Solo las empresas pueden hacer esto."
    role = Role.EMPRESA


class IsAdminRole(_HasRole):
    message = "Solo los administradores pueden hacer esto."
    role = Role.ADMIN
