# n8n Workflow Setup: Daily Social Publisher (Facebook + Instagram)

## Goal
Build one workflow that:

1. Runs every day at 3:00 AM.
2. Reads active tenants with valid social credentials from DB.
3. Loads today scheduled posts for each tenant.
4. Publishes each target to Facebook or Instagram.
5. If tenant has no scheduled post, inserts one generic post and continues.
6. Updates DB target status to `published` or `failed`.
7. Retries publish operations 3 times.

---

## Workflow Name
`Daily Social Publisher (FB+IG)`

---

## Required n8n Credentials

1. PostgreSQL credential (same DB used by app)
2. Optional env var in n8n:
   - `DEFAULT_SOCIAL_IMAGE_URL` (required for Instagram fallback image)

---

## Node-by-node design

### 1) Schedule Trigger
- Type: Schedule Trigger
- Cron: `0 3 * * *`
- Timezone: `America/Mexico_City` (or your preferred timezone)

### 2) Postgres: Get Eligible Tenants
- Operation: Execute Query
- Query:

```sql
SELECT
  t.id AS tenant_id,
  t.slug,
  t.name,
  t.timezone,
  COALESCE(
    json_agg(
      json_build_object(
        'channel', tc.channel,
        'account_id', ca.id,
        'external_ref', ca.external_ref,
        'access_token', cc.access_token_enc
      )
    ) FILTER (WHERE tc.channel IS NOT NULL),
    '[]'::json
  ) AS channels
FROM tenants t
JOIN tenant_channels tc
  ON tc.tenant_id = t.id
 AND tc.enabled = true
 AND tc.channel IN ('facebook', 'instagram')
JOIN channel_accounts ca
  ON ca.tenant_channel_id = tc.id
 AND ca.status = 'active'
JOIN channel_credentials cc
  ON cc.account_id = ca.id
 AND cc.status = 'ok'
 AND (cc.expires_at IS NULL OR cc.expires_at > NOW())
WHERE t.status = 'active'
GROUP BY t.id, t.slug, t.name, t.timezone;
```

### 3) Split In Batches: Tenants
- Batch Size: `1`

### 4) Postgres: Get Tenant Scheduled Targets (today)
- Operation: Execute Query
- Query:

```sql
SELECT
  COALESCE(
    json_agg(
      json_build_object(
        'target_id', spt.id,
        'post_id', sp.id,
        'title', sp.title,
        'message', COALESCE(spt.variant_text, sp.base_text),
        'platform', spt.platform,
        'asset_ids', spt.asset_ids,
        'publish_at_utc', COALESCE(spt.publish_at_utc, sp.scheduled_at_utc)
      )
      ORDER BY COALESCE(spt.publish_at_utc, sp.scheduled_at_utc)
    ),
    '[]'::json
  ) AS targets
FROM social_posts sp
JOIN social_post_targets spt ON spt.post_id = sp.id
WHERE sp.tenant_id = '{{ $json.tenant_id }}'::uuid
  AND sp.status = 'scheduled'
  AND spt.status = 'scheduled'
  AND spt.platform IN ('facebook', 'instagram')
  AND DATE(COALESCE(spt.publish_at_utc, sp.scheduled_at_utc)) = CURRENT_DATE;
```

### 5) IF: Has Targets?
- Condition expression:

```js
{{ Array.isArray($json.targets) && $json.targets.length > 0 }}
```

### 6A) Code (YES branch): Expand Existing Targets
- Code:

```javascript
const tenant = $items('Split In Batches: Tenants', 0, 0)[0].json;
const targets = Array.isArray($json.targets) ? $json.targets : [];
const channels = Array.isArray(tenant.channels) ? tenant.channels : [];

return targets.map((t) => {
  const channel = channels.find((c) => c.channel === t.platform) || {};
  return {
    json: {
      tenant_id: tenant.tenant_id,
      tenant_slug: tenant.slug,
      target_id: t.target_id,
      post_id: t.post_id,
      platform: t.platform,
      message: t.message,
      access_token: channel.access_token || '',
      external_ref: channel.external_ref || {},
      asset_ids: t.asset_ids || [],
      media_url: $env.DEFAULT_SOCIAL_IMAGE_URL || '',
    },
  };
});
```

### 6B) Postgres (NO branch): Create Generic Post + Targets
- Operation: Execute Query
- Query:

```sql
WITH new_post AS (
  INSERT INTO social_posts (
    tenant_id,
    title,
    base_text,
    status,
    scheduled_at_utc,
    timezone,
    created_by,
    updated_by
  )
  VALUES (
    '{{ $json.tenant_id }}'::uuid,
    'Post automático del día',
    '¡Hola! Hoy estamos disponibles para atenderte. Agenda tu cita con nosotros ✨',
    'scheduled',
    NOW(),
    COALESCE('{{ $json.timezone }}', 'America/Mexico_City'),
    'n8n-system',
    'n8n-system'
  )
  RETURNING id, base_text, scheduled_at_utc
)
INSERT INTO social_post_targets (
  post_id,
  platform,
  publish_at_utc,
  timezone,
  status,
  variant_text,
  asset_ids,
  metadata
)
SELECT
  np.id,
  tc.channel,
  np.scheduled_at_utc,
  COALESCE('{{ $json.timezone }}', 'America/Mexico_City'),
  'scheduled',
  np.base_text,
  '[]'::jsonb,
  '{"auto_generated":true}'::jsonb
FROM new_post np
JOIN tenant_channels tc
  ON tc.tenant_id = '{{ $json.tenant_id }}'::uuid
 AND tc.enabled = true
 AND tc.channel IN ('facebook', 'instagram')
RETURNING id AS target_id, post_id, platform, variant_text;
```

