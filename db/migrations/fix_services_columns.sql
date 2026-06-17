-- Agregar columnas before_image y after_image a la tabla services
ALTER TABLE services ADD COLUMN IF NOT EXISTS before_image TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS after_image TEXT;

-- Verificar que las columnas se hayan agregado correctamente
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'services' 
AND column_name IN ('before_image', 'after_image');