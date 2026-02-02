-- =====================================================
-- MIGRACIÓN: Sistema de Cierre Mensual
-- Descripción: Implementa cierre mensual por zona con 
--              tabla de resumen particionada por año
-- =====================================================

-- 1. Tabla de períodos mensuales
CREATE TABLE IF NOT EXISTS periodos_mensuales (
    id SERIAL PRIMARY KEY,
    anio INT NOT NULL,
    mes INT NOT NULL CHECK (mes >= 1 AND mes <= 12),
    nombre VARCHAR(50) NOT NULL, -- ej: "Noviembre 2025"
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anio, mes)
);

-- 2. Tabla de cierres por zona (muchos a muchos: zonas-periodos)
-- Esta tabla NO se particiona porque tendrá pocos registros
CREATE TABLE IF NOT EXISTS zonas_periodos_cierre (
    id SERIAL PRIMARY KEY,
    zona_id UUID NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
    periodo_id INT NOT NULL REFERENCES periodos_mensuales(id) ON DELETE CASCADE,
    fecha_cierre TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cerrado_por UUID NOT NULL REFERENCES users(id),
    observaciones TEXT,
    esta_cerrado BOOLEAN DEFAULT true,
    reabierto_en TIMESTAMP,
    reabierto_por UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(zona_id, periodo_id)
);

-- 3. Tabla de reportes mensuales (resumen agregado) - PARTICIONADA POR AÑO
CREATE TABLE IF NOT EXISTS reportes_mensuales (
    id BIGSERIAL,
    zona_id UUID NOT NULL,
    periodo_id INT NOT NULL,
    estacion_id UUID NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL,
    fecha DATE NOT NULL, -- Primera fecha del mes para particionamiento
    
    -- Agregados Premium
    premium_volumen_total DECIMAL(15,2) DEFAULT 0,
    premium_importe_total DECIMAL(15,2) DEFAULT 0,
    premium_precio_promedio DECIMAL(10,2) DEFAULT 0,
    premium_merma_volumen_total DECIMAL(15,2) DEFAULT 0,
    premium_merma_importe_total DECIMAL(15,2) DEFAULT 0,
    premium_merma_porcentaje_promedio DECIMAL(8,4) DEFAULT 0,
    premium_eficiencia_real_total DECIMAL(15,2) DEFAULT 0,
    premium_eficiencia_importe_total DECIMAL(15,2) DEFAULT 0,
    premium_eficiencia_real_porcentaje_promedio DECIMAL(8,4) DEFAULT 0,
    
    -- Agregados Magna
    magna_volumen_total DECIMAL(15,2) DEFAULT 0,
    magna_importe_total DECIMAL(15,2) DEFAULT 0,
    magna_precio_promedio DECIMAL(10,2) DEFAULT 0,
    magna_merma_volumen_total DECIMAL(15,2) DEFAULT 0,
    magna_merma_importe_total DECIMAL(15,2) DEFAULT 0,
    magna_merma_porcentaje_promedio DECIMAL(8,4) DEFAULT 0,
    magna_eficiencia_real_total DECIMAL(15,2) DEFAULT 0,
    magna_eficiencia_importe_total DECIMAL(15,2) DEFAULT 0,
    magna_eficiencia_real_porcentaje_promedio DECIMAL(8,4) DEFAULT 0,
    
    -- Agregados Diesel
    diesel_volumen_total DECIMAL(15,2) DEFAULT 0,
    diesel_importe_total DECIMAL(15,2) DEFAULT 0,
    diesel_precio_promedio DECIMAL(10,2) DEFAULT 0,
    diesel_merma_volumen_total DECIMAL(15,2) DEFAULT 0,
    diesel_merma_importe_total DECIMAL(15,2) DEFAULT 0,
    diesel_merma_porcentaje_promedio DECIMAL(8,4) DEFAULT 0,
    diesel_eficiencia_real_total DECIMAL(15,2) DEFAULT 0,
    diesel_eficiencia_importe_total DECIMAL(15,2) DEFAULT 0,
    diesel_eficiencia_real_porcentaje_promedio DECIMAL(8,4) DEFAULT 0,
    
    -- Totales generales
    aceites_total DECIMAL(15,2) DEFAULT 0,
    total_ventas DECIMAL(15,2) DEFAULT 0,
    dias_reportados INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id, fecha)
) PARTITION BY RANGE (fecha);

-- Crear particiones para años 2024-2030
CREATE TABLE IF NOT EXISTS reportes_mensuales_2024 
    PARTITION OF reportes_mensuales 
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS reportes_mensuales_2025 
    PARTITION OF reportes_mensuales 
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS reportes_mensuales_2026 
    PARTITION OF reportes_mensuales 
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE IF NOT EXISTS reportes_mensuales_2027 
    PARTITION OF reportes_mensuales 
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE IF NOT EXISTS reportes_mensuales_2028 
    PARTITION OF reportes_mensuales 
    FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

CREATE TABLE IF NOT EXISTS reportes_mensuales_2029 
    PARTITION OF reportes_mensuales 
    FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');

CREATE TABLE IF NOT EXISTS reportes_mensuales_2030 
    PARTITION OF reportes_mensuales 
    FOR VALUES FROM ('2030-01-01') TO ('2031-01-01');

