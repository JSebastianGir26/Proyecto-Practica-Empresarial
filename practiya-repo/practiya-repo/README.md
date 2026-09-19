# PractiYA

Red que conecta estudiantes en etapa de práctica (universidades públicas, privadas y SENA) con empresas que buscan a quién formar mediante contratos de aprendizaje.

Este repositorio es un **monorepo**: contiene el backend y el frontend en un mismo lugar, versionados juntos, para que cualquier desarrollador clone un solo repositorio y tenga todo lo necesario.

---

## 1. Arquitectura

PractiYA usa una arquitectura **desacoplada**: el frontend y el backend son aplicaciones independientes que se comunican por HTTP (API REST) y WebSockets (chat en tiempo real). No comparten proceso ni servidor.

```
                    HTTPS (REST API)
   ┌─────────────┐  ───────────────►  ┌──────────────────┐        ┌──────────────┐
   │   Frontend   │                    │      Backend      │        │  PostgreSQL  │
   │   Next.js    │  ◄───────────────  │  Django + DRF     │ ─────► │  (datos)     │
   │  (TypeScript)│     JSON            │  (Python)         │        └──────────────┘
   └─────────────┘                    └──────────────────┘
          │                                     │
          │        WebSocket (chat)             │
          └────────────────────────────────────►│
                                                  ▼
                                          ┌──────────────┐
                                          │    Redis      │
                                          │ (Channels /   │
                                          │  tiempo real) │
                                          └──────────────┘
```

**Por qué esta arquitectura:**
- **Frontend (Next.js)** — capa de presentación. Consume la API, nunca habla directo con la base de datos.
- **Backend (Django + Django REST Framework)** — toda la lógica de negocio, autenticación, permisos por rol y acceso a datos vive aquí, expuesta como API REST. Django Admin sirve como backoffice interno (revisar empresas, moderar vacantes) sin construir nada aparte.
- **PostgreSQL** — única fuente de verdad de los datos. El dominio es muy relacional (estudiantes, empresas, vacantes, postulaciones, mensajes), por lo que Postgres + el ORM de Django encajan naturalmente.
- **Redis + Django Channels** — habilita WebSockets para la pantalla "Mensajes" (chat en tiempo real entre estudiante y reclutador) sin bloquear el resto de la API, que sigue siendo HTTP normal.

Cada usuario tiene un **rol** (`ESTUDIANTE`, `EMPRESA` o `ADMIN`) definido desde el registro (HU-01). El backend valida permisos según ese rol en cada endpoint; el frontend usa el mismo rol para decidir qué pantallas mostrar.

---

## 2. Estructura de carpetas

```
practiya/
├── backend/                   # API Django (Python)
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/                # Configuración del proyecto Django
│   │   ├── settings/
│   │   │   ├── base.py        # Configuración compartida
│   │   │   ├── development.py # Configuración local de cada dev
│   │   │   └── production.py  # Configuración del servidor
│   │   ├── urls.py            # Enrutamiento raíz (/api/...)
│   │   ├── asgi.py            # Necesario para Channels (WebSockets)
│   │   └── wsgi.py
│   └── apps/                  # Una app Django por Epica del backlog
│       ├── accounts/          # Epic 1 - Cuenta y acceso   (EN DESARROLLO)
│       ├── students/          # Epic 2 - Perfil del estudiante
│       ├── jobs/              # Epic 3 - Vacantes
│       ├── applications/      # Epic 3 - Seguimiento de postulaciones
│       ├── community/         # Epic 4 - Feed y comunidades
│       ├── companies/         # Epic 5 - Empresa
│       ├── messaging/         # Chat en tiempo real
│       ├── notifications/     # Epic 6 - Notificaciones
│       └── moderation/        # Epic 7 - Moderación
│
├── frontend/                   # App Next.js (TypeScript)
│   ├── package.json
│   ├── .env.local.example
│   └── src/
│       ├── app/                # Rutas (Next.js App Router)
│       │   ├── (auth)/         # login, register        (EN DESARROLLO)
│       │   ├── (estudiante)/   # inicio, buscar, postulaciones, mensajes...
│       │   └── (empresa)/      # panel, vacantes, postulantes
│       ├── components/         # Componentes UI reutilizables
│       ├── lib/                # api.ts (cliente HTTP), auth.ts (sesión)
│       ├── hooks/
│       └── types/
│
├── docs/
│   ├── backlog/                # Backlog completo + asignación del sprint actual
│   └── diseno/                 # Auditoría UX/UI del mockup
│
├── .gitignore
└── README.md                   # Este archivo
```

