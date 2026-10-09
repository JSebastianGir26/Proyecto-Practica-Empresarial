"""
URLs raiz de PractiYA.

Cada Epica del backlog expone sus endpoints bajo /api/<epica>/ desde su
propia app. Se van descomentando a medida que cada app tiene su primera
vista lista — evita importar una app que todavia no tiene urls.py con
contenido real y romper el arranque del servidor para todo el equipo.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Epic 1 - Cuenta y acceso (HU-01, HU-02)
    path("api/auth/", include("apps.accounts.urls")),

    # MVP (ver docs/MVP.md)
    path("api/estudiantes/", include("apps.students.urls")),       # Epic 2 - HU-04, HU-05
    path("api/vacantes/", include("apps.jobs.urls")),               # Epic 3/5 - HU-06, HU-08, HU-15
    path("api/postulaciones/", include("apps.applications.urls")),  # Epic 3/5 - HU-08, HU-10, HU-16
    path("api/empresas/", include("apps.companies.urls")),          # Epic 5 - HU-14
    path("api/moderacion/", include("apps.moderation.urls")),       # Epic 7 - HU-19

    # Fuera del MVP: descomentar cuando la app tenga endpoints reales.
    # path("api/comunidad/", include("apps.community.urls")),         # Epic 4
    # path("api/notificaciones/", include("apps.notifications.urls")),# Epic 6
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
