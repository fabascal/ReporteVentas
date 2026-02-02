# 📊 Guía de Particionamiento de Tablas

## Descripción

Esta migración convierte las tablas `reportes`, `reporte_productos` y `reportes_auditoria` en tablas particionadas por año. El particionamiento mejora significativamente el rendimiento de consultas cuando se trabaja con grandes volúmenes de datos históricos.

## Beneficios

✅ **Mejor rendimiento en consultas**: Las consultas filtradas por fecha solo escanean las particiones relevantes  
✅ **Mantenimiento más fácil**: Puedes eliminar años completos de datos con un simple DROP TABLE  
✅ **Escalabilidad**: Cada año se puede almacenar en diferentes tablespaces si es necesario  
✅ **Organización lógica**: Los datos están organizados automáticamente por año

## Cambios Principales

### 1. Tabla `reportes`
- Particionada por columna `fecha` (tipo DATE)
- **PRIMARY KEY**: Compuesta `(id, fecha)` - requerido por PostgreSQL para tablas particionadas
- UNIQUE constraint: `(estacion_id, fecha)`
- Particiones creadas: 2024, 2025, 2026, 2027, default

### 2. Tabla `reporte_productos`
- **NUEVO**: Columna `fecha` agregada (desnormalizada del reporte padre)
- Particionada por columna `fecha` (tipo DATE)
- **PRIMARY KEY**: Compuesta `(id, fecha)` - requerido por PostgreSQL para tablas particionadas
- UNIQUE constraint: `(reporte_id, producto_id, fecha)`
- Particiones creadas: 2024, 2025, 2026, 2027, default
- **Trigger**: Mantiene la fecha sincronizada automáticamente

### 3. Tabla `reportes_auditoria`
- Particionada por columna `fecha_cambio` (tipo TIMESTAMP)
- **PRIMARY KEY**: Compuesta `(id, fecha_cambio)` - requerido por PostgreSQL para tablas particionadas
- Particiones creadas: 2024, 2025, 2026, 2027, default

## Prerequisitos

- ✅ PostgreSQL 10 o superior (el particionamiento nativo)
- ✅ Backup de la base de datos (recomendado)
- ✅ Acceso de administrador a PostgreSQL
- ✅ Detener temporalmente la aplicación durante la migración

## Instrucciones de Migración

### Opción 1: Script Automático (Recomendado)

```bash
cd /home/webops/ReporteVentas/server/migrations
chmod +x run_partition_migration.sh
./run_partition_migration.sh
```

El script automáticamente:
1. Ofrece crear un backup
2. Detiene la aplicación
3. Ejecuta la migración
4. Verifica los resultados
5. Reinicia la aplicación

### Opción 2: Manual

```bash
# 1. Crear backup
pg_dump -U webops -d repvtas > backup_$(date +%Y%m%d).sql

# 2. Detener servicios
pm2 stop repvtas-backend

# 3. Ejecutar migración
psql -U webops -d repvtas -f 009_partition_tables.sql

# 4. Verificar
psql -U webops -d repvtas -f 009_partition_tables_verify.sql

# 5. Reiniciar servicios
pm2 restart all
```

## Verificación Post-Migración

```sql
-- Ver todas las particiones creadas
SELECT 
    parent.relname AS tabla_padre,
    child.relname AS nombre_particion,
    pg_get_expr(child.relpartbound, child.oid) AS rango_particion
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname IN ('reportes', 'reporte_productos', 'reportes_auditoria')
ORDER BY parent.relname, child.relname;

-- Contar registros por partición
SELECT 
    tableoid::regclass AS particion,
    COUNT(*) as total_registros
FROM reportes
GROUP BY tableoid;
```

## Mantenimiento Anual

### Crear Particiones para el Próximo Año

Ejecuta esto **antes del 1 de enero** de cada año:

```sql
-- Opción 1: Crear todas las particiones del próximo año
SELECT create_partitions_for_next_year();

-- Opción 2: Crear partición específica
SELECT create_partition_for_year('reportes', 2028);
SELECT create_partition_for_year('reporte_productos', 2028);
SELECT create_partition_for_year('reportes_auditoria', 2028);
```

### Eliminar Datos Antiguos

Para eliminar un año completo de datos (por ejemplo, año 2024):

```sql
-- ⚠️ CUIDADO: Esta operación es irreversible
DROP TABLE reportes_2024;
DROP TABLE reporte_productos_2024;
DROP TABLE reportes_auditoria_2024;
```

## Consultas Optimizadas

