# Inbox móvil / remoto — US y cambios sin depender del PC

Objetivo: que puedas **escribir** peticiones desde el **celular** (o cualquier lugar), que el agente en Cursor **las lea al iniciar sesión** o cuando digas **“procesa inbox”**, y que las **respuestas** queden en el repo (mismo inbox o PR) para leerlas desde el móvil con notificaciones de Git.

## Cómo escribir desde el celular

1. **GitHub (recomendado)**
   - App GitHub → repo `sass-store` → **Add file** / editar `docs/stories/inbox/QUEUE.md` en la rama de trabajo (feature o `main` según política).
   - **Commit** → recibís push/email de GitHub en el teléfono.
   - Cuando abras Cursor (PC o app si aplica): _“Procesá `docs/stories/inbox/QUEUE.md`”_ o _“Implementa lo del inbox”_.

2. **GitHub Issues (alternativa)**
   - Crear issue con etiqueta `inbox` o título `[INBOX] …`.
   - El agente puede leer el issue si pegás el enlace o si sincronizás el cuerpo a `QUEUE.md` (manual o script más adelante).

3. **No hace falta Cursor en el móvil** para **dejar** la petición: solo hace falta **git + GitHub** (o cliente Git móvil).

## Archivo de cola

- **`QUEUE.md`** — entradas abiertas y recientes; ver instrucciones al inicio de ese archivo.

## Qué puede hacer el agente (realista)

| Puede                                                      | No puede (sin infra extra)                       |
| ---------------------------------------------------------- | ------------------------------------------------ |
| Leer `QUEUE.md` cuando ejecutes un prompt en Cursor        | “Ver” el archivo al instante mientras dormís     |
| Crear/actualizar US, `plan.md`, código, tests              | Push a tu celular sin pasar por Git/notificación |
| Dejar **respuesta** en `QUEUE.md` (sección Salida) o en PR | Ejecutar builds en tu teléfono                   |

## Notificaciones en el teléfono

- **Git** (commit del agente o tuyo) → GitHub te notifica si tenés alertas activadas.
- Opcional: **ntfy.sh**, **Telegram bot**, o **Slack incoming webhook** (documentar en `.agents/protocols/mobile-remote-async.md` si los configurás).

## Frases útiles en Cursor (cuando tengas sesión)

- `Procesá docs/stories/inbox/QUEUE.md`
- `Leé el inbox, creá o actualizá la US y el sprint según STRY-XXX`
- `¿Hay bloqueos en el inbox? Resumí y preguntame solo lo indispensable`

Protocolo detallado: **`.agents/protocols/mobile-remote-async.md`**.
