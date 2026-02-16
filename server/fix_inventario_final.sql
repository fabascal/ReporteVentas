-- Script para recalcular I.F. (Inventario Final) en todos los reportes
-- Fórmula: I.F. = (I.I.B. + C.C.T.) - LTS
-- 
-- Este script actualiza el campo "if" en reporte_productos para todos los reportes
-- que tengan valores de inventario (iib, cct, litros)

BEGIN;

-- Mostrar estadísticas antes de la corrección
SELECT 
  'Antes de corrección' as momento,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN if = 0 AND (iib != 0 OR cct != 0 OR litros != 0) THEN 1 END) as productos_con_if_cero,
  COUNT(CASE WHEN if != (iib + cct - litros) THEN 1 END) as productos_con_if_incorrecto
FROM reporte_productos rp
INNER JOIN reportes r ON r.id = rp.reporte_id
WHERE r.estado = 'Aprobado';

-- Actualizar I.F. para todos los productos donde el cálculo no coincida
UPDATE reporte_productos
SET 
  if = (iib + cct) - litros,
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT rp.id
  FROM reporte_productos rp
  INNER JOIN reportes r ON r.id = rp.reporte_id
  WHERE r.estado = 'Aprobado'
    AND rp.if != (rp.iib + rp.cct - rp.litros)
);

-- Mostrar cuántos registros se actualizaron
SELECT 
  'Registros actualizados' as resultado,
  COUNT(*) as total
FROM reporte_productos rp
INNER JOIN reportes r ON r.id = rp.reporte_id
WHERE r.estado = 'Aprobado'
  AND rp.updated_at > (CURRENT_TIMESTAMP - INTERVAL '5 seconds');

-- Mostrar estadísticas después de la corrección
SELECT 
  'Después de corrección' as momento,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN if = 0 AND (iib != 0 OR cct != 0 OR litros != 0) THEN 1 END) as productos_con_if_cero,
  COUNT(CASE WHEN if != (iib + cct - litros) THEN 1 END) as productos_con_if_incorrecto
FROM reporte_productos rp
INNER JOIN reportes r ON r.id = rp.reporte_id
WHERE r.estado = 'Aprobado';

-- Mostrar algunos ejemplos corregidos (incluye MONUMENTAL)
SELECT 
  e.nombre as estacion,
  r.fecha,
  pc.tipo_producto,
  rp.iib,
  rp.cct,
  rp.litros,
  rp.if as if_corregido,
  (rp.iib + rp.cct - rp.litros) as verificacion
FROM reporte_productos rp
INNER JOIN reportes r ON r.id = rp.reporte_id
INNER JOIN estaciones e ON e.id = r.estacion_id
INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
WHERE r.fecha = '2026-01-01'
  AND e.nombre = 'MONUMENTAL'
ORDER BY pc.tipo_producto;

COMMIT;

-- Mensaje final
SELECT 'Script ejecutado exitosamente. Todos los I.F. han sido recalculados.' as mensaje;
