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
]

# Cada app corresponde a una Epica del backlog de PractiYA (docs/backlog).
LOCAL_APPS = [
    "apps.accounts",        # Epic 1 - Cuenta y acceso
    "apps.students",        # Epic 2 - Perfil del estudiante
    "apps.jobs",            # Epic 3 - Busqueda y postulacion (vacantes)
    "apps.applications",    # Epic 3 - Busqueda y postulacion (postulaciones)
    "apps.community",       # Epic 4 - Comunidad (feed, comunidades)
    "apps.companies",       # Epic 5 - Empresa
    "apps.messaging",       # Mensajeria / chat (fuera del MVP)
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
# Base de datos
#  - Local: si no defines DATABASE_URL se usa SQLite (un archivo
#    db.sqlite3), asi nadie necesita instalar PostgreSQL para empezar.
#  - Produccion (Render): DATABASE_URL apunta a PostgreSQL en Supabase.
#  Ver backend/.env.example y docs/DESPLIEGUE.md.
# -----------------------------------------------------------------------
DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
}
if DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql":
    DATABASES["default"]["CONN_MAX_AGE"] = 60
    DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

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

# Por defecto los archivos subidos se guardan en la carpeta backend/media
# (local). Si se configuran las variables SUPABASE_S3_* se guardan en
# Supabase Storage, que es lo que usa produccion (Render borra el disco
# en cada despliegue, por eso no se pueden guardar ahi).
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

if env("SUPABASE_S3_ENDPOINT", default=""):
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "endpoint_url": env("SUPABASE_S3_ENDPOINT"),
            "region_name": env("SUPABASE_S3_REGION", default="us-east-1"),
            "access_key": env("SUPABASE_S3_ACCESS_KEY_ID"),
            "secret_key": env("SUPABASE_S3_SECRET_ACCESS_KEY"),
            "bucket_name": env("SUPABASE_S3_BUCKET", default="practiya"),
            "addressing_style": "path",
            "signature_version": "s3v4",
            # Bucket privado: las hojas de vida se entregan con enlaces
            # firmados que vencen, nunca con un enlace publico.
            "querystring_auth": True,
            "querystring_expire": 3600,
            "file_overwrite": False,
        },
    }

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
# Para las versiones de vista previa de Vercel (una URL distinta por cada
# Pull Request). Ejemplo: ^https://practiya-[a-z0-9-]+\.vercel\.app$
CORS_ALLOWED_ORIGIN_REGEXES = env.list("CORS_ALLOWED_ORIGIN_REGEXES", default=[])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])
