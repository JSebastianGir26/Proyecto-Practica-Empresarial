from django.urls import path

from .views import ApplicationStatusView, CompanyApplicationsView, StudentApplicationsView

urlpatterns = [
    path("", StudentApplicationsView.as_view(), name="student-applications"),
    path("empresa/", CompanyApplicationsView.as_view(), name="company-applications"),
    path("<int:pk>/estado/", ApplicationStatusView.as_view(), name="application-status"),
]
