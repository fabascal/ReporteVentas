-- =====================================================
-- MIGRACIÓN: Particionamiento de Tablas por Año
-- =====================================================
-- Este script convierte las tablas reportes, reporte_productos
-- y reportes_auditoria en tablas particionadas por año.
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: Crear tabla particionada para REPORTES
-- =====================================================

-- Renombrar tabla original
ALTER TABLE reportes RENAME TO reportes_old;

-- Crear tabla particionada
CREATE TABLE reportes (
    id UUID DEFAULT gen_random_uuid(),
    estacion_id UUID NOT NULL,
    fecha DATE NOT NULL,
    aceites DECIMAL(10, 2) DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    creado_por UUID NOT NULL,
    revisado_por UUID,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP,
    comentarios TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, fecha),
    CONSTRAINT reportes_estacion_fecha_unique UNIQUE (estacion_id, fecha)
) PARTITION BY RANGE (fecha);

-- Crear particiones por año (2024-2027)
CREATE TABLE reportes_2024 PARTITION OF reportes
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE reportes_2025 PARTITION OF reportes
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE reportes_2026 PARTITION OF reportes
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE reportes_2027 PARTITION OF reportes
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Crear partición por defecto para fechas futuras
CREATE TABLE reportes_default PARTITION OF reportes DEFAULT;

-- Migrar datos (especificando columnas explícitamente)
INSERT INTO reportes (
    id, estacion_id, fecha, aceites, estado, creado_por, revisado_por,
    fecha_creacion, fecha_revision, comentarios, created_at, updated_at
)
SELECT 
    id, estacion_id, fecha, aceites, estado, creado_por, revisado_por,
    fecha_creacion, fecha_revision, comentarios, created_at, updated_at
FROM reportes_old;

-- Recrear índices (eliminar primero por si acaso)
DROP INDEX IF EXISTS idx_reportes_estacion_id;
DROP INDEX IF EXISTS idx_reportes_fecha;
DROP INDEX IF EXISTS idx_reportes_estado;
DROP INDEX IF EXISTS idx_reportes_creado_por;
DROP INDEX IF EXISTS idx_reportes_id;

CREATE INDEX idx_reportes_estacion_id ON reportes(estacion_id);
CREATE INDEX idx_reportes_fecha ON reportes(fecha);
CREATE INDEX idx_reportes_estado ON reportes(estado);
CREATE INDEX idx_reportes_creado_por ON reportes(creado_por);
-- Índice en id para mantener rendimiento sin FK
CREATE INDEX idx_reportes_id ON reportes(id);

-- Recrear foreign keys
ALTER TABLE reportes ADD CONSTRAINT fk_reportes_estacion 
    FOREIGN KEY (estacion_id) REFERENCES estaciones(id) ON DELETE CASCADE;
ALTER TABLE reportes ADD CONSTRAINT fk_reportes_creado_por 
    FOREIGN KEY (creado_por) REFERENCES users(id);
ALTER TABLE reportes ADD CONSTRAINT fk_reportes_revisado_por 
    FOREIGN KEY (revisado_por) REFERENCES users(id);

COMMENT ON TABLE reportes IS 'Tabla particionada de reportes de ventas por año. PK compuesta (id, fecha) requerida por particionamiento.';
COMMENT ON COLUMN reportes.id IS 'UUID único del reporte (parte de la PK compuesta)';

-- =====================================================
-- PASO 2: Preparar REPORTE_PRODUCTOS para particionamiento
-- =====================================================

-- Agregar columna fecha a reporte_productos (desnormalización)
ALTER TABLE reporte_productos ADD COLUMN fecha DATE;

-- Poblar la columna fecha con datos del reporte padre
UPDATE reporte_productos rp
SET fecha = r.fecha
FROM reportes_old r
WHERE rp.reporte_id = r.id;

-- Hacer la columna NOT NULL
ALTER TABLE reporte_productos ALTER COLUMN fecha SET NOT NULL;

-- Renombrar tabla original
ALTER TABLE reporte_productos RENAME TO reporte_productos_old;

