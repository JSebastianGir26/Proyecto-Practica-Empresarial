"""
Configuracion base de Django para PractiYA, compartida por development.py
y production.py. No se usa directamente: DJANGO_SETTINGS_MODULE siempre
apunta a uno de esos dos archivos.
"""
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default="inseguro-solo-para-desarrollo")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

# -----------------------------------------------------------------------
# Apps
# -----------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "channels",
]

# Cada app corresponde a una Epica del backlog de PractiYA (docs/backlog).
LOCAL_APPS = [
    "apps.accounts",        # Epic 1 - Cuenta y acceso
    "apps.students",        # Epic 2 - Perfil del estudiante
    "apps.jobs",            # Epic 3 - Busqueda y postulacion (vacantes)
    "apps.applications",    # Epic 3 - Busqueda y postulacion (postulaciones)
    "apps.community",       # Epic 4 - Comunidad (feed, comunidades)
    "apps.companies",       # Epic 5 - Empresa
    "apps.messaging",       # Mensajeria / chat en tiempo real
    "apps.notifications",   # Epic 6 - Notificaciones
    "apps.moderation",      # Epic 7 - Moderacion
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# -----------------------------------------------------------------------
# Base de datos (PostgreSQL vía DATABASE_URL, ver backend/.env.example)
# -----------------------------------------------------------------------
DATABASES = {
    "default": env.db("DATABASE_URL"),
}

# -----------------------------------------------------------------------
# Usuario personalizado (ver apps/accounts/models.py) — define el rol
# Estudiante / Empresa que toda la app necesita desde el registro (HU-01).
# -----------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -----------------------------------------------------------------------
# Internacionalizacion
# -----------------------------------------------------------------------
LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

# -----------------------------------------------------------------------
# Archivos estaticos y media (CVs, logos, certificados — HU-05, HU-14)
# -----------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -----------------------------------------------------------------------
# Django REST Framework + JWT
# -----------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("ACCESS_TOKEN_LIFETIME_MIN", default=60)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("REFRESH_TOKEN_LIFETIME_DAYS", default=7)),
    "ROTATE_REFRESH_TOKENS": True,
}

# -----------------------------------------------------------------------
# CORS — el frontend Next.js vive en otro origen/puerto en desarrollo
# -----------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])

# -----------------------------------------------------------------------
# Channels (WebSockets) — mensajeria en tiempo real (pantalla "Mensajes")
# -----------------------------------------------------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [env("REDIS_URL", default="redis://localhost:6379/0")],
        },
    },
}
