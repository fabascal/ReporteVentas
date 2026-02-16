-- Script para recalcular eficiencia_real y eficiencia_importe en todos los reportes
-- Fórmulas:
--   eficiencia_real = IFFB - IF
--   eficiencia_importe = eficiencia_real * precio
--   eficiencia_real_porcentaje = (eficiencia_real / (litros - merma_volumen + merma_volumen)) * 100
--                                = (eficiencia_real / litros) * 100

BEGIN;

-- Ver estadísticas antes de la corrección
SELECT 
  'ANTES' as momento,
  COUNT(*) as total_productos,
  COUNT(*) FILTER (WHERE eficiencia_real != (iffb - if)) as incorrectos_er,
  COUNT(*) FILTER (WHERE eficiencia_importe != ((iffb - if) * precio)) as incorrectos_ei
FROM reporte_productos rp
INNER JOIN reportes r ON r.id = rp.reporte_id
WHERE r.estado = 'Aprobado';

-- Actualizar eficiencia_real, eficiencia_importe y eficiencia_real_porcentaje
UPDATE reporte_productos
SET
  eficiencia_real = (iffb - if),
  eficiencia_importe = (iffb - if) * precio,
  eficiencia_real_porcentaje = CASE 
    WHEN litros > 0 THEN ((iffb - if) / litros) * 100
    ELSE 0
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT rp.id
  FROM reporte_productos rp
  INNER JOIN reportes r ON r.id = rp.reporte_id
  WHERE r.estado = 'Aprobado'
    AND (
      rp.eficiencia_real != (rp.iffb - rp.if)
      OR rp.eficiencia_importe != ((rp.iffb - rp.if) * rp.precio)
    )
);

-- Ver estadísticas después de la corrección
SELECT 
  'DESPUES' as momento,
  COUNT(*) as total_productos,
  COUNT(*) FILTER (WHERE eficiencia_real != (iffb - if)) as incorrectos_er,
  COUNT(*) FILTER (WHERE eficiencia_importe != ((iffb - if) * precio)) as incorrectos_ei
FROM reporte_productos rp
INNER JOIN reportes r ON r.id = rp.reporte_id
WHERE r.estado = 'Aprobado';

-- Mostrar algunos ejemplos de RYSVAL corregidos
SELECT 
  r.fecha,
  e.nombre as estacion,
  pc.tipo_producto,
  rp.if,
  rp.iffb,
  rp.eficiencia_real,
  rp.precio,
  rp.eficiencia_importe
FROM reportes r
INNER JOIN estaciones e ON e.id = r.estacion_id
INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
WHERE e.nombre ILIKE '%RYSVAL%'
  AND r.fecha >= '2026-01-01'
  AND r.fecha <= '2026-01-05'
  AND pc.tipo_producto IN ('premium', 'magna')
ORDER BY r.fecha, pc.tipo_producto;

COMMIT;
