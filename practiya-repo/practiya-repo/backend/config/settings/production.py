"""
Configuracion para el entorno de produccion/staging.
Se activa exportando DJANGO_SETTINGS_MODULE=config.settings.production
en el servidor (Railway/Render/etc.), nunca en la maquina local.
"""
from .base import *  # noqa: F401,F403

DEBUG = False

# En produccion ALLOWED_HOSTS y CORS_ALLOWED_ORIGINS deben venir
# explicitos por variable de entorno — nunca dejarlos abiertos con "*".
