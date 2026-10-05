from rest_framework.permissions import BasePermission


class IsEstudiante(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == "ESTUDIANTE")


class IsEmpresa(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == "EMPRESA")


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == "ADMIN")