-- Crear tabla particionada
CREATE TABLE reporte_productos (
    id UUID DEFAULT gen_random_uuid(),
    reporte_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    litros DECIMAL(12, 2) NOT NULL,
    importe DECIMAL(12, 2) NOT NULL,
    merma_volumen DECIMAL(12, 2) DEFAULT 0,
    merma_importe DECIMAL(12, 2) DEFAULT 0,
    merma_porcentaje DECIMAL(8, 4) DEFAULT 0,
    iib DECIMAL(12, 2) DEFAULT 0,
    compras DECIMAL(12, 2) DEFAULT 0,
    cct DECIMAL(12, 2) DEFAULT 0,
    v_dsc DECIMAL(12, 2) DEFAULT 0,
    dc DECIMAL(12, 2) DEFAULT 0,
    dif_v_dsc DECIMAL(12, 2) DEFAULT 0,
    if DECIMAL(12, 2) DEFAULT 0,
    iffb DECIMAL(12, 2) DEFAULT 0,
    eficiencia_real DECIMAL(10, 2) DEFAULT 0,
    eficiencia_importe DECIMAL(12, 2) DEFAULT 0,
    eficiencia_real_porcentaje DECIMAL(8, 4) DEFAULT 0,
    fecha DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, fecha),
    CONSTRAINT reporte_productos_unique UNIQUE (reporte_id, producto_id, fecha)
) PARTITION BY RANGE (fecha);

-- Crear particiones por año
CREATE TABLE reporte_productos_2024 PARTITION OF reporte_productos
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE reporte_productos_2025 PARTITION OF reporte_productos
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE reporte_productos_2026 PARTITION OF reporte_productos
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE reporte_productos_2027 PARTITION OF reporte_productos
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE reporte_productos_default PARTITION OF reporte_productos DEFAULT;

-- Migrar datos (especificando columnas explícitamente)
INSERT INTO reporte_productos (
    id, reporte_id, producto_id, precio, litros, importe,
    merma_volumen, merma_importe, merma_porcentaje,
    iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb,
    eficiencia_real, eficiencia_importe, eficiencia_real_porcentaje,
    fecha, created_at, updated_at
)
SELECT 
    id, reporte_id, producto_id, precio, litros, importe,
    merma_volumen, merma_importe, merma_porcentaje,
    iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb,
    eficiencia_real, eficiencia_importe, eficiencia_real_porcentaje,
    fecha, created_at, updated_at
FROM reporte_productos_old;

-- Recrear índices (eliminar primero por si acaso)
DROP INDEX IF EXISTS idx_reporte_productos_reporte_id;
DROP INDEX IF EXISTS idx_reporte_productos_producto_id;
DROP INDEX IF EXISTS idx_reporte_productos_fecha;
DROP INDEX IF EXISTS idx_reporte_productos_reporte_fecha;

CREATE INDEX idx_reporte_productos_reporte_id ON reporte_productos(reporte_id);
CREATE INDEX idx_reporte_productos_producto_id ON reporte_productos(producto_id);
CREATE INDEX idx_reporte_productos_fecha ON reporte_productos(fecha);
-- Índice compuesto para optimizar joins con reportes
CREATE INDEX idx_reporte_productos_reporte_fecha ON reporte_productos(reporte_id, fecha);

-- Recrear foreign keys
-- NOTA: No podemos crear FK a reportes(id) porque la PK ahora es (id, fecha)
-- El índice idx_reportes_id ya fue creado arriba para mantener rendimiento

-- FK a productos_catalogo (no particionada, funciona normal)
ALTER TABLE reporte_productos ADD CONSTRAINT fk_reporte_productos_producto 
    FOREIGN KEY (producto_id) REFERENCES productos_catalogo(id);

COMMENT ON TABLE reporte_productos IS 'Tabla particionada de productos de reportes por año. PK compuesta (id, fecha) requerida por particionamiento.';
COMMENT ON COLUMN reporte_productos.fecha IS 'Fecha del reporte (desnormalizada para particionamiento). Se mantiene sincronizada con reportes.fecha mediante trigger.';
COMMENT ON COLUMN reporte_productos.id IS 'UUID único del producto de reporte (parte de la PK compuesta)';

-- =====================================================
-- PASO 3: Crear tabla particionada para REPORTES_AUDITORIA
-- =====================================================

-- Verificar si la tabla existe antes de renombrarla
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reportes_auditoria') THEN
        ALTER TABLE reportes_auditoria RENAME TO reportes_auditoria_old;
        RAISE NOTICE 'Tabla reportes_auditoria renombrada a reportes_auditoria_old';
    ELSE
        RAISE NOTICE 'Tabla reportes_auditoria no existe, creando desde cero';
    END IF;