**Cada carpeta bajo `backend/apps/` corresponde a una Épica del backlog** (ver `docs/backlog/PRACTIYA_BACKLOG.xlsx`). Las apps que aún no se han tomado en un sprint solo tienen un `README.md` y un `models.py` vacío explicando qué historias van ahí — así el equipo siempre sabe dónde va cada cosa, aunque todavía no exista código.

---

## 3. Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Django 5 + Django REST Framework |
| Base de datos | PostgreSQL 16 |
| Tiempo real | Django Channels + Redis (para el chat) |
| Autenticación | JWT (`djangorestframework-simplejwt`) |
| Publicación (planeado) | Vercel (frontend) + Railway/Render (backend + Postgres + Redis) |

---

## 4. Cómo levantar el proyecto en local

### Requisitos previos
Python 3.12, Node.js 20+, PostgreSQL 16, Redis (o Memurai en Windows), Git.

> Si tu máquina es Windows, puedes usar el instalador que automatiza todo esto — pregúntale a tu líder técnico por `PractiYA-Setup.exe`.

### 4.1 Clonar el repositorio

```bash
git clone <url-del-repositorio> practiya
cd practiya
```

### 4.2 Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # En Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env             # Ajusta DATABASE_URL, REDIS_URL, etc.

python manage.py migrate
python manage.py createsuperuser # Para entrar al Django Admin
python manage.py runserver
```

El backend queda corriendo en `http://localhost:8000`. La API vive bajo `http://localhost:8000/api/...` y el admin en `http://localhost:8000/admin/`.

### 4.3 Frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local # Ajusta NEXT_PUBLIC_API_URL si es necesario
npm run dev
```

El frontend queda en `http://localhost:3000`.

### 4.4 Variables de entorno

**Nunca subas `.env` ni `.env.local` a git** — están en `.gitignore` a propósito. Cada desarrollador copia los `.example` y ajusta sus propios valores locales (contraseña de su Postgres, etc.).

---

## 5. Convención de ramas y commits

- `main` — código estable, siempre desplegable.
- `develop` — integración de las features en curso.
- `feature/HU-XX-nombre-corto` — una rama por historia de usuario, creada desde `develop`. Ejemplo: `feature/HU-01-registro`, `feature/HU-02-login`.

Al terminar una historia: Pull Request de `feature/HU-XX-...` hacia `develop`, referenciando el número de HU en la descripción del PR.

---

## 6. Documentación del proyecto

- **`docs/backlog/PRACTIYA_BACKLOG.xlsx`** — backlog completo: épicas, historias de usuario y criterios de aceptación (formato Gherkin).
- **`docs/backlog/PRACTIYA_BACKLOG_Sprint1.xlsx`** — asignación de tareas del sprint en curso (Epic 1 · Cuenta y acceso).
- **`docs/diseno/PractiYA_instrucciones_de_mejora.md`** — auditoría UX/UI del mockup, con las mejoras pendientes antes de construir cada pantalla.

Antes de tomar una historia nueva, revisa su criterio de aceptación en el backlog — cada HU trae sus escenarios Gherkin, que son la base de las pruebas de esa funcionalidad.

---

## 7. Estado actual (Sprint 1)

En desarrollo: **Epic 1 — Cuenta y acceso** (`apps/accounts` en backend, `app/(auth)` en frontend).

- HU-01 · Crear cuenta
- HU-02 · Iniciar sesión

El resto de épicas están planificadas pero sin código aún — ver `docs/backlog/` para el detalle completo y el orden sugerido de los próximos sprints.
