from django.urls import path

from .views import (
    CompanyVacancyActionView,
    CompanyVacancyDetailView,
    CompanyVacancyListView,
    VacancyDetailView,
    VacancySearchView,
)

urlpatterns = [
    # Estudiante (HU-06, HU-08)
    path("", VacancySearchView.as_view(), name="vacancy-search"),
    path("<int:pk>/", VacancyDetailView.as_view(), name="vacancy-detail"),
    # Empresa (HU-15)
    path("mias/", CompanyVacancyListView.as_view(), name="company-vacancies"),
    path("mias/<int:pk>/", CompanyVacancyDetailView.as_view(), name="company-vacancy"),
    path("mias/<int:pk>/publicar/", CompanyVacancyActionView.as_view(action="publicar"),
         name="company-vacancy-publish"),
    path("mias/<int:pk>/pausar/", CompanyVacancyActionView.as_view(action="pausar"),
         name="company-vacancy-pause"),
    path("mias/<int:pk>/reanudar/", CompanyVacancyActionView.as_view(action="reanudar"),
         name="company-vacancy-resume"),
]
