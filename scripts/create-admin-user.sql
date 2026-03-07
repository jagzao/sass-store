-- Script para crear usuario admin en el tenant manada-juma
-- Ejecutar en la base de datos

-- Primero, obtener el ID del tenant
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Buscar el tenant manada-juma
    SELECT id INTO v_tenant_id
    FROM tenants
    WHERE slug = 'manada-juma';

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant manada-juma no encontrado';
    END IF;

    RAISE NOTICE 'Tenant ID encontrado: %', v_tenant_id;

    -- Crear usuario admin
    -- Nota: La contraseña "admin" debería estar hasheada según tu sistema
    -- Este es un ejemplo con un hash bcrypt genérico para "admin"
    INSERT INTO users (
        id,
        email,
        password,
        name,
        tenant_id,
        role,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'jagzao@gmail.com',
        '$2b$10$HOqRW0xq7ft6EEWQE3ej0.T5KA8JJ/O7nB4Y/rV67IkyGY.5vVpri', -- Hash for "admin"
        'Admin User',
        v_tenant_id,
        'admin',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        tenant_id = v_tenant_id,
        role = 'admin',
        updated_at = NOW();

    RAISE NOTICE 'Usuario admin creado/actualizado exitosamente';

END $$;

-- Verificar que el usuario fue creado
SELECT u.id, u.email, u.name, u.role, t.slug as tenant_slug, t.name as tenant_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'jagzao@gmail.com'
AND t.slug = 'manada-juma';
