---
name: customer-service-chatbot
description: Customer service chatbot workflow for sass-store. Use when Codex must design, implement, debug, or improve automated customer support conversations, FAQs, escalation flows, and tenant-aware chat behavior in the application.
---

# Customer Service Chatbot

Use this skill for customer support chatbot work in sass-store, especially when the task involves tenant-specific answers, support escalation, booking or order context, FAQs, and user-facing chat UX.

## Workflow

1. Identify the tenant, support channel, user role, and conversation goal.
2. Map the supported intents, fallback behavior, and escalation path.
3. Keep customer-facing text concise, polite, and actionable.
4. Use Result Pattern services for new backend logic.
5. Preserve tenant isolation for all customer, booking, product, and order data.
6. Add tests for successful responses, unsupported intents, authorization failures, and escalation cases.

## Data And Security Rules

- Never expose data across tenants.
- Do not include secrets, tokens, or internal diagnostics in chatbot responses.
- Sanitize user-provided text before rendering it.
- Prefer structured intent and response objects over ad hoc string parsing.
- Store audit or analytics events through existing logging patterns when available.

## Validation

Run targeted checks for the files touched:

```bash
npm run lint
npm run typecheck
npm run test:unit -- --grep "chatbot"
```

For UI or end-to-end chat flows, also run a focused Playwright test:

```bash
npm run test:e2e:subset -- --grep "chatbot"
```
