-- ========================================
-- SCRIPT AUTOMÁTICO PARA CREAR PARTICIONES
-- Ejecutar anualmente antes del 15 de diciembre
-- ========================================

DO $$
DECLARE
    anio_actual INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    anio_siguiente INTEGER := anio_actual + 1;
    fecha_inicio DATE;
    fecha_fin DATE;
BEGIN
    -- Calcular fechas
    fecha_inicio := make_date(anio_siguiente, 1, 1);
    fecha_fin := make_date(anio_siguiente + 1, 1, 1);
    
    RAISE NOTICE 'Creando particiones para el año %', anio_siguiente;
    
    -- ========================================
    -- 1. GASTOS
    -- ========================================
    BEGIN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS gastos_%s PARTITION OF gastos 
             FOR VALUES FROM (%L) TO (%L)',
            anio_siguiente, fecha_inicio, fecha_fin
        );
        RAISE NOTICE '✓ Partición gastos_% creada', anio_siguiente;
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '- Partición gastos_% ya existe', anio_siguiente;
    END;
    
    -- ========================================
    -- 2. ENTREGAS
    -- ========================================
    BEGIN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS entregas_%s PARTITION OF entregas 
             FOR VALUES FROM (%L) TO (%L)',
            anio_siguiente, fecha_inicio, fecha_fin
        );
        RAISE NOTICE '✓ Partición entregas_% creada', anio_siguiente;
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '- Partición entregas_% ya existe', anio_siguiente;
    END;
    
    -- ========================================
    -- 3. LIQUIDACIONES MENSUALES
    -- ========================================
    BEGIN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS liquidaciones_mensuales_%s PARTITION OF liquidaciones_mensuales 
             FOR VALUES FROM (%s) TO (%s)',
            anio_siguiente, anio_siguiente, anio_siguiente + 1
        );
        RAISE NOTICE '✓ Partición liquidaciones_mensuales_% creada', anio_siguiente;
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '- Partición liquidaciones_mensuales_% ya existe', anio_siguiente;
    END;
    
    -- ========================================
    -- 4. REPORTES
    -- ========================================
    BEGIN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS reportes_%s PARTITION OF reportes 
             FOR VALUES FROM (%L) TO (%L)',
            anio_siguiente, fecha_inicio, fecha_fin
        );
        RAISE NOTICE '✓ Partición reportes_% creada', anio_siguiente;
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '- Partición reportes_% ya existe', anio_siguiente;
    END;
    
    -- ========================================
    -- 5. REPORTE_PRODUCTOS
    -- ========================================
    BEGIN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS reporte_productos_%s PARTITION OF reporte_productos 
             FOR VALUES FROM (%L) TO (%L)',
            anio_siguiente, fecha_inicio, fecha_fin
        );
        RAISE NOTICE '✓ Partición reporte_productos_% creada', anio_siguiente;
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '- Partición reporte_productos_% ya existe', anio_siguiente;
    END;
    
    -- ========================================
    -- 6. REPORTES_MENSUALES (si aplica)
    -- ========================================
    BEGIN
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS reportes_mensuales_%s PARTITION OF reportes_mensuales 
             FOR VALUES FROM (%s) TO (%s)',
            anio_siguiente, anio_siguiente, anio_siguiente + 1
        );
        RAISE NOTICE '✓ Partición reportes_mensuales_% creada', anio_siguiente;
    EXCEPTION 
        WHEN duplicate_table THEN
            RAISE NOTICE '- Partición reportes_mensuales_% ya existe', anio_siguiente;
        WHEN others THEN
            RAISE NOTICE '- Error en reportes_mensuales: %', SQLERRM;
    END;
    
    -- ========================================
    -- ACTUALIZAR ESTADÍSTICAS
    -- ========================================
    ANALYZE gastos;
    ANALYZE entregas;
    ANALYZE liquidaciones_mensuales;
    ANALYZE reportes;
    ANALYZE reporte_productos;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PARTICIONES CREADAS EXITOSAMENTE';
    RAISE NOTICE '========================================';
    
END $$;

-- ========================================
-- VERIFICAR PARTICIONES CREADAS
-- ========================================
SELECT 
    'gastos' as tabla,
    tablename as particion,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS tamaño
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'gastos_%'
ORDER BY tablename DESC
LIMIT 3;

SELECT 
    'entregas' as tabla,
    tablename as particion,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS tamaño
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'entregas_%'
ORDER BY tablename DESC
LIMIT 3;

SELECT 
    'liquidaciones_mensuales' as tabla,
    tablename as particion,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS tamaño
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'liquidaciones_mensuales_%'
ORDER BY tablename DESC
LIMIT 3;
