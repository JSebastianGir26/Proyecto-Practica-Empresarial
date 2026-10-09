from django.urls import path

from apps.companies.models import CompanyProfile
from apps.jobs.models import Vacancy

from .views import CompanyReviewListView, ReviewActionView, SummaryView, VacancyReviewListView

urlpatterns = [
    path("resumen/", SummaryView.as_view(), name="moderation-summary"),
    path("empresas/", CompanyReviewListView.as_view(), name="moderation-companies"),
    path("empresas/<int:pk>/aprobar/",
         ReviewActionView.as_view(model=CompanyProfile, action="aprobar"),
         name="moderation-company-approve"),
    path("empresas/<int:pk>/rechazar/",
         ReviewActionView.as_view(model=CompanyProfile, action="rechazar"),
         name="moderation-company-reject"),
    path("vacantes/", VacancyReviewListView.as_view(), name="moderation-vacancies"),
    path("vacantes/<int:pk>/aprobar/",
         ReviewActionView.as_view(model=Vacancy, action="aprobar"),
         name="moderation-vacancy-approve"),
    path("vacantes/<int:pk>/rechazar/",
         ReviewActionView.as_view(model=Vacancy, action="rechazar"),
         name="moderation-vacancy-reject"),
]
