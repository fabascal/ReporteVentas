-- Migración: Cambiar precisión decimal de 2 a 4 decimales en todas las columnas numéricas
-- Esto mejorará la precisión en cálculos y evitará diferencias por redondeo

BEGIN;

-- ============================================
-- PASO 1: Eliminar vistas que dependen de reportes_mensuales
-- ============================================
DROP VIEW IF EXISTS v_resguardo_estaciones CASCADE;
DROP VIEW IF EXISTS v_resguardo_zonas CASCADE;

-- ============================================
-- PASO 2: Cambiar precisión en reporte_productos
-- ============================================
ALTER TABLE reporte_productos
  ALTER COLUMN precio TYPE NUMERIC(10, 4),
  ALTER COLUMN litros TYPE NUMERIC(12, 4),
  ALTER COLUMN importe TYPE NUMERIC(15, 4),
  ALTER COLUMN merma_volumen TYPE NUMERIC(12, 4),
  ALTER COLUMN merma_importe TYPE NUMERIC(15, 4),
  ALTER COLUMN iib TYPE NUMERIC(12, 4),
  ALTER COLUMN compras TYPE NUMERIC(12, 4),
  ALTER COLUMN cct TYPE NUMERIC(12, 4),
  ALTER COLUMN v_dsc TYPE NUMERIC(12, 4),
  ALTER COLUMN dc TYPE NUMERIC(12, 4),
  ALTER COLUMN dif_v_dsc TYPE NUMERIC(12, 4),
  ALTER COLUMN if TYPE NUMERIC(12, 4),
  ALTER COLUMN iffb TYPE NUMERIC(12, 4),
  ALTER COLUMN eficiencia_real TYPE NUMERIC(12, 4),
  ALTER COLUMN eficiencia_importe TYPE NUMERIC(15, 4);

-- ============================================
-- PASO 3: Cambiar precisión en reportes_mensuales
-- ============================================
ALTER TABLE reportes_mensuales
  -- Premium
  ALTER COLUMN premium_volumen_total TYPE NUMERIC(15, 4),
  ALTER COLUMN premium_importe_total TYPE NUMERIC(18, 4),
  ALTER COLUMN premium_precio_promedio TYPE NUMERIC(10, 4),
  ALTER COLUMN premium_merma_volumen_total TYPE NUMERIC(15, 4),
  ALTER COLUMN premium_merma_importe_total TYPE NUMERIC(18, 4),
  ALTER COLUMN premium_eficiencia_real_total TYPE NUMERIC(15, 4),
  ALTER COLUMN premium_eficiencia_importe_total TYPE NUMERIC(18, 4),
  -- Magna
  ALTER COLUMN magna_volumen_total TYPE NUMERIC(15, 4),
  ALTER COLUMN magna_importe_total TYPE NUMERIC(18, 4),
  ALTER COLUMN magna_precio_promedio TYPE NUMERIC(10, 4),
  ALTER COLUMN magna_merma_volumen_total TYPE NUMERIC(15, 4),
  ALTER COLUMN magna_merma_importe_total TYPE NUMERIC(18, 4),
  ALTER COLUMN magna_eficiencia_real_total TYPE NUMERIC(15, 4),
  ALTER COLUMN magna_eficiencia_importe_total TYPE NUMERIC(18, 4),
  -- Diesel
  ALTER COLUMN diesel_volumen_total TYPE NUMERIC(15, 4),
  ALTER COLUMN diesel_importe_total TYPE NUMERIC(18, 4),
  ALTER COLUMN diesel_precio_promedio TYPE NUMERIC(10, 4),
  ALTER COLUMN diesel_merma_volumen_total TYPE NUMERIC(15, 4),
  ALTER COLUMN diesel_merma_importe_total TYPE NUMERIC(18, 4),
  ALTER COLUMN diesel_eficiencia_real_total TYPE NUMERIC(15, 4),
  ALTER COLUMN diesel_eficiencia_importe_total TYPE NUMERIC(18, 4),
  -- Totales
  ALTER COLUMN aceites_total TYPE NUMERIC(15, 4),
  ALTER COLUMN total_ventas TYPE NUMERIC(18, 4);

