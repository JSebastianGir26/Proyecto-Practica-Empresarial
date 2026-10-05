# Cómo trabajamos con Git y GitHub

Guía para el equipo de PractiYA. Está pensada para personas que nunca han trabajado con Git en equipo: si sigues los pasos en orden, no vas a romper nada.

---

## 1. Las 6 reglas de oro

1. **Nunca trabajes directo en `main` ni en `develop`.** Siempre en tu propia rama.
2. **Una rama por historia de usuario** (o por tarea). Ramas pequeñas, que vivan pocos días.
3. **Antes de empezar a trabajar cada día, trae los cambios de los demás** (`git pull`).
4. **Nada entra a `develop` sin un Pull Request** revisado por al menos un compañero, y con las pruebas automáticas en verde.
5. **Nunca subas contraseñas ni archivos `.env`.** El repositorio es público.
6. **Si algo sale raro, para y pregunta** antes de usar comandos con `--force`, `reset --hard` o de borrar carpetas.

---

## 2. Conceptos en 2 minutos

| Palabra | Qué es |
|---|---|
| **Repositorio (repo)** | La carpeta del proyecto con todo su historial de cambios. Hay una copia en GitHub (*remota*) y una en tu computador (*local*). |
| **Commit** | Una "foto" de tus cambios con un mensaje que explica qué hiciste. |
| **Rama (branch)** | Una línea de trabajo paralela. Puedes cambiar cosas en tu rama sin afectar a nadie. |
| **Push** | Subir tus commits de tu computador a GitHub. |
| **Pull** | Bajar a tu computador los commits que otros subieron. |
| **Pull Request (PR)** | Una solicitud en GitHub para unir tu rama a `develop`. Ahí tus compañeros revisan tu código. |
| **Merge** | Unir una rama con otra. |
| **Conflicto** | Cuando dos personas cambiaron las mismas líneas de un archivo y Git no sabe cuál dejar. Se resuelve a mano (ver sección 7). |

---

## 3. Nuestras ramas

```
main      ●─────────────────────────●──────────────►   versión publicada (Vercel + Render)
           \                       / (al final de cada sprint)
develop     ●────●────────●───────●────────────────►   integración del equipo
                  \      / \     /
feature/HU-01-...  ●──●─●   \   /
                             \ /
feature/HU-02-...             ●─●
```

| Rama | Para qué | Quién escribe ahí |
|---|---|---|
| `main` | Lo que está publicado. Cada cambio aquí se despliega solo en Vercel y Render. | Solo el líder técnico, con un PR desde `develop` al final de cada sprint. |
| `develop` | Donde se junta el trabajo de todos. | Nadie directamente: solo entra por Pull Request. |
| `feature/HU-XX-descripcion` | Tu trabajo en una historia. | Tú (y tu pareja si trabajan juntos). |
| `fix/descripcion` | Corregir un error. | Quien lo corrige. |

**Nombres de ramas:** en minúsculas, sin tildes ni espacios, con guiones.

- ✅ `feature/HU-04-editar-perfil`
- ✅ `fix/login-mensaje-error`
- ❌ `Mi Rama`, `cambios`, `juan`, `feature/HU-04 editar perfíl`

---

## 4. Configuración inicial (una sola vez)

### 4.1 Dile a Git quién eres

