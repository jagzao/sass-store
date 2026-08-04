# STRY-033 — Generador de Contenido Social Multi-Tenant (workflows n8n reales)

## Descripción General

Los workflows n8n en producción `03 - LinkedIn Generator` y `07 - LinkedIn Publisher` (los que realmente publican en LinkedIn hoy, distintos del stack `/api/v1/social/generate` + STRY-028) están hardcodeados a un único tenant (`1c04c4de-3e8c-4f6d-a1dd-d1b92bf4d335`, zo-system) y a una única credencial LinkedIn compartida en n8n. Esta STRY los convierte en procesos genéricos multi-tenant: cualquier tenant con el canal LinkedIn habilitado y configurado obtiene generación mensual de contenido y publicación automática, usando su propio branding (`tenant_channels.policy`, editable desde la pantalla Socials del admin) y su propio token OAuth2 (`social/tokens`). Incluye el renombrado de ambos workflows para reflejar que dejan de ser de un solo tenant/marca.

**Nota de relación con STRY-028**: STRY-028 describe una arquitectura distinta (webhook `/social-generate` + Ollama + aprobación manual draft→scheduled) que no es la que corre en producción. Esta STRY-033 documenta y evoluciona el sistema real (`03`/`07`, cron mensual, auto-aprobación). No se tocan los artefactos de STRY-028.

## Alcance

- Workflow n8n `03 - LinkedIn Generator` (id `5oaNrXIEIUAI2GGU`) → renombrado a `Content Generator (Multi-tenant, Mensual)`.
- Workflow n8n `07 - LinkedIn Publisher` (id `h6aFaBxAUewJthNq`) → renombrado a `Social Publisher (Multi-tenant, cada 15 min)`.
- Pantalla Socials del admin (`/t/[tenant]/admin` → social-planner): nuevo formulario para editar `tenant_channels.policy` (brand voice, pilares, tono, CTAs) por tenant.
- Fuera de alcance: agregar plataformas nuevas, cambiar el modelo de aprobación (sigue auto-aprobado), tocar STRY-028.

## Actores

| Actor | Rol |
|---|---|
| **Tenant** | Negocio de la plataforma con canal LinkedIn habilitado. |
| **Admin del tenant** | Configura brand voice/pilares/tono en la pantalla Socials del admin. |
| **Content Generator (Multi-tenant)** | Workflow n8n, corre el día 1 de cada mes, genera contenido para todos los tenants elegibles. |
| **Social Publisher (Multi-tenant)** | Workflow n8n, corre cada 15 min, publica posts due de todos los tenants elegibles. |
| **LinkedIn API** | Destino de publicación. |
| **Administrador global** | Recibe el email de resumen (digest) y las notificaciones de publicación. |

## Flujos Principales

### Flujo 1 — Generación mensual (Content Generator)

```
Trigger día 1 de cada mes
        ↓
Query tenant_channels WHERE channel='linkedin' AND enabled=true (todos los tenants elegibles)
        ↓
Por cada tenant (continúa si uno falla):
  Lee policy (brand voice, pilares, tono) desde tenant_channels.policy
        ↓
  Calcula slots de publicación del mes según posting_window del tenant
        ↓
  Por cada slot: arma SYSTEM prompt desde policy del tenant + llama LLM
        ↓
  Parsea respuesta → INSERT social_posts (draft, tenant_id) + social_post_targets (approved, tenant_id)
        ↓
  Genera imagen de marca (infographic server) con branding del tenant
        ↓
Al terminar todos los tenants → un único email digest al admin global
```

### Flujo 2 — Publicación (Social Publisher, cada 15 min)

```
Trigger cada 15 min
        ↓
Query social_post_targets JOIN social_posts WHERE platform='linkedin' AND status='approved'
  AND publish_at_utc <= now() → toma el post due más antiguo POR CADA TENANT
        ↓
Por cada post due (uno por tenant, continúa si uno falla):
  Re-verifica tenant_channels.enabled=true
        ↓
  Marca status='publishing'
        ↓
  Resuelve token OAuth2 LinkedIn del tenant desde social/tokens (no credencial n8n compartida)
        ↓
  GET /v2/userinfo con el token del tenant → author URN
        ↓
  Genera imagen de marca con branding del tenant
        ↓
  Sube imagen a LinkedIn + publica POST /rest/posts con el author URN del tenant
        ↓
  Marca published (+ platform_post_id, external_ref) o failed (+ motivo)
```

### Flujo 3 — Configuración de brand voice (Socials admin)

```
Admin del tenant entra a /t/[tenant]/admin → Socials
        ↓
Edita brand voice, pilares, tono, CTAs prohibidos
        ↓
Guarda → persiste en tenant_channels.policy (JSON)
        ↓
Próxima corrida mensual del Generator usa este policy
```

## Reglas de Negocio

1. Elegibilidad = `tenant_channels.channel='linkedin' AND enabled=true`.
2. Si `policy` está vacío, el tenant se omite en la generación (sin fallback genérico) y queda registrado en el digest.
3. Aprobación de targets sigue siendo automática (`status='approved'` al insertarse) — sin revisión manual.
4. El branding textual (prompt) y visual (colores de imagen) se derivan del `policy` del tenant — reemplaza el hardcode "Zo System / Juan German Zambrano".
5. Aislamiento de fallos: un tenant con error nunca detiene el procesamiento de los demás en la misma corrida (generación o publicación).
6. Sin límite de tenants procesados por corrida.
7. El Publisher re-verifica `enabled=true` en el momento de publicar, no solo al generarse.
8. Un tenant sin token OAuth2 válido no publica ni queda `failed` permanente — reintenta en próximos ticks.

## Criterios de Aceptación — Gherkin