-- ============================================
-- PASO 4: Recrear vistas
-- ============================================

-- Vista: v_resguardo_estaciones
CREATE VIEW v_resguardo_estaciones AS
SELECT 
  e.id AS estacion_id,
  e.nombre AS estacion_nombre,
  e.zona_id,
  z.nombre AS zona_nombre,
  EXTRACT(YEAR FROM CURRENT_DATE) AS anio,
  EXTRACT(MONTH FROM CURRENT_DATE) AS mes,
  COALESCE(
    SUM(
      COALESCE(rm.premium_eficiencia_importe_total, 0) +
      COALESCE(rm.magna_eficiencia_importe_total, 0) +
      COALESCE(rm.diesel_eficiencia_importe_total, 0)
    ), 0
  ) AS merma_generada,
  COALESCE(
    (SELECT SUM(ent.monto)
     FROM entregas ent
     WHERE ent.estacion_id = e.id
       AND ent.tipo_entrega = 'estacion_zona'
       AND EXTRACT(YEAR FROM ent.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM ent.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
    ), 0
  ) AS entregas_realizadas,
  COALESCE(
    (SELECT SUM(g.monto)
     FROM gastos g
     WHERE g.estacion_id = e.id
       AND g.tipo_gasto = 'estacion'
       AND EXTRACT(YEAR FROM g.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM g.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
    ), 0
  ) AS gastos_realizados,
  (
    COALESCE(
      SUM(
        COALESCE(rm.premium_eficiencia_importe_total, 0) +
        COALESCE(rm.magna_eficiencia_importe_total, 0) +
        COALESCE(rm.diesel_eficiencia_importe_total, 0)
      ), 0
    ) -
    COALESCE(
      (SELECT SUM(ent.monto)
       FROM entregas ent
       WHERE ent.estacion_id = e.id
         AND ent.tipo_entrega = 'estacion_zona'
         AND EXTRACT(YEAR FROM ent.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM ent.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
      ), 0
    ) -
    COALESCE(
      (SELECT SUM(g.monto)
       FROM gastos g
       WHERE g.estacion_id = e.id
         AND g.tipo_gasto = 'estacion'
         AND EXTRACT(YEAR FROM g.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM g.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
      ), 0
    )
  ) AS saldo_resguardo
FROM estaciones e
LEFT JOIN zonas z ON e.zona_id = z.id
LEFT JOIN reportes_mensuales rm ON 
  rm.estacion_id = e.id 
  AND rm.anio = EXTRACT(YEAR FROM CURRENT_DATE)
  AND rm.mes = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY e.id, e.nombre, e.zona_id, z.nombre;

-- Vista: v_resguardo_zonas
CREATE VIEW v_resguardo_zonas AS
SELECT 
  id AS zona_id,
  nombre AS zona_nombre,
  EXTRACT(YEAR FROM CURRENT_DATE) AS anio,
  EXTRACT(MONTH FROM CURRENT_DATE) AS mes,
  COALESCE(
    (SELECT lm.saldo_final
     FROM liquidaciones_mensuales lm
     WHERE lm.zona_id = z.id
       AND (
         (lm.anio = EXTRACT(YEAR FROM CURRENT_DATE) AND lm.mes = EXTRACT(MONTH FROM CURRENT_DATE) - 1)
         OR (lm.anio = EXTRACT(YEAR FROM CURRENT_DATE) - 1 AND lm.mes = 12 AND EXTRACT(MONTH FROM CURRENT_DATE) = 1)
       )
     ORDER BY lm.anio DESC, lm.mes DESC
     LIMIT 1
    ), 0
  ) AS saldo_inicial,
  COALESCE(
    (SELECT SUM(ent.monto)
     FROM entregas ent
     WHERE ent.zona_id = z.id
       AND ent.tipo_entrega = 'estacion_zona'
       AND EXTRACT(YEAR FROM ent.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM ent.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
    ), 0
  ) AS entregas_recibidas,
  COALESCE(
    (SELECT SUM(ent.monto)
     FROM entregas ent
     WHERE ent.zona_origen_id = z.id
       AND ent.tipo_entrega = 'zona_direccion'
       AND EXTRACT(YEAR FROM ent.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM ent.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
    ), 0
  ) AS entregas_direccion,
  COALESCE(
    (SELECT SUM(g.monto)
     FROM gastos g
     WHERE g.zona_id = z.id
       AND g.tipo_gasto = 'zona'
       AND EXTRACT(YEAR FROM g.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM g.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
    ), 0
  ) AS gastos_zona,
  (
    COALESCE(
      (SELECT lm.saldo_final
       FROM liquidaciones_mensuales lm
       WHERE lm.zona_id = z.id
         AND (
           (lm.anio = EXTRACT(YEAR FROM CURRENT_DATE) AND lm.mes = EXTRACT(MONTH FROM CURRENT_DATE) - 1)
           OR (lm.anio = EXTRACT(YEAR FROM CURRENT_DATE) - 1 AND lm.mes = 12 AND EXTRACT(MONTH FROM CURRENT_DATE) = 1)
         )
       ORDER BY lm.anio DESC, lm.mes DESC
       LIMIT 1
      ), 0
    ) +
    COALESCE(
      (SELECT SUM(ent.monto)
       FROM entregas ent
       WHERE ent.zona_id = z.id
         AND ent.tipo_entrega = 'estacion_zona'
         AND EXTRACT(YEAR FROM ent.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM ent.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
      ), 0
    ) -
    COALESCE(
      (SELECT SUM(ent.monto)
       FROM entregas ent
       WHERE ent.zona_origen_id = z.id
         AND ent.tipo_entrega = 'zona_direccion'
         AND EXTRACT(YEAR FROM ent.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM ent.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
      ), 0
    ) -
    COALESCE(
      (SELECT SUM(g.monto)
       FROM gastos g
       WHERE g.zona_id = z.id
         AND g.tipo_gasto = 'zona'
         AND EXTRACT(YEAR FROM g.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM g.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
      ), 0
    )
  ) AS resguardo_actual
FROM zonas z;

-- ============================================
-- PASO 5: Recalcular valores con 4 decimales
-- ============================================
UPDATE reporte_productos
SET
  eficiencia_real = (iffb - if),
  eficiencia_importe = (iffb - if) * precio,
  eficiencia_real_porcentaje = CASE 
    WHEN litros > 0 THEN ((iffb - if) / litros) * 100
    ELSE 0
  END
WHERE id IN (
  SELECT rp.id
  FROM reporte_productos rp
  INNER JOIN reportes r ON r.id = rp.reporte_id
  WHERE r.estado = 'Aprobado'
);

-- ============================================
-- PASO 6: Verificar cambios
-- ============================================
SELECT 
  'reporte_productos' as tabla,
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'reporte_productos'
  AND data_type = 'numeric'
  AND column_name IN ('precio', 'litros', 'importe', 'merma_volumen', 'merma_importe', 'if', 'iffb', 'eficiencia_importe')
ORDER BY ordinal_position;

-- Mostrar ejemplo con RYSVAL
SELECT 
  r.fecha,
  e.nombre as estacion,
  pc.tipo_producto,
  rp.precio,
  rp.litros,
  rp.merma_volumen,
  rp.merma_importe,
  rp.if,
  rp.iffb,
  rp.eficiencia_real,
  rp.eficiencia_importe
FROM reportes r
INNER JOIN estaciones e ON e.id = r.estacion_id
INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
WHERE e.nombre ILIKE '%RYSVAL%'
  AND r.fecha = '2026-01-01'
  AND pc.tipo_producto IN ('premium', 'magna')
ORDER BY pc.tipo_producto;

COMMIT;
