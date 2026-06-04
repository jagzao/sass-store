/**
 * MessageRouter — entry point del WA platform
 *
 * Recibe el payload del webhook de Meta, identifica el tenant,
 * clasifica el intent y despacha al n8n handler correspondiente.
 * Debe retornar en < 3 segundos para no hacer timeout en Meta.
 */
export { MessageRouter } from "./message-router";
export { IntentClassifier } from "./classifier";
export { TenantResolver } from "./tenant-resolver";
export { N8nDispatcher } from "./dispatcher";
