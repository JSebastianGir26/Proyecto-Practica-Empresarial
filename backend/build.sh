#!/usr/bin/env bash
# Script que Render ejecuta en cada despliegue (ver render.yaml).
# Si algo falla aqui, el despliegue se cancela y sigue en linea la
# version anterior — por eso es seguro.
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --no-input

# Crea el usuario administrador la primera vez, si definiste en Render
# DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_USERNAME y
# DJANGO_SUPERUSER_PASSWORD. Si ya existe, no hace nada.
if [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
  python manage.py createsuperuser --no-input || true
fi
