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

    # Epic 1 - Cuenta y acceso (HU-01, HU-02, HU-03) — Sprint 1
    path("api/auth/", include("apps.accounts.urls")),

    # Siguientes epicas: descomentar cuando la app tenga endpoints reales.
    # path("api/estudiantes/", include("apps.students.urls")),       # Epic 2
    # path("api/vacantes/", include("apps.jobs.urls")),               # Epic 3
    # path("api/postulaciones/", include("apps.applications.urls")),  # Epic 3
    # path("api/comunidad/", include("apps.community.urls")),         # Epic 4
    # path("api/empresas/", include("apps.companies.urls")),          # Epic 5
    # path("api/notificaciones/", include("apps.notifications.urls")),# Epic 6
    # path("api/moderacion/", include("apps.moderation.urls")),       # Epic 7
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
