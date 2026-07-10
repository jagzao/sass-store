# STRY-028 — Generador de Contenido Social con n8n + Ollama

## Descripción General

Dar funcionalidad real al generador de contenido de redes sociales en sass-store. Se desacopla la generación de texto de la API interna (`/api/v1/social/generate` que usa Anthropic Claude) hacia un workflow n8n que usa Ollama local y persiste los borradores en la base de datos. Los posts generados inician como `draft`, el administrador del tenant los edita y aprueba (pasa a `scheduled`), y el workflow publicador diario los publica a las 08:00 AM en la red social correspondiente.

## Alcance

Ambas pantallas sociales quedan operativas:

- `/t/[tenant]/social` → vista **Generar** del tenant.
- `/admin/social-planner` → generación global para cualquier tenant.

Todas las plataformas soportadas: Facebook, Instagram, LinkedIn, X, TikTok, Google Business, Threads.

## Actores

| Actor | Rol |
|---|---|
| **Admin del negocio** | Usuario del tenant que configura campaña, genera borradores, edita y aprueba publicaciones. |
| **Super Admin** | Administra generación desde `/admin/social-planner` para cualquier tenant. |
| **Workflow n8n de generación** | Recibe parámetros, invoca Ollama, parsea JSON, crea `social_posts` y `social_post_targets` como `draft`. |
| **Workflow n8n publicador diario** | Reusa `n8n/social-daily-publisher.workflow.json` ajustado a 08:00 AM; publica targets `scheduled` del día. |

## Variables de Entorno Requeridas (n8n)

```env
# Ollama local
OLLAMA_API_URL=http://127.0.0.1:11434/v1/chat/completions
OLLAMA_MODEL=llama3.2

# sass-store DB
DATABASE_URL=postgresql://... (ya configurada en n8n para el publisher)

# Imagen por defecto para publicaciones sin asset
DEFAULT_SOCIAL_IMAGE_URL=https://res.cloudinary.com/.../default-social.jpg
```

## Flujos Principales

### Flujo 1 — Generar contenido desde el tenant

```
Admin entra a /t/[tenant]/social → pestaña Generar
        ↓
Configura plataformas, objetivo, tono/vibe, fechas, frecuencia, mix, contexto
        ↓
Presiona "Generar contenido"
        ↓
App envía POST a http://localhost:5678/webhook/social-generate
        ↓
[n8n] Construye prompt con contexto del tenant
        ↓
[n8n] Llama a Ollama local
        ↓
[n8n] Parsea JSON, inserta borradores en social_posts + social_post_targets
        ↓
[n8n] Responde resumen (ids, fechas, plataformas, cantidad)
        ↓
App muestra previsualización
        ↓
Admin edita título/texto/plataformas o presiona "Guardar en Calendario y Cola"
        ↓
Estado cambia a scheduled con fecha programada
```

### Flujo 2 — Generar contenido desde admin global

```
Super Admin entra a /admin/social-planner
        ↓
Selecciona tenant y configura campaña
        ↓
Envía webhook con tenantSlug explícito
        ↓
n8n crea borradores bajo ese tenant_id
        ↓
Super Admin/Admin del tenant aprueba desde la UI del tenant
```

### Flujo 3 — Publicación diaria

```
Schedule Trigger a las 08:00 AM
        ↓
n8n consulta tenants con canales habilitados y credenciales activas
        ↓
Recupera social_post_targets con status = 'scheduled' y fecha = hoy
        ↓
Publica en Facebook/Instagram/LinkedIn/X/TikTok/GBP/Threads según plataforma
        ↓
Marca target como published con platform_post_id
        ↓
Sincroniza status del post padre
```

## Reglas de Negocio

1. El workflow n8n de generación solo crea posts para plataformas habilitadas en `tenant_channels.enabled = true`.
2. Cada post padre (`social_posts`) puede tener múltiples targets (`social_post_targets`) — uno por plataforma seleccionada.
3. Los posts generados por IA inician en estado `draft`.
4. El administrador del tenant debe editar y aprobar cada publicación antes de que pase a `scheduled`.
5. La publicación real la realiza el workflow n8n programado a las 08:00 AM en la timezone del tenant.
6. Si no hay contenido programado para hoy, el workflow publicador puede crear un post genérico automático (comportamiento existente).
7. El mix de contenido debe sumar 100%; la UI lo valida antes de enviar.
8. Las variantes de texto respetan límites de caracteres por plataforma.
9. Las fechas de publicación se distribuyen uniformemente dentro del rango configurado.
10. No se generan imágenes automáticamente; el admin adjunta assets manualmente.

## Criterios de Aceptación — Gherkin

