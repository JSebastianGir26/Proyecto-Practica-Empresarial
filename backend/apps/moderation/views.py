from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole
from apps.companies.models import CompanyProfile
from apps.jobs.models import Vacancy, VacancyStatus

from .models import ReviewStatus, aprobar, rechazar
from .serializers import CompanyReviewSerializer, RejectSerializer, VacancyReviewSerializer


class SummaryView(APIView):
    """GET /api/moderacion/resumen/ — contadores de las pestanas."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response({
            "pending_companies": CompanyProfile.objects.filter(status=ReviewStatus.PENDIENTE).count(),
            "pending_vacancies": Vacancy.objects.filter(status=VacancyStatus.PENDIENTE).count(),
        })


class _ReviewListView(generics.ListAPIView):
    permission_classes = [IsAdminRole]
    pagination_class = None

    def estado(self):
        estado = self.request.query_params.get("estado", ReviewStatus.PENDIENTE)
        return estado if estado in ReviewStatus.values else ReviewStatus.PENDIENTE


class CompanyReviewListView(_ReviewListView):
    """GET /api/moderacion/empresas/?estado=PENDIENTE|APROBADA|RECHAZADA"""

    serializer_class = CompanyReviewSerializer

    def get_queryset(self):
        return (
            CompanyProfile.objects.filter(status=self.estado())
            .select_related("user")
            .annotate(vacancies_count=Count("vacancies"))
            .order_by("created_at")
        )


class VacancyReviewListView(_ReviewListView):
    """GET /api/moderacion/vacantes/?estado=PENDIENTE|APROBADA|RECHAZADA"""

    serializer_class = VacancyReviewSerializer

    def get_queryset(self):
        return (
            Vacancy.objects.filter(status=self.estado())
            .select_related("company__user")
            .order_by("submitted_at", "id")
        )


class ReviewActionView(APIView):
    """
    POST /api/moderacion/empresas/<id>/aprobar/   ·  /rechazar/ {reason}
    POST /api/moderacion/vacantes/<id>/aprobar/   ·  /rechazar/ {reason}
    """

    permission_classes = [IsAdminRole]
    model = None
    action = None

    def post(self, request, pk):
        obj = get_object_or_404(self.model, pk=pk)
        if self.model is Vacancy and obj.status not in (
            VacancyStatus.PENDIENTE, VacancyStatus.APROBADA, VacancyStatus.PAUSADA
        ):
            return Response(
                {"detail": "Solo se pueden revisar vacantes enviadas a revisión."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if self.action == "aprobar":
            aprobar(obj, request.user)
        else:
            serializer = RejectSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            rechazar(obj, request.user, serializer.validated_data.get("reason", ""))
        serializer_class = VacancyReviewSerializer if self.model is Vacancy else CompanyReviewSerializer
        return Response(serializer_class(obj, context={"request": request}).data)
