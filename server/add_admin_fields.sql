-- Agregar campos admin_volumen y admin_importe a reporte_productos
-- Estos campos almacenan los valores de "Volumen Admin" e "Importe Admin" de la API externa

BEGIN;

-- Agregar columnas a reporte_productos
ALTER TABLE reporte_productos
  ADD COLUMN IF NOT EXISTS admin_volumen NUMERIC(12, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_importe NUMERIC(15, 4) DEFAULT 0;

-- Comentarios para documentación
COMMENT ON COLUMN reporte_productos.admin_volumen IS 'Volumen administrativo de la API externa (Volumen Admin)';
COMMENT ON COLUMN reporte_productos.admin_importe IS 'Importe administrativo de la API externa (Importe Admin)';

-- Verificar la estructura
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  column_default
FROM information_schema.columns
WHERE table_name = 'reporte_productos'
  AND column_name IN ('admin_volumen', 'admin_importe', 'merma_volumen', 'merma_importe', 'merma_porcentaje');

COMMIT;