### ✅ Buenas (Usan el particionamiento)

```sql
-- Filtro por fecha específica
SELECT * FROM reportes WHERE fecha = '2025-11-01';

-- Filtro por rango de fechas
SELECT * FROM reportes WHERE fecha BETWEEN '2025-01-01' AND '2025-12-31';

-- Filtro por año
SELECT * FROM reportes WHERE EXTRACT(YEAR FROM fecha) = 2025;
```

### ❌ Evitar (Escanean todas las particiones)

```sql
-- Sin filtro de fecha
SELECT * FROM reportes WHERE estacion_id = 'xxx';

-- Usa CAST que impide usar el índice
SELECT * FROM reportes WHERE fecha::text LIKE '2025%';
```

## Monitoreo de Rendimiento

```sql
-- Ver tamaño de cada partición
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamaño
FROM pg_tables
WHERE tablename LIKE 'reportes%' OR tablename LIKE 'reporte_productos%'
ORDER BY tablename;

-- Ver uso de particiones en consultas (requiere pg_stat_statements)
SELECT 
    query,
    calls,
    total_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%reportes%'
ORDER BY total_time DESC
LIMIT 10;
```

## Troubleshooting

### Problema: Error "no partition of relation ... found for row"

**Solución**: Crea la partición para el año necesario:
```sql
SELECT create_partition_for_year('reportes', 2029);
```

### Problema: Fechas desincronizadas entre reportes y reporte_productos

**Solución**: El trigger se encarga automáticamente, pero si necesitas sincronizar manualmente:
```sql
UPDATE reporte_productos rp
SET fecha = r.fecha
FROM reportes r
WHERE rp.reporte_id = r.id AND rp.fecha <> r.fecha;
```

### Problema: Rendimiento no mejoró

**Verifica**:
1. Las consultas incluyen filtro por fecha
2. Los índices existen en todas las particiones
3. Las estadísticas están actualizadas:
```sql
ANALYZE reportes;
ANALYZE reporte_productos;
ANALYZE reportes_auditoria;
```

## Rollback (Revertir Migración)

Si necesitas revertir la migración:

```bash
# 1. Detener servicios
pm2 stop all

# 2. Restaurar backup
psql -U webops -d repvtas < backup_YYYYMMDD.sql

# 3. Reiniciar servicios
pm2 restart all
```

## Notas Importantes

⚠️ **Claves Primarias Compuestas**: PostgreSQL requiere que las PRIMARY KEY en tablas particionadas incluyan la columna de particionamiento. Por eso las claves primarias ahora son `(id, fecha)` en lugar de solo `id`. **Esto no afecta el funcionamiento de la aplicación** porque el backend siempre usa `id` para buscar registros, y `id` sigue siendo único.

⚠️ **Columna `fecha` en `reporte_productos`**: Esta es una desnormalización necesaria para el particionamiento. Se mantiene automáticamente sincronizada mediante un trigger.

⚠️ **Partición DEFAULT**: Captura cualquier fecha fuera de los rangos definidos. Monitorea esta partición y crea particiones específicas según sea necesario.

⚠️ **Compatibilidad del Backend**: El código del backend ya está actualizado para incluir la columna `fecha` al insertar en `reporte_productos`. No se requieren cambios adicionales en el código.

⚠️ **Foreign Keys en Tablas Particionadas**: PostgreSQL tiene limitaciones con foreign keys en tablas particionadas. No se puede crear una FK que referencie solo `reportes(id)` porque la PRIMARY KEY es `(id, fecha)`. 
- **Solución**: Se mantiene integridad referencial a nivel de aplicación
- **Índices**: Se crean índices en `reportes(id)` para mantener rendimiento
- **Impacto**: La aplicación funciona igual, pero se pierde validación automática de FK a nivel de base de datos

⚠️ **Backups**: Con tablas particionadas, puedes hacer backups selectivos por año:
```bash
pg_dump -U webops -d repvtas -t reportes_2025 > reportes_2025.sql
```

## Referencias

- [PostgreSQL Partitioning Documentation](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Table Partitioning Best Practices](https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITIONING-DECLARATIVE-BEST-PRACTICES)

## Soporte

Para preguntas o problemas:
1. Revisa los logs: `pm2 logs repvtas-backend`
2. Verifica el estado: `psql -U webops -d repvtas -f 009_partition_tables_verify.sql`
3. Consulta la documentación de PostgreSQL

---

**Última actualización**: Enero 2026  
**Versión de migración**: 009
