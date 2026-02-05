-- =====================================================
-- MIGRACIÓN: Eliminar tabla periodos_mensuales
-- Descripción: Consolidar gestión de períodos en ejercicios_fiscales
-- =====================================================

BEGIN;

-- PASO 1: Agregar columnas anio y mes a zonas_periodos_cierre
ALTER TABLE zonas_periodos_cierre 
ADD COLUMN IF NOT EXISTS anio INT,
ADD COLUMN IF NOT EXISTS mes INT CHECK (mes >= 1 AND mes <= 12);

-- PASO 2: Migrar datos existentes de periodo_id a anio/mes
UPDATE zonas_periodos_cierre zpc
SET anio = pm.anio, mes = pm.mes
FROM periodos_mensuales pm
WHERE zpc.periodo_id = pm.id AND zpc.anio IS NULL;

-- PASO 3: Hacer NOT NULL las nuevas columnas (después de migrar datos)
ALTER TABLE zonas_periodos_cierre 
ALTER COLUMN anio SET NOT NULL,
ALTER COLUMN mes SET NOT NULL;

-- PASO 4: Eliminar la FK constraint a periodos_mensuales
ALTER TABLE zonas_periodos_cierre 
DROP CONSTRAINT IF EXISTS zonas_periodos_cierre_periodo_id_fkey;

-- PASO 5: Eliminar la columna periodo_id
ALTER TABLE zonas_periodos_cierre 
DROP COLUMN IF EXISTS periodo_id;

-- PASO 6: Crear nueva constraint UNIQUE con anio/mes
ALTER TABLE zonas_periodos_cierre 
DROP CONSTRAINT IF EXISTS zonas_periodos_cierre_zona_id_periodo_id_key;

ALTER TABLE zonas_periodos_cierre 
ADD CONSTRAINT zonas_periodos_cierre_zona_anio_mes_key 
UNIQUE(zona_id, anio, mes);

-- PASO 7: Recrear índices
DROP INDEX IF EXISTS idx_zonas_periodos_periodo;
CREATE INDEX IF NOT EXISTS idx_zonas_periodos_anio_mes ON zonas_periodos_cierre(anio, mes);

-- PASO 8: Hacer lo mismo con reportes_mensuales
ALTER TABLE reportes_mensuales 
DROP COLUMN IF EXISTS periodo_id CASCADE;

-- PASO 9: Recrear índice de reportes_mensuales
DROP INDEX IF EXISTS idx_reportes_mensuales_periodo;

