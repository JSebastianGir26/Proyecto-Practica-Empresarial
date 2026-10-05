# PractiYA — Instrucciones de mejora del mockup

Basado en la auditoría UX/UI de las 10 pantallas (PractiYA_-_Red_v2.pptx). Cada punto indica la pantalla afectada, el problema y la acción concreta a ejecutar.

---

## 🔴 Prioridad 1 — Bugs de implementación

### 1. Encabezados de tabla cortados
**Dónde:** Pantalla 08 · Vista empresa (slide10)
**Problema:** Los headers de la tabla "Pasantías publicadas" se cortan: "PUEST", "MODALIDAI", "POSTULANTE", "ESTADC" en vez de "Puesto", "Modalidad", "Postulantes", "Estado".
**Acción:**
- Reducir el `letter-spacing`/tracking de los headers en mayúscula (probar con 0.5px en vez del valor actual).
- Ampliar el ancho mínimo de cada columna o activar `white-space: nowrap` con overflow visible solo en el header.
- Verificar el mismo componente de tabla en cualquier otra pantalla que lo reutilice.

### 2. Truncado de texto sin elipsis
**Dónde:** Pantalla 06 · Mensajes (slide8), lista de conversaciones a la izquierda
**Problema:** Las vistas previas se cortan a media palabra ("...revisamo", "...te ma", "...catorias n") sin indicador de truncado.
**Acción:**
- Aplicar `text-overflow: ellipsis; white-space: nowrap; overflow: hidden;` al contenedor del mensaje previo.
- Confirmar que el corte nunca ocurra a mitad de palabra — el CSS estándar ya resuelve esto, solo falta aplicarlo.

### 3. Color de marca inconsistente (avatar de empresa)
**Dónde:** Comparar Pantalla 03 · Detalle de la vacante (slide5, avatar "TN" azul claro) vs. Pantalla 08 · Vista empresa (slide10, avatar "TN" magenta)
**Problema:** El mismo logo de TechNova cambia de color entre pantallas.
**Acción:**
- Definir un color de marca fijo por empresa (probablemente derivado de un campo `brand_color` en el modelo de datos) y usarlo en todas las superficies: feed, buscador, detalle de vacante, mensajes, vista de empresa.
- Auditar el resto de avatares de empresa en el resto de pantallas para confirmar que ninguno más varía.

---

## 🟠 Prioridad 2 — Vacíos de flujo

### 4. Falta la barra de navegación principal
**Dónde:** Ninguna pantalla la incluye; se menciona conceptualmente en slide2 ("Cinco destinos": Inicio, Buscar, Aplicaciones, Mensajes, Avisos)
**Acción:**
- Añadir una pantalla nueva (o incluir el componente en las pantallas existentes) que muestre la barra de navegación inferior con sus 5 destinos, estado activo/inactivo, y badges de notificación si aplica.
- Decidir y documentar si "Aplicaciones" = la pantalla "Seguimiento" ya diseñada, y si "Avisos" es una pantalla nueva no incluida aún — si es así, priorizar su diseño antes de pasar a desarrollo.

### 5. Selector de rol (estudiante/empresa) no existe dentro del producto
**Dónde:** Solo aparece como control del prototipo en la portada (slide1)
**Acción:**
- Diseñar el punto de entrada real: normalmente un menú de cuenta o switch accesible desde el perfil/avatar en la barra superior.
- Mostrar cómo cambia la barra de navegación al cambiar de rol (mencionado en slide2, punto 04, pero nunca ilustrado).

### 6. Estado "Miembro" sin affordance de botón
**Dónde:** Pantalla 07 · Comunidades (slide9)
**Problema:** "Miembro" es texto plano sin tratamiento visual, se confunde con un enlace roto.
**Acción:**
- Darle el mismo tamaño/posición que "Unirme" pero con estilo de estado confirmado: fondo tenue (ej. teal 50) + ícono de check + texto "Miembro".
- Si se puede salir del grupo, considerar un menú contextual (⋯) en vez de que el botón cambie de función sin aviso.

---

## 🟡 Prioridad 3 — Consistencia visual

### 7. Reducir a un acento de color primario
**Dónde:** Todas las pantallas
**Problema:** Compiten tres acentos: teal (compatibilidad/navegación), magenta (marca/algunos avatares), azul claro (fondos destacados).
**Acción:**
- Fijar **teal** como único color de acción/interacción (botones, links, %, estados activos).
- Reservar **magenta** exclusivamente para elementos de marca (logo, y como mucho un detalle puntual — no avatares ni timeline).
- El azul claro de fondo puede quedarse como tinte neutro para tarjetas destacadas, pero no debe competir con el teal como color de acción.

### 8. Etiqueta "PANTALLA 0X" es solo del prototipo
**Dónde:** Todas las pantallas de producto (slide3 a slide10)
**Acción:**
- Documentar explícitamente en el archivo (ej. nota en el primer slide o en un README adjunto) que este kicker es una convención de presentación y no debe pasar a desarrollo.

### 9. Auditar escala tipográfica de títulos de sección
**Dónde:** Comparar "Sobre mí" (slide6) vs. "Descripción" (slide5)
**Acción:**
- Definir una escala fija de encabezados de sección (ej. 20px/500) y aplicarla sin variaciones en todas las pantallas: Descripción, Requisitos, Tu contacto en la empresa, Sobre mí, Habilidades, Insignias y certificados, Pasantías publicadas, Postulantes destacados.

---

## ✅ Qué mantener sin cambios
- El **% de compatibilidad** como elemento recurrente en feed, búsqueda, detalle y vista de empresa.
- El **timeline de Seguimiento** con color de progreso.
- La estructura de la **vista de empresa** (métricas arriba, tabla + ranking abajo).

---

## Orden sugerido de ejecución
1. Corregir los 3 bugs de Prioridad 1 (rápidos, alto impacto en credibilidad del mockup).
2. Diseñar la barra de navegación y el selector de rol (Prioridad 2) — son necesarios para validar el flujo completo antes de pasar a desarrollo.
3. Aplicar la limpieza de color y tipografía (Prioridad 3) en una pasada final sobre las 10 pantallas.