```gherkin
Feature: Generador y publicador de contenido social multi-tenant

  Scenario: SC-01 Generación produce contenido distinto por tenant
    Given "zo-system" y "wondernails" tienen tenant_channels.channel="linkedin" enabled=true
    And ambos tienen policy configurado con brand voice distinto
    When corre el Content Generator el día 1 del mes
    Then se generan social_posts para "zo-system" con su brand voice
    And se generan social_posts para "wondernails" con su brand voice
    And el contenido de un tenant no aparece en el otro

  Scenario: SC-02 Tenant sin policy se omite sin bloquear a los demás
    Given "wondernails" tiene channel="linkedin" enabled=true sin policy configurado
    And "zo-system" tiene policy configurado
    When corre el Content Generator
    Then no se generan posts para "wondernails"
    And "wondernails" aparece en el digest como "sin configurar"
    And sí se generan posts para "zo-system"

  Scenario: SC-03 Publisher publica a múltiples tenants en el mismo tick
    Given "zo-system" y "wondernails" tienen un target "approved" con publish_at_utc vencido
    When corre el tick del Social Publisher
    Then ambos targets se publican en LinkedIn en la misma corrida
    And cada uno usa el token OAuth2 y el author URN de su propio tenant

  Scenario: SC-04 Tenant sin token OAuth2 válido no publica y reintenta
    Given "wondernails" tiene un target "approved" vencido sin token OAuth2 configurado
    When corre el tick del Social Publisher
    Then el target de "wondernails" permanece "approved" (no "failed")
    And se reintenta en el siguiente tick

  Scenario: SC-05 Fallo de un tenant no bloquea a los demás
    Given "wondernails" tiene un token OAuth2 inválido/expirado
    And "zo-system" tiene un target válido listo para publicar
    When corre el tick del Social Publisher
    Then el target de "zo-system" se publica correctamente
    And el fallo de "wondernails" se registra sin detener la corrida

  Scenario: SC-06 Admin configura brand voice desde la pantalla Socials
    Given el admin de "wondernails" está en "/t/wondernails/admin" pestaña Socials
    When edita brand voice, pilares, tono y CTAs y guarda
    Then tenant_channels.policy de "wondernails" queda actualizado
    And la próxima corrida del Generator usa ese policy

  Scenario: SC-07 Workflows renombrados en n8n
    Given los workflows "03" y "07" existen en n8n
    When se aplica esta STRY
    Then el workflow generador se llama "Content Generator (Multi-tenant, Mensual)"
    And el workflow publicador se llama "Social Publisher (Multi-tenant, cada 15 min)"
```

## Casos Borde

```gherkin
  Scenario: EC-01 Tenant habilita el canal a mitad de mes
    Given "wondernails" habilita channel="linkedin" el día 15 del mes
    When corre el Content Generator (día 1 del siguiente ciclo)
    Then no se genera contenido retroactivo para el mes en curso
    And "wondernails" entra en la corrida del siguiente mes

  Scenario: EC-02 Dos tenants con el mismo publish_at_utc
    Given "zo-system" y "wondernails" tienen targets "approved" con el mismo publish_at_utc vencido
    When corre el tick del Social Publisher
    Then ambos se publican en el mismo tick

  Scenario: EC-03 Tenant deshabilita el canal con post approved pendiente
    Given "wondernails" tiene un target "approved" pendiente
    And el admin deshabilita tenant_channels.enabled a false
    When corre el tick del Social Publisher
    Then el target de "wondernails" NO se publica

  Scenario: EC-04 Token expira entre generación y publicación
    Given un target "approved" de "wondernails" con token válido al generarse
    And el token expira antes del tick de publicación
    When corre el Social Publisher
    Then el post falla en el paso de auth
    And reintenta en próximos ticks sin bloquear a otros tenants

  Scenario: EC-05 Policy editado a mitad de mes no afecta posts ya generados
    Given "wondernails" tiene posts "draft"/"approved" ya generados este mes
    When el admin edita tenant_channels.policy
    Then los posts existentes no cambian
    And el nuevo policy solo aplica a la siguiente corrida mensual

  Scenario: EC-06 Alto volumen de tenants due en el mismo tick
    Given 20+ tenants tienen targets "approved" vencidos simultáneamente
    When corre el tick del Social Publisher
    Then todos se procesan en la misma ejecución
    And ninguno se trunca ni se omite por volumen
```

## Restricciones de Negocio Adicionales

- Tras cualquier edición vía API n8n de un workflow activo, se debe forzar `deactivate` + `activate` explícito para recargar el Schedule Trigger (bug ya encontrado y corregido una vez en este mismo sistema).
- Reutilizar la tabla de tokens ya existente del módulo social-planner (`apps/web/app/api/v1/social/tokens/route.ts`, `channelAccounts.externalRef`) en vez de credenciales n8n fijas por workflow.
- El campo `policy` de `tenant_channels` es JSON; su estructura debe soportar al menos: brand voice, audiencia, pilares de contenido, tono, CTAs prohibidos.

## Estructura de Archivos

```
n8n/ (edición vía n8n Public API, no archivos locales versionados)
├── 03 - LinkedIn Generator → Content Generator (Multi-tenant, Mensual)   [id 5oaNrXIEIUAI2GGU]
└── 07 - LinkedIn Publisher → Social Publisher (Multi-tenant, cada 15 min) [id h6aFaBxAUewJthNq]

apps/web/
└── components/social/  → nueva UI de policy en pantalla Socials del admin del tenant

packages/database/
└── schema.ts  → sin cambios de estructura (tenant_channels.policy ya existe como columna)
```

## Stage

- [x] spec — 2026-08-04
- [ ] test-spec
- [ ] implementation
- [ ] quality-runner
- [ ] PR