-- PASO 10: Eliminar funciones que dependen de periodos_mensuales
DROP FUNCTION IF EXISTS validar_cierre_periodo(UUID, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS calcular_agregados_mensuales(UUID, INT, INT) CASCADE;

-- PASO 11: Eliminar tabla periodos_mensuales
DROP TABLE IF EXISTS periodos_mensuales CASCADE;

-- PASO 12: Recrear función validar_cierre_periodo SIN periodos_mensuales
CREATE OR REPLACE FUNCTION validar_cierre_periodo(
    p_zona_id UUID,
    p_anio INT,
    p_mes INT
) RETURNS TABLE(
    puede_cerrar BOOLEAN,
    total_estaciones INT,
    estaciones_completas INT,
    dias_en_mes INT,
    mensaje TEXT
) AS $$
DECLARE
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_dias_mes INT;
    v_total_estaciones INT;
    v_estaciones_ok INT;
BEGIN
    -- Calcular fechas del período directamente
    v_fecha_inicio := make_date(p_anio, p_mes, 1);
    v_fecha_fin := (v_fecha_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    v_dias_mes := (v_fecha_fin - v_fecha_inicio) + 1;
    
    -- Contar estaciones de la zona
    SELECT COUNT(*) INTO v_total_estaciones
    FROM estaciones
    WHERE zona_id = p_zona_id AND activa = true;
    
    -- Contar estaciones que tienen todos los días aprobados
    SELECT COUNT(DISTINCT e.id) INTO v_estaciones_ok
    FROM estaciones e
    WHERE e.zona_id = p_zona_id 
      AND e.activa = true
      AND (
        SELECT COUNT(DISTINCT DATE(r.fecha))
        FROM reportes r
        WHERE r.estacion_id = e.id
          AND DATE(r.fecha) >= v_fecha_inicio
          AND DATE(r.fecha) <= v_fecha_fin
          AND r.estado = 'Aprobado'
      ) = v_dias_mes;
    
    -- Retornar resultado
    IF v_estaciones_ok = v_total_estaciones AND v_total_estaciones > 0 THEN
        RETURN QUERY SELECT 
            true, 
            v_total_estaciones, 
            v_estaciones_ok, 
            v_dias_mes,
            'Todos los reportes están completos y aprobados'::TEXT;
    ELSE
        RETURN QUERY SELECT 
            false, 
            v_total_estaciones, 
            v_estaciones_ok, 
            v_dias_mes,
            format('Faltan estaciones: %s de %s completas', v_estaciones_ok, v_total_estaciones)::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- PASO 13: Recrear función calcular_agregados_mensuales
CREATE OR REPLACE FUNCTION calcular_agregados_mensuales(
    p_estacion_id UUID,
    p_anio INT,
    p_mes INT
) RETURNS TABLE(
    premium_vol DECIMAL, premium_imp DECIMAL, premium_precio DECIMAL,
    premium_merma_vol DECIMAL, premium_merma_imp DECIMAL, premium_merma_pct DECIMAL,
    premium_efic_real DECIMAL, premium_efic_imp DECIMAL, premium_efic_pct DECIMAL,
    magna_vol DECIMAL, magna_imp DECIMAL, magna_precio DECIMAL,
    magna_merma_vol DECIMAL, magna_merma_imp DECIMAL, magna_merma_pct DECIMAL,
    magna_efic_real DECIMAL, magna_efic_imp DECIMAL, magna_efic_pct DECIMAL,
    diesel_vol DECIMAL, diesel_imp DECIMAL, diesel_precio DECIMAL,
    diesel_merma_vol DECIMAL, diesel_merma_imp DECIMAL, diesel_merma_pct DECIMAL,
    diesel_efic_real DECIMAL, diesel_efic_imp DECIMAL, diesel_efic_pct DECIMAL,
    aceites DECIMAL, total_vtas DECIMAL, dias INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Premium
        COALESCE(SUM(rp.litros), 0)::DECIMAL AS premium_vol,
        COALESCE(SUM(rp.importe), 0)::DECIMAL AS premium_imp,
        COALESCE(AVG(rp.precio), 0)::DECIMAL AS premium_precio,
        COALESCE(SUM(rp.merma_volumen), 0)::DECIMAL AS premium_merma_vol,
        COALESCE(SUM(rp.merma_importe), 0)::DECIMAL AS premium_merma_imp,
        COALESCE(AVG(rp.merma_porcentaje), 0)::DECIMAL AS premium_merma_pct,
        COALESCE(SUM(rp.eficiencia_real), 0)::DECIMAL AS premium_efic_real,
        COALESCE(SUM(rp.eficiencia_importe), 0)::DECIMAL AS premium_efic_imp,
        COALESCE(AVG(rp.eficiencia_real_porcentaje), 0)::DECIMAL AS premium_efic_pct,
        -- Magna
        COALESCE(SUM(rm.litros), 0)::DECIMAL AS magna_vol,
        COALESCE(SUM(rm.importe), 0)::DECIMAL AS magna_imp,
        COALESCE(AVG(rm.precio), 0)::DECIMAL AS magna_precio,
        COALESCE(SUM(rm.merma_volumen), 0)::DECIMAL AS magna_merma_vol,
        COALESCE(SUM(rm.merma_importe), 0)::DECIMAL AS magna_merma_imp,
        COALESCE(AVG(rm.merma_porcentaje), 0)::DECIMAL AS magna_merma_pct,
        COALESCE(SUM(rm.eficiencia_real), 0)::DECIMAL AS magna_efic_real,
        COALESCE(SUM(rm.eficiencia_importe), 0)::DECIMAL AS magna_efic_imp,
        COALESCE(AVG(rm.eficiencia_real_porcentaje), 0)::DECIMAL AS magna_efic_pct,
        -- Diesel
        COALESCE(SUM(rd.litros), 0)::DECIMAL AS diesel_vol,
        COALESCE(SUM(rd.importe), 0)::DECIMAL AS diesel_imp,
        COALESCE(AVG(rd.precio), 0)::DECIMAL AS diesel_precio,
        COALESCE(SUM(rd.merma_volumen), 0)::DECIMAL AS diesel_merma_vol,
        COALESCE(SUM(rd.merma_importe), 0)::DECIMAL AS diesel_merma_imp,
        COALESCE(AVG(rd.merma_porcentaje), 0)::DECIMAL AS diesel_merma_pct,
        COALESCE(SUM(rd.eficiencia_real), 0)::DECIMAL AS diesel_efic_real,
        COALESCE(SUM(rd.eficiencia_importe), 0)::DECIMAL AS diesel_efic_imp,
        COALESCE(AVG(rd.eficiencia_real_porcentaje), 0)::DECIMAL AS diesel_efic_pct,
        -- Totales
        COALESCE(SUM(r.aceites), 0)::DECIMAL AS aceites,
        COALESCE(SUM(r.total_ventas), 0)::DECIMAL AS total_vtas,
        COUNT(DISTINCT r.id)::INT AS dias
    FROM reportes r
    LEFT JOIN reporte_productos rp ON r.id = rp.reporte_id AND rp.producto = 'premium'
    LEFT JOIN reporte_productos rm ON r.id = rm.reporte_id AND rm.producto = 'magna'
    LEFT JOIN reporte_productos rd ON r.id = rd.reporte_id AND rd.producto = 'diesel'
    WHERE r.estacion_id = p_estacion_id
      AND EXTRACT(YEAR FROM r.fecha) = p_anio
      AND EXTRACT(MONTH FROM r.fecha) = p_mes
      AND r.estado = 'Aprobado';
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE zonas_periodos_cierre IS 'Registro de cierres mensuales por zona (usa anio/mes directamente)';
COMMENT ON COLUMN zonas_periodos_cierre.anio IS 'Año del período (reemplaza periodo_id)';
COMMENT ON COLUMN zonas_periodos_cierre.mes IS 'Mes del período (reemplaza periodo_id)';

COMMIT;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
