import django_filters
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Role
from apps.accounts.permissions import IsEmpresa
from apps.applications.models import Application
from apps.companies.views import empresa_de

from .models import Modality, Stage, Vacancy, VacancyStatus
from .serializers import CompanyVacancySerializer, VacancyCardSerializer, VacancyDetailSerializer


class VacancyFilter(django_filters.FilterSet):
    """HU-06 · palabra clave, modalidad, etapa de formacion y ciudad."""

    q = django_filters.CharFilter(method="filtrar_texto")
    modalidad = django_filters.ChoiceFilter(field_name="modality", choices=Modality.choices)
    etapa = django_filters.ChoiceFilter(field_name="stage", choices=Stage.choices)
    ciudad = django_filters.CharFilter(field_name="city", lookup_expr="icontains")

    class Meta:
        model = Vacancy
        fields = []

    def filtrar_texto(self, queryset, name, value):
        for palabra in value.split()[:6]:
            queryset = queryset.filter(
                Q(title__icontains=palabra)
                | Q(description__icontains=palabra)
                | Q(company__legal_name__icontains=palabra)
            )
        return queryset


class SearchPagination(PageNumberPagination):
    page_size = 10


class VacancySearchView(generics.ListAPIView):
    """HU-06 · Buscar pasantias — GET /api/vacantes/?q=&modalidad=&etapa=&ciudad=&page="""

    serializer_class = VacancyCardSerializer
    filterset_class = VacancyFilter
    pagination_class = SearchPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Vacancy.objects.visibles().select_related("company__user").order_by("-reviewed_at", "-id")


class VacancyDetailView(generics.RetrieveAPIView):
    """HU-08 · Detalle de la vacante — GET /api/vacantes/<id>/"""

    serializer_class = VacancyDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Vacancy.objects.visibles()
            .select_related("company__user")
            .annotate(applicants_count=Count("applications"))
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        if user.role == Role.ESTUDIANTE:
            context["my_application"] = Application.objects.filter(
                vacancy_id=self.kwargs["pk"], student__user=user
            ).first()
        return context


# ---------------------------------------------------------------------------
# HU-15 · Vacantes de la empresa
# ---------------------------------------------------------------------------

class CompanyVacancyMixin:
    serializer_class = CompanyVacancySerializer
    permission_classes = [IsEmpresa]
    pagination_class = None

    def get_queryset(self):
        return (
            Vacancy.objects.filter(company__user=self.request.user)
            .annotate(applicants_count=Count("applications"))
            .order_by("-created_at")
        )


class CompanyVacancyListView(CompanyVacancyMixin, generics.ListCreateAPIView):
    """
    GET  /api/vacantes/mias/   vacantes de mi empresa (todas sus etapas)
    POST /api/vacantes/mias/   crea la vacante como Borrador ("Guardar borrador")
    """

    def perform_create(self, serializer):
        serializer.save(company=empresa_de(self.request.user), status=VacancyStatus.BORRADOR)


class CompanyVacancyDetailView(CompanyVacancyMixin, generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/vacantes/mias/<id>/"""

    http_method_names = ["get", "patch", "delete", "options"]

    def perform_destroy(self, instance):
        if instance.applications.exists():
            raise ValidationError(
                {"detail": "Esta vacante ya tiene postulantes. Ponla en pausa en lugar de eliminarla."}
            )
        instance.delete()


class CompanyVacancyActionView(APIView):
    """
    POST /api/vacantes/mias/<id>/publicar/   Borrador o Rechazada → Pendiente de revision
    POST /api/vacantes/mias/<id>/pausar/     Activa → En pausa (deja de verse)
    POST /api/vacantes/mias/<id>/reanudar/   En pausa → Activa
    """

    permission_classes = [IsEmpresa]
    action = None  # se define en urls.py

    TRANSICIONES = {
        "publicar": ({VacancyStatus.BORRADOR, VacancyStatus.RECHAZADA}, VacancyStatus.PENDIENTE),
        "pausar": ({VacancyStatus.APROBADA}, VacancyStatus.PAUSADA),
        "reanudar": ({VacancyStatus.PAUSADA}, VacancyStatus.APROBADA),
    }

    def post(self, request, pk):
        vacancy = get_object_or_404(Vacancy, pk=pk, company__user=request.user)
        origen, destino = self.TRANSICIONES[self.action]
        if vacancy.status not in origen:
            return Response(
                {"detail": f"No se puede {self.action} una vacante en estado "
                           f"\"{vacancy.get_status_display()}\"."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        update_fields = ["status"]
        if self.action == "publicar":
            # HU-15 "Campos obligatorios vacios"
            errors = vacancy.missing_required()
            if errors:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)
            vacancy.submitted_at = timezone.now()
            vacancy.rejection_reason = ""
            update_fields += ["submitted_at", "rejection_reason"]
        vacancy.status = destino
        vacancy.save(update_fields=update_fields + ["updated_at"])
        vacancy.applicants_count = vacancy.applications.count()
        return Response(CompanyVacancySerializer(vacancy).data)
