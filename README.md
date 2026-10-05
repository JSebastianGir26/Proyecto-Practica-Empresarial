# PractiYA

Red que conecta estudiantes en etapa de práctica (universidades públicas, privadas y SENA) con empresas que buscan a quién formar mediante contratos de aprendizaje.

Este repositorio es un **monorepo**: el backend y el frontend viven juntos para que cualquier desarrollador clone un solo repositorio y tenga todo.

> **¿Eres nuevo en el equipo?** Lee en este orden:
> 1. Este README → instala y corre el proyecto en tu computador.
> 2. [`CONTRIBUTING.md`](CONTRIBUTING.md) → cómo trabajamos con Git y GitHub (paso a paso, para principiantes).
> 3. [`docs/MVP.md`](docs/MVP.md) → qué vamos a construir y en qué orden.

---

## 1. Stack tecnológico

| Capa | Tecnología | Dónde vive en producción |
|---|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS | **Vercel** |
| Backend (API) | Django 5 + Django REST Framework | **Render** |
| Base de datos | PostgreSQL | **Supabase** |
| Archivos (hojas de vida, logos) | Supabase Storage | **Supabase** |
| Autenticación | JWT con `djangorestframework-simplejwt` | (dentro de Django) |
| Panel de administración | Django Admin | Render (`/admin`) |

```
   Navegador
       │
       ▼
┌──────────────┐   HTTPS + JSON    ┌──────────────────┐        ┌───────────────────────┐
│   Frontend   │ ────────────────► │     Backend      │ ─────► │       Supabase        │
│   Next.js    │                   │  Django + DRF    │        │  PostgreSQL + Storage │
│   (Vercel)   │ ◄──────────────── │    (Render)      │        └───────────────────────┘
└──────────────┘                   └──────────────────┘
```

**Reglas de la arquitectura:**
- El frontend **nunca** habla directo con la base de datos ni con Supabase. Todo pasa por la API de Django.
- Toda la lógica de negocio, los permisos por rol y las validaciones viven en el backend. El frontend también valida, pero solo para dar mensajes rápidos al usuario.
- Cada usuario tiene un **rol** (`ESTUDIANTE`, `EMPRESA` o `ADMIN`) definido al registrarse (HU-01). El backend revisa ese rol en cada endpoint.

> El chat en tiempo real (Django Channels + Redis) quedó **fuera del MVP**. Ver [`docs/MVP.md`](docs/MVP.md).

---

## 2. Estructura de carpetas

```
.
├── backend/                  # API Django (Python)
│   ├── manage.py
│   ├── requirements.txt      # Librerías de Python
│   ├── .env.example          # Plantilla de variables de entorno
│   ├── build.sh              # Lo que ejecuta Render al desplegar
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py         # Configuración compartida
│   │   │   ├── development.py  # Tu computador
│   │   │   └── production.py   # Render
│   │   └── urls.py           # Rutas raíz: /api/... y /admin/
│   └── apps/                 # Una app de Django por épica del backlog
│       ├── accounts/         # Epic 1 · Cuenta y acceso
│       ├── students/         # Epic 2 · Perfil del estudiante
│       ├── jobs/             # Epic 3 · Vacantes
│       ├── applications/     # Epic 3 · Postulaciones
│       ├── companies/        # Epic 5 · Empresa
│       ├── moderation/       # Epic 7 · Moderación
│       ├── community/        # Epic 4 · Comunidad        (fuera del MVP)
│       ├── messaging/        # Chat                      (fuera del MVP)
│       └── notifications/    # Epic 6 · Notificaciones   (fuera del MVP)
│
├── frontend/                 # App Next.js (TypeScript)
│   ├── package.json
│   ├── .env.local.example
│   └── src/
│       ├── app/              # Pantallas (cada carpeta = una URL)
│       │   ├── (auth)/       # /login, /register
│       │   ├── (estudiante)/ # /inicio, /buscar, /postulaciones, /perfil ...
│       │   └── (empresa)/    # /panel, /vacantes, /postulantes
│       ├── lib/              # api.ts (llamadas a la API), auth.ts (sesión)
│       └── types/            # Tipos de TypeScript compartidos
│
├── docs/
│   ├── MVP.md                # Alcance del MVP y plan de sprints
│   ├── DESPLIEGUE.md         # Supabase + Render + Vercel paso a paso
│   ├── backlog/              # Historias de usuario con criterios Gherkin
│   └── diseno/               # Auditoría UX/UI del mockup
│
├── .github/                  # Plantilla de Pull Request y pruebas automáticas
├── render.yaml               # Configuración del backend en Render
├── CONTRIBUTING.md           # Guía de Git y GitHub del equipo
└── README.md
```