Usa el **mismo correo de tu cuenta de GitHub**:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@ejemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase false
```

En Windows, agrega también esto para evitar problemas con los saltos de línea:

```bash
git config --global core.autocrlf true
```

### 4.2 Acepta la invitación al repositorio

El líder técnico te invita como colaborador. Te llega un correo de GitHub: dale **Accept invitation**. Sin esto no puedes subir cambios.

### 4.3 Clona el proyecto

```bash
git clone https://github.com/JSebastianGir26/Proyecto-Practica-Empresarial.git PractiYA
cd PractiYA
git switch develop
```

La primera vez que hagas `push`, Git abre el navegador para que inicies sesión en GitHub. Acepta y listo.

Luego sigue la sección 3 del [README](README.md) para instalar el backend y el frontend.

---

## 5. El flujo de cada historia, paso a paso

Ejemplo: te asignaron **HU-04 · Editar mi perfil**.

### Paso 1 — Ponte al día con `develop`

```bash
git switch develop
git pull
```

### Paso 2 — Crea tu rama

```bash
git switch -c feature/HU-04-editar-perfil
```

`-c` significa "crear". Ahora todo lo que hagas queda en tu rama.

### Paso 3 — Programa y guarda commits pequeños

Cada vez que completes algo que funciona (no al final del día con todo junto):

```bash
git status                    # ¿qué archivos cambié?
git add .                     # preparo todos los cambios
git commit -m "feat(HU-04): agrega modelo StudentProfile"
```

> Revisa siempre `git status` antes de `git add .`. Si ves un `.env`, `node_modules` o `db.sqlite3`, **no hagas commit** y avisa: algo está mal en el `.gitignore`.

### Paso 4 — Sube tu rama a GitHub

La primera vez:

```bash
git push -u origin feature/HU-04-editar-perfil
```

Las siguientes veces basta con:

```bash
git push
```

Sube tu rama **al menos una vez al día**, aunque no esté terminada: así no pierdes trabajo si se daña tu computador.

### Paso 5 — Antes de pedir revisión, trae lo último de `develop`

Mientras trabajabas, tus compañeros unieron otras cosas. Tráelas a tu rama:

```bash
git switch develop
git pull
git switch feature/HU-04-editar-perfil
git merge develop
```

Si sale un conflicto, ve a la sección 7. Luego corre las pruebas (README, sección 3.5) y sube:

```bash
git push
```

### Paso 6 — Abre el Pull Request

1. Entra al repositorio en GitHub. Verás un aviso amarillo con tu rama y el botón **Compare & pull request**.
2. Revisa que diga **base: `develop`** ← **compare: `feature/HU-04-editar-perfil`**. ⚠️ No `main`.
3. Título: `HU-04 · Editar mi perfil`.
4. Llena la plantilla que aparece (qué hiciste, cómo probarlo, capturas).
5. En **Reviewers** elige a un compañero.
6. **Create pull request**.

### Paso 7 — Revisión

- Las pruebas automáticas corren solas. Debe aparecer ✅ verde.
- Tu revisor deja comentarios. Corrige en tu misma rama, haz commit y `git push`: el PR se actualiza solo.
- Cuando el revisor da **Approve** y todo está en verde, **quien abrió el PR** pulsa **Squash and merge**.
- Después del merge, pulsa **Delete branch** en GitHub.

### Paso 8 — Limpia tu computador

```bash
git switch develop
git pull
git branch -d feature/HU-04-editar-perfil
```

Y vuelves al paso 1 con la siguiente historia.

---

## 6. Mensajes de commit

Formato: `tipo(HU-XX): qué hiciste`, en español, en presente y en minúscula.

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| `feat` | Algo nuevo | `feat(HU-15): agrega endpoint para publicar vacante` |
| `fix` | Corregir un error | `fix(HU-02): muestra error cuando la contraseña es incorrecta` |
| `test` | Pruebas | `test(HU-01): cubre registro sin aceptar términos` |
| `docs` | Documentación | `docs: actualiza tabla de endpoints` |
| `style` | Formato, sin cambiar lógica | `style: aplica black al backend` |
| `refactor` | Reorganizar código sin cambiar qué hace | `refactor(HU-06): separa filtros en su propio archivo` |
| `chore` | Configuración, dependencias | `chore: agrega django-storages` |

❌ Evita: `cambios`, `arreglos`, `avance`, `asdf`, `ya funciona`.

---

## 7. Cómo resolver un conflicto (sin pánico)

Un conflicto **no es un error tuyo**: solo significa que tú y otra persona tocaron las mismas líneas.

Después de `git merge develop` verás algo como:

```
CONFLICT (content): Merge conflict in frontend/src/lib/api.ts
```

1. Abre el archivo en VS Code. Verás bloques así:

   ```
   <<<<<<< HEAD
   tu versión
   =======
   la versión de develop
   >>>>>>> develop
   ```

2. VS Code muestra botones encima: **Accept Current** (la tuya), **Accept Incoming** (la de develop) o **Accept Both**. Elige, o edita a mano para dejar lo correcto de ambas.
3. Verifica que no quede ninguna línea con `<<<<<<<`, `=======` o `>>>>>>>`.
4. Termina el merge:

   ```bash
   git add .
   git commit -m "merge: resuelve conflicto con develop"
   git push
   ```

Si no entiendes qué versión dejar, **pregúntale a quien escribió el otro código**. Si quieres cancelar todo y volver a como estabas antes del merge: `git merge --abort`.

**Conflictos con migraciones de Django:** si dos personas crearon una migración en la misma app, avisa en el grupo antes de resolver. Normalmente se borra la tuya, se hace `git merge develop` y se vuelve a correr `python manage.py makemigrations`.

---

## 8. Situaciones comunes

**"Hice cambios en `develop` sin querer (no he hecho commit)"**

```bash
git switch -c feature/HU-XX-nombre    # tus cambios se van contigo a la rama nueva
```

**"Hice commit en `develop` sin querer (no he hecho push)"**
Pide ayuda al líder técnico antes de intentar arreglarlo.

**"Quiero descartar los cambios de un archivo y dejarlo como estaba"**

```bash
git restore ruta/del/archivo
```

**"Git dice `rejected` al hacer push"**
Alguien subió cambios a tu rama. Haz `git pull` y luego `git push`.

**"Subí un `.env` o una contraseña por error"**
Avisa **de inmediato** al líder técnico. Borrar el archivo no basta: la contraseña queda en el historial y hay que cambiarla en Supabase, Render o Vercel.

**"Instalé una librería nueva"**
- Backend: agrégala a `backend/requirements.txt` con su versión exacta.
- Frontend: `npm install nombre` ya actualiza `package.json` y `package-lock.json`; sube ambos.
- Avísalo en la descripción del PR para que los demás corran `pip install -r requirements.txt` o `npm install`.

---

## 9. Usar Git desde VS Code (sin terminal)

El ícono de ramas de la barra izquierda (**Source Control**, `Ctrl+Shift+G`) permite hacer casi todo con clics:

- **Ver cambios:** la lista de archivos modificados. Clic en uno para ver qué cambió.
- **Commit:** escribe el mensaje arriba y pulsa **Commit** (el `+` junto a cada archivo equivale a `git add`).
- **Push / Pull:** botón **Sync Changes**, o el ícono de flechas en la barra de abajo.
- **Cambiar o crear rama:** clic en el nombre de la rama en la esquina inferior izquierda.

Recomendado: la extensión **GitHub Pull Requests** para revisar PRs dentro de VS Code.

---

## 10. Revisar el PR de un compañero

Cuando te piden revisión:

- [ ] ¿Hace lo que pide la historia? Compara con los escenarios Gherkin del backlog.
- [ ] ¿Las pruebas automáticas están en verde?
- [ ] Bájalo y pruébalo: `git fetch` y luego `git switch feature/HU-XX-...`.
- [ ] ¿Se entiende el código? ¿Hay nombres raros o código comentado que sobra?
- [ ] ¿Hay algún secreto, `print` de depuración o `console.log` olvidado?

Comenta con respeto y en concreto: *"¿Qué pasa si el correo viene vacío?"* en vez de *"esto está mal"*. Cuando esté bien, **Review changes → Approve**.

---

## 11. Chuleta de comandos

```bash
git status                         # ¿qué cambió?
git switch develop                 # ir a develop
git pull                           # traer lo último
git switch -c feature/HU-XX-algo   # crear rama nueva
git add .                          # preparar cambios
git commit -m "feat(HU-XX): ..."   # guardar foto
git push -u origin <rama>          # primera subida de la rama
git push                           # siguientes subidas
git merge develop                  # traer develop a mi rama
git log --oneline --graph -15      # ver historial
git branch                         # ver mis ramas
git merge --abort                  # cancelar un merge con conflictos
```
