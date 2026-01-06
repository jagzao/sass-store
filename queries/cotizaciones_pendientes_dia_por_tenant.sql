-- Query para ver las cotizaciones pendientes del día por tenant
SELECT 
    t.slug AS tenant_slug,
    t.name AS tenant_name,
    COUNT(sq.id) AS cantidad_cotizaciones_pendientes,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'id', sq.id,
            'quote_number', sq.quote_number,
            'name', sq.name,
            'price', sq.price,
            'customer_name', sq.customer_name,
            'customer_phone', sq.customer_phone,
            'created_at', sq.created_at,
            'expires_at', sq.expires_at
        )
    ) AS cotizaciones
FROM 
    service_quotes sq
JOIN 
    tenants t ON sq.tenant_id = t.id
WHERE 
    sq.status = 'pending'
    AND DATE(sq.created_at) = CURRENT_DATE
GROUP BY 
    t.slug, t.name
ORDER BY 
    t.slug;

-- Versión simplificada para ver solo el resumen por tenant
SELECT 
    t.slug AS tenant_slug,
    t.name AS tenant_name,
    COUNT(sq.id) AS cotizaciones_pendientes_hoy
FROM 
    service_quotes sq
JOIN 
    tenants t ON sq.tenant_id = t.id
WHERE 
    sq.status = 'pending'
    AND DATE(sq.created_at) = CURRENT_DATE
GROUP BY 
    t.slug, t.name
ORDER BY 
    cotizaciones_pendientes_hoy DESC;

-- Versión para ver todas las cotizaciones pendientes (no solo del día)
SELECT 
    t.slug AS tenant_slug,
    t.name AS tenant_name,
    COUNT(sq.id) AS total_cotizaciones_pendientes
FROM 
    service_quotes sq
JOIN 
    tenants t ON sq.tenant_id = t.id
WHERE 
    sq.status = 'pending'
GROUP BY 
    t.slug, t.name
ORDER BY 
    total_cotizaciones_pendientes DESC;