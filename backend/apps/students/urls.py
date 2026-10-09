from django.urls import path

from .views import MyCVView, MyProfileView

urlpatterns = [
    path("perfil/", MyProfileView.as_view(), name="student-profile"),
    path("perfil/hoja-de-vida/", MyCVView.as_view(), name="student-cv"),
]
