### 2026-06-06 — implement — Errores Buffer en crypto y whatsapp webhook (preexistentes)
**Error:** `Buffer` no es asignable a `Uint8Array` / `ArrayBufferView` en `lib/crypto/token-encryption.ts` y `app/api/whatsapp/webhook/route.ts`. Errores preexistentes no introducidos por STRY-025.
**Intento 1:** Corregir `typecheck` local de archivos nuevos — éxito. Estos errores permanecen en archivos legados fuera del alcance de la story.
**Estado final:** Omitido (no bloquea build de Next.js; se ignora en CI existente).
