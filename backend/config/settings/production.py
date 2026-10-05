"""
Configuracion de produccion (Render). Se activa con la variable
DJANGO_SETTINGS_MODULE=config.settings.production en Render; nunca
en la maquina local. Ver docs/DESPLIEGUE.md.
"""
from .base import *  # noqa: F401,F403
from .base import DATABASES, STORAGES, env

DEBUG = False

# En produccion SECRET_KEY, ALLOWED_HOSTS y CORS_ALLOWED_ORIGINS deben
# venir de variables de entorno — nunca dejarlos abiertos con "*".
SECRET_KEY = env("SECRET_KEY")

# Render agrega su propio dominio en esta variable automaticamente.
RENDER_EXTERNAL_HOSTNAME = env("RENDER_EXTERNAL_HOSTNAME", default="")
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:  # noqa: F405
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)  # noqa: F405
    # Necesario para poder entrar al Django Admin por HTTPS.
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")  # noqa: F405

# Supabase exige conexiones cifradas.
if DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql":
    DATABASES["default"].setdefault("OPTIONS", {})["sslmode"] = "require"

# Archivos estaticos (CSS del Django Admin) servidos por WhiteNoise.
STORAGES["staticfiles"] = {
    "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
}

# Render termina HTTPS antes de llegar a Django.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