END $$;

-- Crear tabla particionada
CREATE TABLE reportes_auditoria (
    id UUID DEFAULT gen_random_uuid(),
    reporte_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    accion VARCHAR(50) NOT NULL,
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    descripcion TEXT,
    fecha_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, fecha_cambio)
) PARTITION BY RANGE (fecha_cambio);

-- Crear particiones por año
CREATE TABLE reportes_auditoria_2024 PARTITION OF reportes_auditoria
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE reportes_auditoria_2025 PARTITION OF reportes_auditoria
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE reportes_auditoria_2026 PARTITION OF reportes_auditoria
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE reportes_auditoria_2027 PARTITION OF reportes_auditoria
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE reportes_auditoria_default PARTITION OF reportes_auditoria DEFAULT;

-- Migrar datos (si existen, especificando columnas explícitamente)
DO $$
DECLARE
    column_exists BOOLEAN;
    rows_migrated INTEGER := 0;
BEGIN
    -- Verificar si la tabla old existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reportes_auditoria_old') THEN
        -- Verificar si tiene la columna created_at
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reportes_auditoria_old' 
            AND column_name = 'created_at'
        ) INTO column_exists;
        
        IF column_exists THEN
            -- Migrar con created_at
            INSERT INTO reportes_auditoria (
                id, reporte_id, usuario_id, accion, campo_modificado,
                valor_anterior, valor_nuevo, descripcion, fecha_cambio, created_at
            )
            SELECT 
                id, reporte_id, usuario_id, accion, campo_modificado,
                valor_anterior, valor_nuevo, descripcion, fecha_cambio, created_at
            FROM reportes_auditoria_old;
        ELSE
            -- Migrar sin created_at (usar valor por defecto)
            INSERT INTO reportes_auditoria (
                id, reporte_id, usuario_id, accion, campo_modificado,
                valor_anterior, valor_nuevo, descripcion, fecha_cambio
            )
            SELECT 
                id, reporte_id, usuario_id, accion, campo_modificado,
                valor_anterior, valor_nuevo, descripcion, fecha_cambio
            FROM reportes_auditoria_old;
        END IF;
        
        GET DIAGNOSTICS rows_migrated = ROW_COUNT;
        RAISE NOTICE 'Datos de reportes_auditoria migrados: % registros', rows_migrated;
    ELSE
        RAISE NOTICE 'Tabla reportes_auditoria_old no existe (tabla nueva), saltando migración de datos';
    END IF;
END $$;

-- Recrear índices (eliminar primero por si acaso)
DROP INDEX IF EXISTS idx_reportes_auditoria_reporte_id;
DROP INDEX IF EXISTS idx_reportes_auditoria_usuario_id;
DROP INDEX IF EXISTS idx_reportes_auditoria_fecha_cambio;
DROP INDEX IF EXISTS idx_reportes_auditoria_accion;
DROP INDEX IF EXISTS idx_reportes_auditoria_reporte_lookup;

CREATE INDEX idx_reportes_auditoria_reporte_id ON reportes_auditoria(reporte_id);
CREATE INDEX idx_reportes_auditoria_usuario_id ON reportes_auditoria(usuario_id);
CREATE INDEX idx_reportes_auditoria_fecha_cambio ON reportes_auditoria(fecha_cambio);
CREATE INDEX idx_reportes_auditoria_accion ON reportes_auditoria(accion);

-- Recrear foreign keys
-- NOTA: No podemos crear FK a reportes(id) porque la PK ahora es (id, fecha)
-- Mantenemos integridad referencial a nivel de aplicación
-- El índice idx_reportes_auditoria_reporte_id ya fue creado arriba

-- FK a users (funciona normal)
ALTER TABLE reportes_auditoria ADD CONSTRAINT fk_reportes_auditoria_usuario 
    FOREIGN KEY (usuario_id) REFERENCES users(id);

COMMENT ON TABLE reportes_auditoria IS 'Tabla particionada de auditoría de reportes por año';

-- =====================================================
-- PASO 4: Eliminar tablas antiguas
-- =====================================================

