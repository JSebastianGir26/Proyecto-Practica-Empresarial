from django.urls import path

from .views import DashboardView, MyCompanyView

urlpatterns = [
    path("perfil/", MyCompanyView.as_view(), name="company-profile"),
    path("panel/", DashboardView.as_view(), name="company-dashboard"),
]
