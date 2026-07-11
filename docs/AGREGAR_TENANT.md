# Agregar un Tenant Nuevo

Checklist completo para dar de alta un tenant en sass-store.

---

## 1. Base de datos

### 1.1 Insertar el tenant

```sql
INSERT INTO tenants (slug, name, description, mode, status, timezone, branding, contact, location, quotas)
VALUES (
  'mi-tenant',                          -- slug (usar en URL: /t/mi-tenant)
  'Mi Tenant',                          -- name
  'Descripción del negocio',            -- description
  'booking',                            -- mode: 'booking' | 'catalog'
  'active',                             -- status
  'America/Mexico_City',                -- timezone
  '{"primaryColor":"#FF4F8B","secondaryColor":"#333333","logo":null,"theme":"light"}'::jsonb,
  '{"phone":"+529990000000","email":"contacto@mitenant.com"}'::jsonb,
  '{"address":"Calle 123, Ciudad"}'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
```

### 1.2 Asignar rol de admin

```sql
INSERT INTO user_roles (user_id, tenant_id, role)
SELECT u.id, t.id, 'Admin'
FROM users u CROSS JOIN tenants t
WHERE u.email = 'jagzao@gmail.com' AND t.slug = 'mi-tenant'
ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'Admin';
```

> **Script disponible:** `node scripts/fix-zo-system-role.js` — adaptar el slug para otros tenants.

---

## 2. Assets estáticos

### 2.1 Logo

Crear el directorio y colocar el logo:

```
apps/web/public/tenants/mi-tenant/logo/
└── logo.svg          (banner 200x60, opcional)
```

### 2.2 Íconos PWA (PNG)

**Importante:** Chrome/Edge requieren PNG 192x192 y 512x512 para mostrar el prompt de instalación. SVG no sirve.

**Opción A — Script automático (recomendado):**

1. Editar `scripts/generate-pwa-icons.js`
2. Agregar entrada al array `TENANTS`:

```javascript
{ slug: "mi-tenant", bg: "#FF4F8B", fg: "#ffffff", label: "MT", name: "Mi Tenant" },
```

3. Ejecutar:

```bash
node scripts/generate-pwa-icons.js
```

Genera automáticamente: `icon-192.png`, `icon-512.png`, `icon-192-maskable.png`, `icon-512-maskable.png`, `apple-touch-icon.png` (180x180), `icon-32.png`, `icon-16.png`.

**Opción B — Manual:**

Colocar PNGs en `apps/web/public/tenants/mi-tenant/logo/`:

| Archivo | Tamaño | Propósito |
|---------|--------|-----------|
| `icon-192.png` | 192x192 | Manifest (any) |
| `icon-512.png` | 512x512 | Manifest (any) |
| `icon-192-maskable.png` | 192x192 | Manifest (maskable, safe zone 20%) |
| `icon-512-maskable.png` | 512x512 | Manifest (maskable, safe zone 20%) |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `icon-32.png` | 32x32 | Favicon |
| `icon-16.png` | 16x16 | Favicon |

---

## 3. PWA — Sin pasos adicionales

El manifest (`apps/web/lib/pwa/manifest-service.ts`) lee el tenant de la DB dinámicamente y construye los iconos automáticamente desde la ruta `/tenants/{slug}/logo/`. No hay que editar código.

Verificar que el manifest funciona:

```bash
curl http://localhost:3003/t/mi-tenant/manifest.webmanifest | jq .icons
```

Debe devolver 4 iconos PNG con `type: "image/png"`.

---

## 4. Seed data

### 4.1 Productos y servicios

El seed de datos puede hacerse desde el panel de admin del tenant o via API:

```bash
# Crear producto
curl -X POST http://localhost:3003/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"tenant":"mi-tenant","name":"Producto 1","price":"100","sku":"SKU-001","category":"general"}'
```

### 4.2 Conexiones sociales (opcional)

Si el tenant usa redes sociales, conectar tokens desde la UI:

- Ir a `/t/mi-tenant/social`
- Click en "Cuentas"
- Ingresar access tokens de Facebook/Instagram

---

## 5. n8n (si usa automatización)

Los workflows de n8n (`n8n/workflows/`) funcionan para todos los tenants automáticamente. Solo necesitan:

1. Canales habilitados en `tenant_channels` (`enabled = true`)
2. Credenciales activas en `channel_credentials`
3. Workflow publicador activo en n8n (`n8n/social-daily-publisher.workflow.json`)

---

## 6. Verificación

Checklist post-creación:

- [ ] `GET /t/mi-tenant` responde 200
- [ ] `GET /t/mi-tenant/manifest.webmanifest` responde 200 con 4 iconos PNG
- [ ] Login con `jagzao@gmail.com` / `admin` redirige al dashboard
- [ ] Páginas auth (admin, social, finance, clientes) cargan sin 404
- [ ] Ícono visible en pestaña del navegador (favicon)
- [ ] `beforeinstallprompt` se dispara en Chrome (botón "Instalar App")
- [ ] Seed de productos/servicios realizado

---

## 7. Tenants activos actuales

| Slug | Nombre | Modo | Brand color |
|------|--------|------|-------------|
| `wondernails` | Wonder Nails Studio | booking | `#FF4F8B` |
| `centro-tenistico` | Centro Deportivo | booking | `#059669` |
| `zo-system` | Zo System | catalog | `#FF8000` |
| `manada-juma` | Manada Juma | booking | `#1b4332` |
| `delirios` | Delirios | catalog | `#7c3aed` |
| `nom-nom` | Nom Nom | catalog | `#f59e0b` |
| `vigistudio` | VigiStudio | catalog | `#1e40af` |
