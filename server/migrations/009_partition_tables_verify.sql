-- =====================================================
-- SCRIPT DE VERIFICACIÓN: Estado de las Particiones
-- =====================================================

-- Ver todas las particiones creadas
SELECT 
    nmsp_parent.nspname AS schema_padre,
    parent.relname AS tabla_padre,
    nmsp_child.nspname AS schema_particion,
    child.relname AS nombre_particion,
    pg_get_expr(child.relpartbound, child.oid) AS rango_particion
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
JOIN pg_namespace nmsp_parent ON nmsp_parent.oid = parent.relnamespace
JOIN pg_namespace nmsp_child ON nmsp_child.oid = child.relnamespace
WHERE parent.relname IN ('reportes', 'reporte_productos', 'reportes_auditoria')
ORDER BY parent.relname, child.relname;

-- Contar registros por partición en REPORTES
SELECT 
    'reportes' as tabla,
    tableoid::regclass AS particion,
    COUNT(*) as total_registros,
    MIN(fecha) as fecha_minima,
    MAX(fecha) as fecha_maxima
FROM reportes
GROUP BY tableoid
ORDER BY particion;

-- Contar registros por partición en REPORTE_PRODUCTOS (solo si está particionada)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reporte_productos' AND column_name = 'fecha') THEN
        RAISE NOTICE 'Mostrando estadísticas de reporte_productos particionada:';
        PERFORM 1;
    ELSE
        RAISE NOTICE 'Tabla reporte_productos no está particionada (sin columna fecha)';
    END IF;
END $$;

SELECT 
    'reporte_productos' as tabla,
    tableoid::regclass AS particion,
    COUNT(*) as total_registros,
    'Ver query individual' as nota
FROM reporte_productos
GROUP BY tableoid
ORDER BY particion;

-- Contar registros por partición en REPORTES_AUDITORIA
SELECT 
    'reportes_auditoria' as tabla,
    tableoid::regclass AS particion,
    COUNT(*) as total_registros,
    MIN(fecha_cambio) as fecha_minima,
    MAX(fecha_cambio) as fecha_maxima
FROM reportes_auditoria
GROUP BY tableoid
ORDER BY particion;

-- Verificar integridad: fechas sincronizadas entre reportes y reporte_productos (solo si columna fecha existe)
DO $$
DECLARE
    registros_desincronizados INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reporte_productos' AND column_name = 'fecha') THEN
        SELECT COUNT(*) INTO registros_desincronizados
        FROM reporte_productos rp
        JOIN reportes r ON rp.reporte_id = r.id
        WHERE rp.fecha <> r.fecha;
        
        RAISE NOTICE 'Registros desincronizados: %', registros_desincronizados;
        
        IF registros_desincronizados > 0 THEN
            RAISE WARNING 'Hay % registros con fechas desincronizadas', registros_desincronizados;
        END IF;
    ELSE
        RAISE NOTICE 'La columna fecha no existe en reporte_productos (migración no completada)';
    END IF;
END $$;

-- Mostrar índices en las tablas particionadas
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('reportes', 'reporte_productos', 'reportes_auditoria')
ORDER BY tablename, indexname;

-- Tamaño de cada partición
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamaño
FROM pg_tables
WHERE tablename LIKE 'reportes%' OR tablename LIKE 'reporte_productos%'
ORDER BY tablename;
