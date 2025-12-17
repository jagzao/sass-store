-- ============================================================================
-- Migración: Convertir duración de MINUTOS a HORAS
-- ============================================================================
--
-- IMPORTANTE: Ejecutar ANTES del deploy a producción
--
-- Contexto:
--   - El campo `services.duration` cambió de INTEGER (minutos) a DECIMAL(4,1) (horas)
--   - Esta migración convierte datos existentes de minutos a horas
--
-- Cómo ejecutar:
--   1. Ir a Supabase Dashboard → SQL Editor
--   2. Copiar y pegar este script
--   3. Ejecutar
--
-- ============================================================================

BEGIN;

-- 1. Verificar datos ANTES de la migración
SELECT
  'ANTES DE MIGRACIÓN' as status,
  COUNT(*) as total_servicios,
  AVG(duration) as promedio_duracion,
  MIN(duration) as min_duracion,
  MAX(duration) as max_duracion
FROM services;

-- 2. Ver ejemplos de servicios que serán afectados
SELECT
  id,
  name,
  duration as duracion_actual_minutos,
  ROUND((duration / 60.0)::numeric, 1) as duracion_nueva_horas
FROM services
WHERE duration > 24 -- Solo si parece ser minutos (>24 horas no tiene sentido)
ORDER BY duration DESC
LIMIT 10;

-- 3. MIGRACIÓN: Convertir duración de minutos a horas
-- Solo para servicios donde duration parece ser minutos (> 24)
UPDATE services
SET duration = ROUND((duration / 60.0)::numeric, 1)
WHERE duration > 24;

-- 4. Verificar datos DESPUÉS de la migración
SELECT
  'DESPUÉS DE MIGRACIÓN' as status,
  COUNT(*) as total_servicios,
  AVG(duration) as promedio_duracion,
  MIN(duration) as min_duracion,
  MAX(duration) as max_duracion
FROM services;

-- 5. Ver ejemplos de servicios después de la migración
SELECT
  id,
  name,
  duration as duracion_horas,
  (duration * 60) as equivalente_minutos
FROM services
ORDER BY duration DESC
LIMIT 10;

-- 6. Verificar que no hay valores extraños
SELECT
  COUNT(*) as servicios_con_duracion_sospechosa
FROM services
WHERE duration < 0.1 OR duration > 24;

-- Si todo se ve bien, hacer commit
COMMIT;

-- Si algo salió mal, descomentar la siguiente línea:
-- ROLLBACK;

-- ============================================================================
-- Casos especiales:
-- ============================================================================
--
-- Si ya tenías algunos servicios en horas y otros en minutos:
--
-- UPDATE services
-- SET duration = ROUND((duration / 60.0)::numeric, 1)
-- WHERE duration > 24 AND id IN ('id1', 'id2', ...);
--
-- ============================================================================
