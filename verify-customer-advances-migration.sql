-- Script de verificación para la migración de customer advances
-- Ejecuta este script para verificar que todas las estructuras se han creado correctamente

-- 1. Verificar tablas creadas
SELECT 'Tables' as category, table_name as name, 'table' as type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customer_advances', 'advance_applications')
UNION ALL

-- 2. Verificar columnas agregadas a customers
SELECT 'Columns' as category, column_name as name, 'column' as type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customers' 
AND column_name = 'balance_favor'
UNION ALL

-- 3. Verificar columnas agregadas a customer_visits
SELECT 'Columns' as category, column_name as name, 'column' as type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customer_visits' 
AND column_name IN ('advance_applied', 'remaining_amount', 'payment_status')
UNION ALL

-- 4. Verificar índices creados
SELECT 'Indexes' as category, indexname as name, 'index' as type
FROM pg_indexes 
WHERE tablename IN ('customer_advances', 'advance_applications')
AND schemaname = 'public'
UNION ALL

-- 5. Verificar funciones creadas
SELECT 'Functions' as category, routine_name as name, 'function' as type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('calculate_customer_balance_favor', 'update_visit_payment_status', 'update_advance_status', 'update_updated_at_column')
UNION ALL

-- 6. Verificar políticas RLS
SELECT 'RLS Policies' as category, policyname as name, 'policy' as type
FROM pg_policies 
WHERE tablename IN ('customer_advances', 'advance_applications')
ORDER BY category, name;