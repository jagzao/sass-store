# STRY-031 — Sistema de feedback, usabilidad y problemas para mejora del producto

Capturar opiniones de usabilidad, reportes de problemas y datos de contexto de los
usuarios de sass-store para mejorar el producto. Enrutar la información a n8n vía webhook
seguro para que dispare acciones automáticas o espere revisión humana.

## Motivación

Necesitamos entender qué problemas tienen los usuarios, qué opinan del sistema y usar esos
datos para mejorarlo. También capturar problemas técnicos con contexto para resolverlos con
mayor eficiencia. Todo debe estar disponible para un proceso n8n que procese los datos y
realice acciones automáticas o de feedback humano.

## Alcance

- Widget de feedback en la app web.
- Captura de opiniones, sugerencias y problemas.
- Contexto mínimo: tenant, ruta, usuario, timestamp, user-agent.
- Envío a n8n vía webhook.
- Fallback local si n8n falla.
- Vista admin para consultar feedback por tenant.
- Rate limiting básico.

## Fuera de alcance (MVP)

- Adjuntos o capturas de pantalla.
- Encuestas o NPS.
- Acciones automáticas implementadas en sass-store (n8n las decide).

## Spec

Ver especificación funcional completa en:
`.agents/sprint/STRY-031-user-feedback-n8n-pipeline/plan.md`
