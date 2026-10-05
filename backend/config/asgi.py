"""
Punto de entrada ASGI. En el MVP el servidor de producción (Render) usa
WSGI con gunicorn (ver config/wsgi.py). Cuando se implemente el chat en
tiempo real (app `messaging`), aquí se conectará Django Channels.
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

application = get_asgi_application()
