# STRY-018 — Testing de Usuario (QA Playwright CLI)

## Credenciales de prueba

- **Email:** `jagzao@gmail.com`
- **Password:** `admin`

## Entorno de prueba

- **Servidor:** `npm run dev` en port 3003
- **Base URL:** `http://localhost:3003`
- **Reuse server:** `E2E_REUSE_SERVER=1`

## Health endpoint

| Escenario    | Método | URL           | Esperado                     | Resultado |
| ------------ | ------ | ------------- | ---------------------------- | --------- |
| Health check | GET    | `/api/health` | 200 + status ok + DB latency | ✅ Pass   |

## Inventario E2E por feature

| Feature         | Specs    | Tests estimados | Estado                           |
| --------------- | -------- | --------------- | -------------------------------- |
| auth            | 7 files  | ~20             | 🔄 Pendiente subset              |
| booking         | 2 files  | ~10             | 🔄 Pendiente subset              |
| cart/checkout   | 1 file   | ~5              | 🔄 Pendiente subset              |
| customers       | 2 files  | ~10             | 🔄 Pendiente subset              |
| finance         | 11 files | ~55             | 🔄 Pendiente subset              |
| pos             | 4 files  | ~20             | 🔄 Pendiente subset              |
| tenants/landing | 2 files  | ~8              | 🔄 Pendiente subset              |
| admin           | 1 file   | ~5              | 🔄 Pendiente subset              |
| deep-audit      | 1 file   | 9               | ✅ 9/9 pass (de STRY-020)        |
| full-admin-nav  | 1 file   | 28              | ✅ 28/28 pass (de sesión previa) |

## Comandos de validación

```bash
# Health endpoint
node -e "fetch('http://localhost:3003/api/health').then(r=>r.json()).then(j=>console.log(j))"

# Subsets por feature (usar dev server en 3003)
BASE_URL=http://localhost:3003 E2E_REUSE_SERVER=1 npx playwright test --grep "auth"
BASE_URL=http://localhost:3003 E2E_REUSE_SERVER=1 npx playwright test --grep "booking"
BASE_URL=http://localhost:3003 E2E_REUSE_SERVER=1 npx playwright test --grep "pos"
```

---

**Actualizado:** 2026-05-13
