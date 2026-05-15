# Cola remota — `docs/stories/inbox/QUEUE.md`

> Editá este archivo desde **GitHub móvil** o PC. El agente lo procesa cuando lo invocás en Cursor (no hay polling mágico: abrís chat y pedís **“procesá inbox”** o **“leé QUEUE.md”**).

---

## Cómo agregar una entrada (copiar plantilla)

```markdown
### [OPEN] YYYY-MM-DD — Título corto

- **Tipo:** US | cambio | pregunta | publicar | continuar-plan
- **ID story (opcional):** STRY-017
- **Cuerpo:**  
  (Qué querés: narrativa, AC, URL, captura mental, “seguí el plan del sprint X”, etc.)
- **¿Bloquear hasta mi OK?:** no | sí (solo si necesitás que el agente **pare** antes de merge/publicar)
```

Después de procesar, el agente cambia `[OPEN]` → `[DONE]` o `[BLOCKED]` y escribe debajo **Respuesta agente:** …

---

## Entradas

### [OPEN] 2026-05-03 — Ejemplo (borrar al usar)

- **Tipo:** pregunta
- **ID story (opcional):** —
- **Cuerpo:** Esta es una plantilla de ejemplo; reemplazá con tu pedido real.
- **¿Bloquear hasta mi OK?:** no

**Respuesta agente:** _(el agente rellena tras procesar)_

---

## Salida / últimas respuestas (opcional)

El agente puede añadir un resumen aquí o solo en cada hilo `[DONE]` arriba.

---

## Reglas rápidas

1. **Un hilo por tema** (nuevo `### [OPEN]` por cada pedido).
2. **`continuar-plan`**: el agente retoma `.agents/sprint/{STRY}/plan.md` sin preguntar “¿sigo?” salvo decisión técnica irresoluble (`AGENTS.md` § 3).
3. **`publicar`**: el agente **no** deploya solo: deja checklist y recordatorio de visto bueno / pipeline (`AGENTS.md` § 1.2).
4. **`¿Bloquear hasta mi OK?: sí`**: el agente documenta el bloqueo y **no** mergea hasta que respondas en el mismo hilo o en chat.
