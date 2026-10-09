from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmpresa
from apps.applications.models import Application, ApplicationStatus
from apps.jobs.models import VacancyStatus

from .models import CompanyProfile
from .serializers import CompanyProfileSerializer


def empresa_de(user):
    return CompanyProfile.objects.select_related("user").get_or_create(user=user)[0]


class MyCompanyView(generics.RetrieveUpdateAPIView):
    """HU-14 · Perfil de empresa — GET/PATCH /api/empresas/perfil/"""

    serializer_class = CompanyProfileSerializer
    permission_classes = [IsEmpresa]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    http_method_names = ["get", "patch", "options"]

    def get_object(self):
        return empresa_de(self.request.user)


class DashboardView(APIView):
    """
    Panel de la empresa — GET /api/empresas/panel/
    Metricas basicas que muestra el mockup (la version completa es HU-17).
    """

    permission_classes = [IsEmpresa]

    def get(self, request):
        company = empresa_de(request.user)
        hace_7_dias = timezone.now() - timedelta(days=7)
        apps = Application.objects.filter(vacancy__company=company)
        stats = apps.aggregate(
            nuevos=Count("id", filter=Q(created_at__gte=hace_7_dias)),
            entrevistas=Count("id", filter=Q(status=ApplicationStatus.ENTREVISTA)),
            aceptados=Count("id", filter=Q(status=ApplicationStatus.ACEPTADO)),
            total=Count("id"),
        )
        return Response({
            "active_vacancies": company.vacancies.filter(status=VacancyStatus.APROBADA).count(),
            "new_applicants": stats["nuevos"],
            "interviews": stats["entrevistas"],
            "accepted": stats["aceptados"],
            "total_applicants": stats["total"],
        })
