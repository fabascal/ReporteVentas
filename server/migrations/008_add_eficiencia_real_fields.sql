-- Agregar campos de eficiencia real a reporte_productos
ALTER TABLE reporte_productos 
ADD COLUMN IF NOT EXISTS eficiencia_real DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS eficiencia_importe DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS eficiencia_real_porcentaje DECIMAL(8, 4) DEFAULT 0;

-- Comentarios para documentar los campos
COMMENT ON COLUMN reporte_productos.eficiencia_real IS 'Eficiencia real calculada como IFFB - IF';
COMMENT ON COLUMN reporte_productos.eficiencia_importe IS 'Eficiencia real multiplicada por el precio del producto';
COMMENT ON COLUMN reporte_productos.eficiencia_real_porcentaje IS 'Eficiencia real dividida entre litros (porcentaje)';

-- Calcular valores para registros existentes
UPDATE reporte_productos 
SET 
  eficiencia_real = COALESCE(iffb, 0) - COALESCE(if, 0),
  eficiencia_importe = (COALESCE(iffb, 0) - COALESCE(if, 0)) * COALESCE(precio, 0),
  eficiencia_real_porcentaje = CASE 
    WHEN COALESCE(litros, 0) > 0 THEN ((COALESCE(iffb, 0) - COALESCE(if, 0)) / COALESCE(litros, 0)) * 100
    ELSE 0
  END
WHERE eficiencia_real IS NULL OR eficiencia_real = 0;
