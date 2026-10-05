# Despliegue: Supabase + Render + Vercel

Esta guía la sigue **una sola vez el líder técnico**. El resto del equipo no necesita cuentas en estos servicios: trabajan en local, y su código llega a producción cuando se une a `main`.

```
GitHub (rama main) ──► Render  (backend)  ──► Supabase (PostgreSQL + Storage)
                  └──► Vercel  (frontend) ──► llama a la API en Render
```

**Orden:** 1. Supabase → 2. Render → 3. Vercel → 4. Volver a Render para conectar CORS.

Abre un bloc de notas privado (no un archivo del repo) para ir anotando las claves que copies.

> ⚠️ Ninguna de estas claves se escribe en el código ni en GitHub. Solo van en los paneles de cada servicio.

---

## 1. Supabase (base de datos y archivos)

### 1.1 Crear el proyecto

1. https://supabase.com/dashboard → **New project**.
2. Nombre: `practiya`. Región: la más cercana disponible (por ejemplo `East US` o `South America (São Paulo)`).
3. **Database Password:** genera una contraseña fuerte y **guárdala**. La necesitas en el paso 1.2 y no se puede volver a ver.

### 1.2 Cadena de conexión a la base de datos

1. En el proyecto, pulsa **Connect** (arriba).
2. Elige **Session pooler**. No elijas *Direct connection*: solo funciona por IPv6 y Render usa IPv4.
3. Copia la cadena. Se ve así:

   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

4. Reemplaza `[YOUR-PASSWORD]` por la contraseña del paso 1.1. Esta cadena es tu **`DATABASE_URL`**.

> Si la contraseña tiene caracteres como `@`, `#`, `/` o `:`, cámbiala por una solo con letras y números, o se rompe la URL.

### 1.3 Bucket para hojas de vida y logos

1. Menú **Storage** → **New bucket**.
2. Nombre: `practiya`. **Deja "Public bucket" apagado.** Las hojas de vida son datos personales: Django las entrega con enlaces firmados que vencen en una hora.

### 1.4 Claves S3 de Storage

1. **Project Settings → Storage → S3 Connection.**
2. Copia el **Endpoint** y la **Region**.
3. En **S3 Access Keys** → **New access key** → copia el **Access Key ID** y el **Secret Access Key** (este último solo se muestra una vez).

> Estas claves dan acceso total a todos los archivos. Solo se ponen en Render, nunca en el frontend ni en Vercel.

Anotado hasta aquí: `DATABASE_URL`, `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_REGION`, `SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`.

---

## 2. Render (backend Django)

El archivo `render.yaml` de la raíz del repo ya describe el servicio, así que Render lo configura casi solo.

1. https://dashboard.render.com → **New → Blueprint**.
2. Conecta tu cuenta de GitHub y elige el repositorio `Proyecto-Practica-Empresarial`.
3. Render lee `render.yaml` y muestra el servicio **practiya-api**. Te pide los valores marcados como secretos:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | La cadena del paso 1.2 |
   | `CORS_ALLOWED_ORIGINS` | Pon `http://localhost:3000` por ahora. Se cambia en el paso 4. |
   | `CORS_ALLOWED_ORIGIN_REGEXES` | Déjala vacía por ahora |
   | `SUPABASE_S3_ENDPOINT` | Paso 1.4 |
   | `SUPABASE_S3_REGION` | Paso 1.4 |
   | `SUPABASE_S3_ACCESS_KEY_ID` | Paso 1.4 |
   | `SUPABASE_S3_SECRET_ACCESS_KEY` | Paso 1.4 |
   | `DJANGO_SUPERUSER_EMAIL` | Tu correo (será el admin) |
   | `DJANGO_SUPERUSER_USERNAME` | `admin` |
   | `DJANGO_SUPERUSER_PASSWORD` | Una contraseña fuerte para entrar a `/admin` |

   `SECRET_KEY` se genera sola.

4. **Apply**. El primer despliegue tarda unos minutos. En **Logs** debes ver `Applying accounts.0001_initial... OK` y al final `Your service is live`.
5. Copia la URL del servicio, algo como `https://practiya-api.onrender.com`.
6. Prueba: abre `https://practiya-api.onrender.com/admin/` y entra con el correo y la contraseña del superusuario.

**Despliegue automático:** cada vez que algo se une a `main`, Render vuelve a desplegar. Si el build falla, sigue en línea la versión anterior.

> **Plan gratuito:** el servicio se "duerme" tras unos 15 minutos sin visitas y la primera petición después tarda cerca de un minuto en responder. Antes de una demostración, abre la URL un rato antes.

---

## 3. Vercel (frontend Next.js)

1. https://vercel.com/new → **Import** el repositorio `Proyecto-Practica-Empresarial`.
2. **Root Directory:** pulsa **Edit** y elige `frontend`. Esto es importante, porque el repo tiene dos proyectos.
3. Framework: **Next.js** (lo detecta solo).
4. **Environment Variables:**

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://practiya-api.onrender.com/api` (tu URL del paso 2.5 + `/api`) |

5. **Deploy**. Copia la URL final, por ejemplo `https://practiya.vercel.app`.

**Despliegue automático:**
- Lo que se une a `main` → producción.
- Cada Pull Request → una **vista previa** con su propia URL. Vercel la publica como comentario en el PR, así el revisor puede probar sin instalar nada.

---

## 4. Conectar frontend y backend (CORS)

Por seguridad, la API solo acepta peticiones de los dominios que le indiques.

En Render → **practiya-api** → **Environment**:

| Variable | Valor |
|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://practiya.vercel.app,http://localhost:3000` (tu URL de Vercel) |
| `CORS_ALLOWED_ORIGIN_REGEXES` | `^https://practiya-[a-z0-9-]+\.vercel\.app$` (cambia `practiya` por el nombre de tu proyecto en Vercel) |

Guarda. Render redespliega solo.

---

## 5. Prueba de humo

1. Abre tu URL de Vercel + `/register` y crea una cuenta de estudiante.
2. Debes quedar con sesión iniciada.
3. En Supabase → **Table Editor** → tabla `accounts_user`: debe aparecer el registro.
4. En `/admin` de Render también lo ves.

Si el navegador muestra un error de **CORS** en la consola (F12), revisa el paso 4.

---

## 6. Proteger las ramas en GitHub

En el repositorio → **Settings → Branches → Add branch ruleset** (o *Add classic branch protection rule*), una regla para `main` y otra para `develop`:

- ✅ **Require a pull request before merging** → *Required approvals: 1*
- ✅ **Require status checks to pass** → elegir **Backend** y **Frontend** (aparecen después de la primera ejecución de la CI)
- ✅ **Block force pushes**
- ✅ **Restrict deletions**

Y en **Settings → General → Pull Requests** deja activado solo **Allow squash merging** y marca **Automatically delete head branches**.

### Invitar al equipo

**Settings → Collaborators → Add people** → el usuario de GitHub de cada compañero. Cada uno debe aceptar la invitación del correo.

---

## 7. Variables de entorno — resumen

| Variable | Dónde | Secreta |
|---|---|---|
| `DATABASE_URL` | Render | Sí |
| `SECRET_KEY` | Render (automática) | Sí |
| `SUPABASE_S3_*` | Render | Sí |
| `DJANGO_SUPERUSER_*` | Render | Sí |
| `CORS_ALLOWED_ORIGINS` / `_REGEXES` | Render | No |
| `NEXT_PUBLIC_API_URL` | Vercel | No (es pública) |

Si una clave secreta se filtra (por ejemplo, se subió a GitHub por error): cámbiala en el servicio de origen (Supabase o Render) **y** actualízala en Render.