### 7B) Code (after generic insert): Expand Generic Targets
- Code:

```javascript
const tenant = $items('Split In Batches: Tenants', 0, 0)[0].json;
const channels = Array.isArray(tenant.channels) ? tenant.channels : [];

return items.map((item) => {
  const t = item.json;
  const channel = channels.find((c) => c.channel === t.platform) || {};
  return {
    json: {
      tenant_id: tenant.tenant_id,
      tenant_slug: tenant.slug,
      target_id: t.target_id,
      post_id: t.post_id,
      platform: t.platform,
      message: t.variant_text,
      access_token: channel.access_token || '',
      external_ref: channel.external_ref || {},
      asset_ids: [],
      media_url: $env.DEFAULT_SOCIAL_IMAGE_URL || '',
    },
  };
});
```

### 8) Merge: Merge YES and NO branches
- Mode: Append

### 9) Switch: Platform
- Value: `{{ $json.platform }}`
- Cases:
  - `facebook`
  - `instagram`

---

## Facebook branch

### 10F) HTTP Request: Publish Facebook Post
- Method: POST
- URL:

```text
=https://graph.facebook.com/v20.0/{{$json.external_ref.page_id || $json.external_ref.id}}/feed
```

- Send Body: form-urlencoded
- Fields:
  - `message` = `{{ $json.message }}`
  - `access_token` = `{{ $json.access_token }}`
- Retry on fail: ON
- Max tries: 3
- Continue on fail: ON

### 11F) IF: Facebook success
- Condition:

```js
{{ !$json.error && !!$json.id }}
```

### 12F-Success) Postgres: Update target published

```sql
UPDATE social_post_targets
SET
  status = 'published',
  platform_post_id = '{{ $json.id }}',
  error = NULL,
  updated_at = NOW()
WHERE id = '{{ $item(0).$node["Merge: Merge YES and NO branches"].json.target_id }}'::uuid;
```

### 12F-Failed) Postgres: Update target failed

```sql
UPDATE social_post_targets
SET
  status = 'failed',
  error = '{{ ($json.error && $json.error.message) ? $json.error.message : "facebook_publish_failed" }}',
  updated_at = NOW()
WHERE id = '{{ $item(0).$node["Merge: Merge YES and NO branches"].json.target_id }}'::uuid;
```

---

## Instagram branch

### 10I) HTTP Request: Create IG media container
- Method: POST
- URL:

```text
=https://graph.facebook.com/v20.0/{{$json.external_ref.ig_user_id || $json.external_ref.id}}/media
```

- Send Body: form-urlencoded
- Fields:
  - `image_url` = `{{ $json.media_url }}`
  - `caption` = `{{ $json.message }}`
  - `access_token` = `{{ $json.access_token }}`
- Retry on fail: ON
- Max tries: 3
- Continue on fail: ON

### 11I) IF: Container created
- Condition:

```js
{{ !$json.error && !!$json.id }}
```

### 12I) HTTP Request: Publish IG container
- Method: POST
- URL:

```text
=https://graph.facebook.com/v20.0/{{$item(0).$node["Merge: Merge YES and NO branches"].json.external_ref.ig_user_id || $item(0).$node["Merge: Merge YES and NO branches"].json.external_ref.id}}/media_publish
```

- Send Body: form-urlencoded
- Fields:
  - `creation_id` = `{{ $json.id }}`
  - `access_token` = `{{ $item(0).$node["Merge: Merge YES and NO branches"].json.access_token }}`
- Retry on fail: ON
- Max tries: 3
- Continue on fail: ON

### 13I) IF: IG publish success
- Condition:

```js
{{ !$json.error && !!$json.id }}
```

### 14I-Success) Postgres: Update target published

```sql
UPDATE social_post_targets
SET
  status = 'published',
  platform_post_id = '{{ $json.id }}',
  error = NULL,
  updated_at = NOW()
WHERE id = '{{ $item(0).$node["Merge: Merge YES and NO branches"].json.target_id }}'::uuid;
```

### 14I-Failed) Postgres: Update target failed

```sql
UPDATE social_post_targets
SET
  status = 'failed',
  error = '{{ ($json.error && $json.error.message) ? $json.error.message : "instagram_publish_failed" }}',
  updated_at = NOW()
WHERE id = '{{ $item(0).$node["Merge: Merge YES and NO branches"].json.target_id }}'::uuid;
```

---

## Optional final consistency query (recommended)

After each publish status update, add this query to keep parent post status synchronized:

```sql
UPDATE social_posts sp
SET status = CASE
  WHEN EXISTS (
    SELECT 1
    FROM social_post_targets spt
    WHERE spt.post_id = sp.id
      AND spt.status = 'failed'
  ) THEN 'failed'
  WHEN NOT EXISTS (
    SELECT 1
    FROM social_post_targets spt
    WHERE spt.post_id = sp.id
      AND spt.status IN ('draft', 'scheduled')
  ) THEN 'published'
  ELSE sp.status
END,
updated_at = NOW()
WHERE sp.id = '{{ $json.post_id }}'::uuid;
```

---

## Notes

1. `channel_credentials.access_token_enc` should be decrypted before use if you store encrypted tokens.
2. Instagram Graph API requires media; keep `DEFAULT_SOCIAL_IMAGE_URL` configured.
3. Add n8n global error workflow for alerting.
4. You can add audit logging by inserting into `audit_logs` in success/failure branches.