Cada carpeta de `backend/apps/` corresponde a una épica del backlog. Las que aún no se han tomado solo tienen un `README.md` que explica qué historias van ahí.

---

## 3. Instalar y correr el proyecto en tu computador

### 3.1 Programas que necesitas (una sola vez)

| Programa | Versión | Descarga |
|---|---|---|
| Git | la más reciente | https://git-scm.com/downloads |
| Python | **3.12** | https://www.python.org/downloads/ (en Windows marca **"Add python.exe to PATH"**) |
| Node.js | **22 LTS** (mínimo 20.9) | https://nodejs.org |
| VS Code | la más reciente | https://code.visualstudio.com |

Verifica en una terminal:

```bash
git --version
python --version     # en Mac/Linux puede ser: python3 --version
node --version
```

> **No necesitas instalar PostgreSQL.** En tu computador el backend usa SQLite, un archivo de base de datos que se crea solo. Producción sí usa PostgreSQL en Supabase.

### 3.2 Clonar el repositorio

```bash
git clone https://github.com/JSebastianGir26/Proyecto-Practica-Empresarial.git PractiYA
cd PractiYA
git switch develop
```

Abre la carpeta `PractiYA` en VS Code (**File → Open Folder**). Si aparece el aviso de *Restricted Mode*, dale **Trust**.

### 3.3 Backend (terminal 1)

```bash
cd backend
python -m venv .venv
```

Activa el entorno virtual:

| Sistema | Comando |
|---|---|
| Windows (PowerShell) | `.venv\Scripts\Activate.ps1` |
| Windows (CMD) | `.venv\Scripts\activate.bat` |
| Mac / Linux | `source .venv/bin/activate` |

> Si PowerShell dice que *la ejecución de scripts está deshabilitada*, corre una vez:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y responde `S`.

Verás `(.venv)` al inicio de la línea. Luego:

```bash
pip install -r requirements.txt
copy .env.example .env           # Mac/Linux: cp .env.example .env
python manage.py migrate
python manage.py createsuperuser # te pide correo, usuario y contraseña
python manage.py runserver
```

- API: http://localhost:8000/api/
- Panel de administración: http://localhost:8000/admin/

### 3.4 Frontend (terminal 2)

Abre otra terminal en VS Code (**Terminal → New Terminal**):

```bash
cd frontend
npm install
copy .env.local.example .env.local   # Mac/Linux: cp .env.local.example .env.local
npm run dev
```

Abre http://localhost:3000/register, crea una cuenta y luego entra en http://localhost:3000/login.

### 3.5 Antes de abrir un Pull Request

```bash
# Backend (con el .venv activado, dentro de backend/)
pytest
flake8

# Frontend (dentro de frontend/)
npm run lint
npm run build
```

GitHub corre estas mismas pruebas automáticamente en cada Pull Request (ver `.github/workflows/ci.yml`). Si fallan, el PR no se puede unir.

---

## 4. Variables de entorno

**Nunca subas `.env` ni `.env.local` a GitHub** — este repositorio es público y esos archivos tienen contraseñas. Ya están en `.gitignore`. Cada desarrollador copia los archivos `.example` y pone sus propios valores.

Las claves de Supabase, Render y Vercel de producción **solo** las maneja el líder técnico desde los paneles de cada servicio. Ver [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

---

## 5. Endpoints disponibles

| Método | URL | Historia | Quién puede usarlo |
|---|---|---|---|
| POST | `/api/auth/register/` | HU-01 Crear cuenta | Cualquiera |
| POST | `/api/auth/login/` | HU-02 Iniciar sesión | Cualquiera |
| POST | `/api/auth/token/refresh/` | Renovar sesión | Con sesión |

Esta tabla se actualiza en cada Pull Request que agregue un endpoint.

---

## 6. Documentación

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — flujo de Git y GitHub del equipo.
- [`docs/MVP.md`](docs/MVP.md) — alcance del MVP y plan de sprints.
- [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) — cómo se publica en Supabase, Render y Vercel.
- `docs/backlog/PRACTIYA_BACKLOG.xlsx` — todas las historias de usuario con sus criterios de aceptación en formato Gherkin.
- `docs/diseno/PractiYA_instrucciones_de_mejora.md` — mejoras de diseño a aplicar antes de construir cada pantalla.

Antes de tomar una historia, lee sus criterios de aceptación en el backlog: cada escenario Gherkin se convierte en una prueba.