```gherkin
Feature: Generación de contenido social con n8n

  Scenario: Admin del tenant genera borradores con Ollama
    Given el admin está en "/t/wondernails/social" pestaña "Generar"
    And wondernails tiene Facebook e Instagram habilitados
    And selecciona objetivo "Ventas", tono "Profesional"
    And define rango de fechas del 1 al 31 de agosto
    And configura frecuencia 2 posts, 1 reel, 2 stories por semana
    And la mezcla de contenido suma 100%
    When presiona "Generar contenido"
    Then el workflow n8n "social-generate" recibe los parámetros
    And Ollama responde con JSON válido
    And la base de datos contiene borradores en social_posts con status "draft"
    And cada borrador tiene al menos un social_post_target para Facebook o Instagram
    And la previsualización muestra las publicaciones generadas

  Scenario: Super Admin genera contenido desde admin social-planner
    Given el super admin está en "/admin/social-planner"
    When selecciona tenant "centro-tenistico" y genera contenido
    Then los posts se guardan bajo tenant_id de centro-tenistico
    And aparecen en el calendario del tenant

  Scenario: Mix de contenido inválido bloquea generación
    Given la mezcla de contenido suma 90%
    When el usuario presiona "Generar"
    Then el botón permanece deshabilitado
    And se muestra mensaje "El total debe sumar 100%"

  Scenario: n8n no disponible muestra error amigable
    Given el workflow n8n no responde
    When el usuario intenta generar
    Then se muestra mensaje "Servicio de generación no disponible. Intenta más tarde."

  Scenario: Admin edita y aprueba un borrador
    Given existe un post "draft" generado por IA
    And el admin abre el editor del post
    When cambia el texto y presiona "Guardar en Calendario"
    Then el post cambia a status "scheduled"
    And los targets quedan programados para la fecha elegida

  Scenario: Workflow publicador publica a las 08:00 AM
    Given hay un target "scheduled" de wondernails para hoy a las 08:00 AM
    When el workflow n8n diario corre a las 08:00 AM
    Then publica en la plataforma correspondiente
    And marca el target como "published"
    And guarda el platform_post_id

  Scenario: Tenant sin canales habilitados no genera contenido
    Given el tenant "manada-juma" no tiene canales sociales conectados
    When el admin intenta generar contenido
    Then se muestra mensaje "Conecta al menos una cuenta de redes sociales"
    And no se crean posts en la base de datos
```

## Casos Borde

```gherkin
  Scenario: Ollama responde JSON malformado
    Given Ollama devuelve texto sin formato JSON
    When el workflow n8n intenta parsear
    Then responde error sin crear posts parciales
    And el usuario ve "No se pudo generar contenido. Intenta de nuevo."

  Scenario: Rango de fechas menor a 1 día
    Given el admin selecciona mismo día como inicio y fin
    When presiona "Generar"
    Then se muestra error de validación

  Scenario: Frecuencia total cero
    Given posts, reels y stories por semana son todos 0
    When presiona "Generar"
    Then se generan 0 publicaciones
    And se muestra mensaje informativo

  Scenario: Publicación fallida marca target como failed
    Given un target scheduled para hoy
    And la API de Facebook devuelve error de permisos
    When el workflow publicador intenta publicar
    Then el target cambia a status "failed"
    And se registra el mensaje de error
```

## Restricciones de Negocio Adicionales

- El prompt a Ollama debe incluir contexto del tenant (`tenants.name`, `tenants.description`, productos/servicios destacados si existen) para personalizar el contenido.
- El JSON devuelto por Ollama debe contener campos: `title`, `content`, `platforms`, `format`, `suggestedTime`, `contentType`.
- Las variantes por plataforma se generan dentro del mismo workflow; el `variant_text` de cada target se adapta al límite de caracteres y tono de la plataforma.
- El horario de publicación responde a sugerencia del LLM (`morning` → 09:00, `afternoon` → 14:00, `evening` → 19:00) dentro del día asignado.
- No se modifica el workflow publicador existente salvo ajustar el cron de 03:00 a 08:00 AM.

## Estructura de Archivos

```
n8n/
├── social-daily-publisher.workflow.json          # ajustar cron a 08:00 AM
├── smart-publish.workflow.json                    # referencia Ollama existente
└── workflows/
    └── STRY-028-social-content-generator.json      # nuevo workflow webhook + Ollama + DB

apps/web/
├── app/api/v1/social/generate/route.ts           # modificar: llamar a n8n webhook en lugar de Anthropic
├── components/social/views/GenerateView.tsx      # ajustes menores de payload/respuesta
└── components/social-planner/post-composer.tsx   # soporte generación global si aplica

packages/database/
└── schema.ts                                       # no cambios; tablas sociales ya existen
```

## Stage

- [x] spec — 2026-07-10
- [ ] test-spec
- [ ] implementation
- [ ] quality-runner
- [ ] PR
