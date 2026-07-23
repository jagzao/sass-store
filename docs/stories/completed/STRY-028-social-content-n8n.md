# STRY-028 — Generador de Contenido Social con n8n + Ollama

## Resumen

Hacer funcional la pantalla de Redes Sociales generando contenido real para Facebook, Instagram, LinkedIn, X, TikTok, Google Business y Threads usando un workflow n8n que invoca Ollama local. Los posts se crean como borradores para que el admin del tenant los apruebe antes de la publicación automática diaria a las 08:00 AM.

## Motivación

Actualmente la vista "Generar" de `/t/[tenant]/social` llama a `/api/v1/social/generate` que depende de Anthropic Claude (`ANTHROPIC_API_KEY`), lo cual es costoso y no está configurado en producción. El sistema ya tiene workflows n8n usando Ollama local (ver `n8n/smart-publish.workflow.json`) y un publicador diario para Facebook/Instagram (`n8n/social-daily-publisher.workflow.json`). Se aprovechan estos activos para dar funcionalidad real sin costos de LLM externos.

## Alcance

- `/t/[tenant]/social` pestaña Generar.
- `/admin/social-planner` generación para cualquier tenant.
- Todas las plataformas soportadas por el esquema: facebook, instagram, linkedin, x, tiktok, gbp, threads.

## Fuera de alcance

- Generación automática de imágenes o video.
- OAuth nuevo para obtener tokens; se reutiliza el guardado manual vía `TokenManagementModal`.
- Modificación profunda del workflow publicador; solo se ajusta su horario a 08:00 AM.

## Criterios de Aceptación de Alto Nivel

1. Un admin de tenant puede generar borradores de posts desde la UI.
2. Los borradores se guardan en `social_posts` y `social_post_targets` con status `draft`.
3. El admin puede editar y aprobar, pasando a `scheduled`.
4. A las 08:00 AM, n8n publica los `scheduled` de hoy en sus redes correspondientes.
5. Super Admin puede generar para cualquier tenant desde `/admin/social-planner`.

## Relacionado con

- `.agents/sprint/STRY-028-social-content-n8n/plan.md`
