-- Script para recalcular agregados mensuales de enero 2026
-- Esto corregirá las diferencias de redondeo entre la suma directa y los agregados

BEGIN;

-- Ver diferencias ANTES del recálculo
SELECT 
  e.nombre as estacion,
  rm.premium_merma_importe_total as premium_rm,
  (SELECT SUM(rp.merma_importe) FROM reportes r
   INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
   INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
   WHERE r.estacion_id = e.id AND pc.tipo_producto = 'premium'
     AND EXTRACT(YEAR FROM r.fecha) = 2026 AND EXTRACT(MONTH FROM r.fecha) = 1
     AND r.estado = 'Aprobado') as premium_suma_directa,
  rm.magna_merma_importe_total as magna_rm,
  (SELECT SUM(rp.merma_importe) FROM reportes r
   INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
   INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
   WHERE r.estacion_id = e.id AND pc.tipo_producto = 'magna'
     AND EXTRACT(YEAR FROM r.fecha) = 2026 AND EXTRACT(MONTH FROM r.fecha) = 1
     AND r.estado = 'Aprobado') as magna_suma_directa,
  rm.diesel_merma_importe_total as diesel_rm,
  (SELECT SUM(rp.merma_importe) FROM reportes r
   INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
   INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
   WHERE r.estacion_id = e.id AND pc.tipo_producto = 'diesel'
     AND EXTRACT(YEAR FROM r.fecha) = 2026 AND EXTRACT(MONTH FROM r.fecha) = 1
     AND r.estado = 'Aprobado') as diesel_suma_directa
FROM reportes_mensuales rm
INNER JOIN estaciones e ON e.id = rm.estacion_id
WHERE rm.anio = 2026 AND rm.mes = 1
  AND e.identificador_externo = '2791'
ORDER BY e.nombre;

-- Recalcular todos los agregados mensuales de enero 2026
DO $$
DECLARE
  estacion_rec RECORD;
  agregados RECORD;
BEGIN
  FOR estacion_rec IN 
    SELECT DISTINCT e.id, e.nombre
    FROM estaciones e
    INNER JOIN reportes_mensuales rm ON rm.estacion_id = e.id
    WHERE rm.anio = 2026 AND rm.mes = 1
  LOOP
    -- Calcular agregados
    SELECT * INTO agregados
    FROM calcular_agregados_mensuales(estacion_rec.id, 2026, 1);
    
    -- Actualizar reportes_mensuales
    UPDATE reportes_mensuales
    SET
      premium_volumen_total = agregados.premium_vol,
      premium_importe_total = agregados.premium_imp,
      premium_precio_promedio = agregados.premium_precio,
      premium_merma_volumen_total = agregados.premium_merma_vol,
      premium_merma_importe_total = agregados.premium_merma_imp,
      premium_merma_porcentaje_promedio = agregados.premium_merma_pct,
      premium_eficiencia_real_total = agregados.premium_efic_real,
      premium_eficiencia_importe_total = agregados.premium_efic_imp,
      premium_eficiencia_real_porcentaje_promedio = agregados.premium_efic_pct,
      
      magna_volumen_total = agregados.magna_vol,
      magna_importe_total = agregados.magna_imp,
      magna_precio_promedio = agregados.magna_precio,
      magna_merma_volumen_total = agregados.magna_merma_vol,
      magna_merma_importe_total = agregados.magna_merma_imp,
      magna_merma_porcentaje_promedio = agregados.magna_merma_pct,
      magna_eficiencia_real_total = agregados.magna_efic_real,
      magna_eficiencia_importe_total = agregados.magna_efic_imp,
      magna_eficiencia_real_porcentaje_promedio = agregados.magna_efic_pct,
      
      diesel_volumen_total = agregados.diesel_vol,
      diesel_importe_total = agregados.diesel_imp,
      diesel_precio_promedio = agregados.diesel_precio,
      diesel_merma_volumen_total = agregados.diesel_merma_vol,
      diesel_merma_importe_total = agregados.diesel_merma_imp,
      diesel_merma_porcentaje_promedio = agregados.diesel_merma_pct,
      diesel_eficiencia_real_total = agregados.diesel_efic_real,
      diesel_eficiencia_importe_total = agregados.diesel_efic_imp,
      diesel_eficiencia_real_porcentaje_promedio = agregados.diesel_efic_pct,
      
      total_ventas = agregados.total_vtas,
      aceites_total = agregados.aceites,
      dias_reportados = agregados.dias
    WHERE estacion_id = estacion_rec.id
      AND anio = 2026
      AND mes = 1;
    
    RAISE NOTICE 'Recalculado: %', estacion_rec.nombre;
  END LOOP;
END $$;

-- Ver diferencias DESPUÉS del recálculo
SELECT 
  e.nombre as estacion,
  rm.premium_merma_importe_total as premium_rm,
  (SELECT SUM(rp.merma_importe) FROM reportes r
   INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
   INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
   WHERE r.estacion_id = e.id AND pc.tipo_producto = 'premium'
     AND EXTRACT(YEAR FROM r.fecha) = 2026 AND EXTRACT(MONTH FROM r.fecha) = 1
     AND r.estado = 'Aprobado') as premium_suma_directa,
  rm.magna_merma_importe_total as magna_rm,
  (SELECT SUM(rp.merma_importe) FROM reportes r
   INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
   INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
   WHERE r.estacion_id = e.id AND pc.tipo_producto = 'magna'
     AND EXTRACT(YEAR FROM r.fecha) = 2026 AND EXTRACT(MONTH FROM r.fecha) = 1
     AND r.estado = 'Aprobado') as magna_suma_directa,
  rm.diesel_merma_importe_total as diesel_rm,
  (SELECT SUM(rp.merma_importe) FROM reportes r
   INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
   INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
   WHERE r.estacion_id = e.id AND pc.tipo_producto = 'diesel'
     AND EXTRACT(YEAR FROM r.fecha) = 2026 AND EXTRACT(MONTH FROM r.fecha) = 1
     AND r.estado = 'Aprobado') as diesel_suma_directa
FROM reportes_mensuales rm
INNER JOIN estaciones e ON e.id = rm.estacion_id
WHERE rm.anio = 2026 AND rm.mes = 1
  AND e.identificador_externo = '2791'
ORDER BY e.nombre;

COMMIT;
