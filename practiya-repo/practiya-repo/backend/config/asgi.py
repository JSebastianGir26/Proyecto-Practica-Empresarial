"""
ASGI + Channels. Necesario para las conexiones WebSocket del chat en
tiempo real ("Mensajes"). Mientras esa app no tenga consumers reales,
el WebSocketRouter queda vacio y el HTTP normal sigue funcionando igual.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
# from apps.messaging.routing import websocket_urlpatterns  # descomentar cuando exista

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # "websocket": URLRouter(websocket_urlpatterns),
})