-- Índices para periodos_mensuales
CREATE INDEX IF NOT EXISTS idx_periodos_anio_mes ON periodos_mensuales(anio, mes);
CREATE INDEX IF NOT EXISTS idx_periodos_fechas ON periodos_mensuales(fecha_inicio, fecha_fin);

-- Índices para zonas_periodos_cierre
CREATE INDEX IF NOT EXISTS idx_zonas_periodos_zona ON zonas_periodos_cierre(zona_id);
CREATE INDEX IF NOT EXISTS idx_zonas_periodos_periodo ON zonas_periodos_cierre(periodo_id);
CREATE INDEX IF NOT EXISTS idx_zonas_periodos_cerrado ON zonas_periodos_cierre(esta_cerrado);
CREATE INDEX IF NOT EXISTS idx_zonas_periodos_fecha ON zonas_periodos_cierre(fecha_cierre);

-- Índices para reportes_mensuales (en cada partición)
CREATE INDEX IF NOT EXISTS idx_reportes_mensuales_zona ON reportes_mensuales(zona_id);
CREATE INDEX IF NOT EXISTS idx_reportes_mensuales_estacion ON reportes_mensuales(estacion_id);
CREATE INDEX IF NOT EXISTS idx_reportes_mensuales_periodo ON reportes_mensuales(periodo_id);
CREATE INDEX IF NOT EXISTS idx_reportes_mensuales_anio_mes ON reportes_mensuales(anio, mes);

-- Insertar períodos para 2024-2025 (históricos y actuales)
INSERT INTO periodos_mensuales (anio, mes, nombre, fecha_inicio, fecha_fin) VALUES
(2024, 1, 'Enero 2024', '2024-01-01', '2024-01-31'),
(2024, 2, 'Febrero 2024', '2024-02-01', '2024-02-29'),
(2024, 3, 'Marzo 2024', '2024-03-01', '2024-03-31'),
(2024, 4, 'Abril 2024', '2024-04-01', '2024-04-30'),
(2024, 5, 'Mayo 2024', '2024-05-01', '2024-05-31'),
(2024, 6, 'Junio 2024', '2024-06-01', '2024-06-30'),
(2024, 7, 'Julio 2024', '2024-07-01', '2024-07-31'),
(2024, 8, 'Agosto 2024', '2024-08-01', '2024-08-31'),
(2024, 9, 'Septiembre 2024', '2024-09-01', '2024-09-30'),
(2024, 10, 'Octubre 2024', '2024-10-01', '2024-10-31'),
(2024, 11, 'Noviembre 2024', '2024-11-01', '2024-11-30'),
(2024, 12, 'Diciembre 2024', '2024-12-01', '2024-12-31'),
(2025, 1, 'Enero 2025', '2025-01-01', '2025-01-31'),
(2025, 2, 'Febrero 2025', '2025-02-01', '2025-02-28'),
(2025, 3, 'Marzo 2025', '2025-03-01', '2025-03-31'),
(2025, 4, 'Abril 2025', '2025-04-01', '2025-04-30'),
(2025, 5, 'Mayo 2025', '2025-05-01', '2025-05-31'),
(2025, 6, 'Junio 2025', '2025-06-01', '2025-06-30'),
(2025, 7, 'Julio 2025', '2025-07-01', '2025-07-31'),
(2025, 8, 'Agosto 2025', '2025-08-01', '2025-08-31'),
(2025, 9, 'Septiembre 2025', '2025-09-01', '2025-09-30'),
(2025, 10, 'Octubre 2025', '2025-10-01', '2025-10-31'),
(2025, 11, 'Noviembre 2025', '2025-11-01', '2025-11-30'),
(2025, 12, 'Diciembre 2025', '2025-12-01', '2025-12-31')
ON CONFLICT (anio, mes) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE periodos_mensuales IS 'Catálogo de períodos mensuales para cierre';
COMMENT ON TABLE zonas_periodos_cierre IS 'Registro de cierres mensuales por zona (muchos a muchos)';
COMMENT ON TABLE reportes_mensuales IS 'Resumen mensual agregado de reportes por estación (particionada por año)';

COMMENT ON COLUMN reportes_mensuales.dias_reportados IS 'Cantidad de días con reportes en el mes';
COMMENT ON COLUMN reportes_mensuales.fecha IS 'Primera fecha del mes (para particionamiento)';
COMMENT ON COLUMN zonas_periodos_cierre.esta_cerrado IS 'true=cerrado, false=reabierto';

-- Función para validar si una zona puede cerrar un período
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
    -- Obtener fechas del período
    SELECT fecha_inicio, fecha_fin INTO v_fecha_inicio, v_fecha_fin
    FROM periodos_mensuales
    WHERE anio = p_anio AND mes = p_mes;
    
    IF v_fecha_inicio IS NULL THEN
        RETURN QUERY SELECT false, 0, 0, 0, 'Período no encontrado'::TEXT;
        RETURN;
    END IF;
    
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

-- Función para calcular agregados mensuales por estación
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

COMMENT ON FUNCTION validar_cierre_periodo IS 'Valida si una zona puede cerrar un período mensual';
COMMENT ON FUNCTION calcular_agregados_mensuales IS 'Calcula agregados mensuales de una estación';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