DO $$
BEGIN
    -- Eliminar tablas antiguas si existen
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reportes_old') THEN
        DROP TABLE reportes_old CASCADE;
        RAISE NOTICE 'Tabla reportes_old eliminada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reporte_productos_old') THEN
        DROP TABLE reporte_productos_old CASCADE;
        RAISE NOTICE 'Tabla reporte_productos_old eliminada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reportes_auditoria_old') THEN
        DROP TABLE reportes_auditoria_old CASCADE;
        RAISE NOTICE 'Tabla reportes_auditoria_old eliminada';
    END IF;
END $$;

-- =====================================================
-- PASO 5: Crear función para crear particiones automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION create_partition_for_year(
    table_name TEXT,
    year INTEGER
) RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || year::TEXT;
    start_date := (year || '-01-01')::DATE;
    end_date := ((year + 1) || '-01-01')::DATE;
    
    -- Verificar si la partición ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            table_name,
            start_date,
            end_date
        );
        RAISE NOTICE 'Partición % creada exitosamente', partition_name;
    ELSE
        RAISE NOTICE 'La partición % ya existe', partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_partition_for_year IS 'Crea una partición para un año específico en una tabla particionada';

-- =====================================================
-- PASO 6: Crear función para mantenimiento automático
-- =====================================================

CREATE OR REPLACE FUNCTION create_partitions_for_next_year() RETURNS VOID AS $$
DECLARE
    next_year INTEGER;
BEGIN
    next_year := EXTRACT(YEAR FROM CURRENT_DATE) + 1;
    
    -- Crear particiones para el próximo año
    PERFORM create_partition_for_year('reportes', next_year);
    PERFORM create_partition_for_year('reporte_productos', next_year);
    PERFORM create_partition_for_year('reportes_auditoria', next_year);
    
    RAISE NOTICE 'Particiones para el año % creadas', next_year;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_partitions_for_next_year IS 'Crea particiones para el próximo año en todas las tablas particionadas';

-- =====================================================
-- PASO 7: Actualizar trigger para mantener fecha sincronizada
-- =====================================================

-- Trigger para actualizar la fecha en reporte_productos cuando cambia en reportes
CREATE OR REPLACE FUNCTION sync_reporte_productos_fecha() RETURNS TRIGGER AS $$
BEGIN
    -- Si la fecha cambió, actualizar en reporte_productos
    IF TG_OP = 'UPDATE' AND OLD.fecha <> NEW.fecha THEN
        UPDATE reporte_productos
        SET fecha = NEW.fecha
        WHERE reporte_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_reporte_productos_fecha
AFTER UPDATE ON reportes
FOR EACH ROW
EXECUTE FUNCTION sync_reporte_productos_fecha();

COMMENT ON FUNCTION sync_reporte_productos_fecha IS 'Mantiene sincronizada la columna fecha entre reportes y reporte_productos';

-- =====================================================
-- INFORMACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    reportes_count INTEGER;
    productos_count INTEGER;
    auditoria_count INTEGER;
BEGIN
    -- Contar registros migrados
    SELECT COUNT(*) INTO reportes_count FROM reportes;
    SELECT COUNT(*) INTO productos_count FROM reporte_productos;
    SELECT COUNT(*) INTO auditoria_count FROM reportes_auditoria;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Registros migrados:';
    RAISE NOTICE '  - reportes: % registros', reportes_count;
    RAISE NOTICE '  - reporte_productos: % registros', productos_count;
    RAISE NOTICE '  - reportes_auditoria: % registros', auditoria_count;
    RAISE NOTICE '';
    RAISE NOTICE '📦 Particiones creadas por tabla:';
    RAISE NOTICE '  - reportes: 2024, 2025, 2026, 2027, default';
    RAISE NOTICE '  - reporte_productos: 2024, 2025, 2026, 2027, default';
    RAISE NOTICE '  - reportes_auditoria: 2024, 2025, 2026, 2027, default';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Funciones de mantenimiento creadas:';
    RAISE NOTICE '  - create_partition_for_year(tabla, año)';
    RAISE NOTICE '  - create_partitions_for_next_year()';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Uso:';
    RAISE NOTICE '  SELECT create_partition_for_year(''reportes'', 2028);';
    RAISE NOTICE '  SELECT create_partitions_for_next_year();';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Nota: Las FK a reportes.id fueron reemplazadas por índices';
    RAISE NOTICE '    debido a limitaciones de PostgreSQL con PKs compuestas.';
    RAISE NOTICE '';
END $$;

COMMIT;
