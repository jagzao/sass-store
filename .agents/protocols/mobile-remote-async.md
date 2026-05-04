# Protocolo — Comunicación fluida / móvil / async con el agente

> Objetivo: poder **dejar** US o cambios **desde el celular** (vía Git/GitHub), que el **agente los ejecute** cuando haya una sesión Cursor (o automatización futura), y que el **reporte** vuelva al repo para leerlo en el móvil.

## Límites honestos

- El agente **no observa** el disco en tiempo real: hace falta **disparador** — abrir Cursor y un prompt, o CI futuro, o webhook.
- **Publicar a producción** sigue la política del equipo (visto bueno, merge, Vercel); el agente documenta y prepara, no reemplaza gates humanos salvo que lo configuréis explícitamente en CI.

## Flujo recomendado (mínimo viable)

```text
[Celular] Editás docs/stories/inbox/QUEUE.md → commit/push
     ↓
[Notificación] GitHub → tu teléfono (push/email)
     ↓
[Cuando puedas] Abrís Cursor → "Procesá inbox" o "Implementa lo de QUEUE.md línea X"
     ↓
[Agente] Lee QUEUE.md → crea/actualiza US + sprint → Dev → QA → escribe Respuesta en QUEUE.md o PR
     ↓
[Notificación] Nuevo commit / PR → leés en móvil → visto bueno / siguiente instrucción
```

## Rol del archivo `QUEUE.md`

| Sección     | Uso                                                                  |
| ----------- | -------------------------------------------------------------------- |
| `[OPEN]`    | Tu pedido pendiente                                                  |
| `[DONE]`    | Cerrado por el agente con **Respuesta agente**                       |
| `[BLOCKED]` | Falta dato, decisión técnica, o pediste `¿Bloquear hasta mi OK?: sí` |

Tipos soportados en plantilla: **US**, **cambio**, **pregunta**, **publicar**, **continuar-plan** (alineado a `AGENTS.md` § 3).

## Preguntas “¿continuo?” / publicar

- Por defecto el orquestador **no** pide continuar entre fases internas (`story-orchestrator.md`).
- Si en `QUEUE.md` ponés **`¿Bloquear hasta mi OK?: sí`**, el agente **para** antes de merge/publicar y deja la pregunta explícita en **Respuesta agente**.
- **`publicar`**: el agente deja checklist (build, PR, Vercel env) y **no** asume deploy sin tu confirmación en DoD.

## Opciones para notificar más fuerte (opcional)

1. **GitHub Actions** (cron o `workflow_dispatch`): por ejemplo comentar en el último issue si `QUEUE.md` tiene `[OPEN]` — requiere token y mantenimiento.
2. **ntfy.sh** / **Pushover** / **Telegram**: script o Action que POST al servicio cuando cambie `QUEUE.md` — no incluido en el repo por defecto.
3. **Cursor Background Agent / Cloud** (producto Cursor): si lo usás, podés disparar desde donde Cursor lo permita; revisar documentación actual de Cursor.

## Frases estándar para el usuario (Cursor)

- `Procesá docs/stories/inbox/QUEUE.md de arriba a abajo`
- `Tomá el primer [OPEN] del inbox, aplicá orquestador y actualizá la cola`
- `Solo informe: ¿hay [BLOCKED] en inbox?`

## Mantenimiento

- Archivar entradas `[DONE]` antiguas cada sprint (mover a `inbox/archive/YYYY-MM.md` si crece mucho).
