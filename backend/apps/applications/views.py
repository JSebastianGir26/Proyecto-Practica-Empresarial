from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmpresa, IsEstudiante
from apps.jobs.models import Vacancy
from apps.students.views import perfil_de

from .models import Application
from .serializers import (
    ApplyCreateSerializer,
    CompanyApplicationSerializer,
    StatusChangeSerializer,
    StudentApplicationSerializer,
)


class StudentApplicationsView(APIView):
    """
    GET  /api/postulaciones/              HU-10 · mis postulaciones con su estado
    POST /api/postulaciones/ {vacancy}    HU-08 · postularme a una vacante
    """

    permission_classes = [IsEstudiante]

    def get(self, request):
        apps = (
            Application.objects.filter(student__user=request.user)
            .select_related("vacancy__company__user")
        )
        data = StudentApplicationSerializer(apps, many=True, context={"request": request}).data
        return Response(data)

    def post(self, request):
        serializer = ApplyCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vacancy = get_object_or_404(Vacancy.objects.visibles(), pk=serializer.validated_data["vacancy"])
        profile = perfil_de(request.user)

        # HU-08 "Sin hoja de vida": se pide cargarla antes de continuar.
        if not profile.cv:
            return Response(
                {"code": "cv_required",
                 "detail": "Sube tu hoja de vida en PDF antes de postularte."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            with transaction.atomic():
                app = Application.objects.create(student=profile, vacancy=vacancy)
        except IntegrityError:
            # HU-08 "Postulacion repetida"
            return Response(
                {"code": "already_applied", "detail": "Ya te postulaste a esta vacante."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = StudentApplicationSerializer(app, context={"request": request}).data
        data["applicants_count"] = vacancy.applications.count()
        return Response(data, status=status.HTTP_201_CREATED)


class CompanyApplicationsView(generics.ListAPIView):
    """HU-16 · GET /api/postulaciones/empresa/?vacante=<id>&estado=<ESTADO>"""

    serializer_class = CompanyApplicationSerializer
    permission_classes = [IsEmpresa]
    pagination_class = None

    def get_queryset(self):
        qs = (
            Application.objects.filter(vacancy__company__user=self.request.user)
            .select_related("student__user", "vacancy")
        )
        vacante = self.request.query_params.get("vacante")
        if vacante and vacante.isdigit():
            qs = qs.filter(vacancy_id=vacante)
        estado = self.request.query_params.get("estado")
        if estado:
            qs = qs.filter(status=estado)
        return qs


class ApplicationStatusView(APIView):
    """HU-16 · Cambiar estado — PATCH /api/postulaciones/<id>/estado/ {status}"""

    permission_classes = [IsEmpresa]

    def patch(self, request, pk):
        app = get_object_or_404(
            Application.objects.select_related("student__user", "vacancy"),
            pk=pk, vacancy__company__user=request.user,
        )
        serializer = StatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nuevo = serializer.validated_data["status"]
        if nuevo != app.status:
            app.status = nuevo
            app.status_changed_at = timezone.now()
            app.save(update_fields=["status", "status_changed_at"])
        return Response(CompanyApplicationSerializer(app, context={"request": request}).data)
