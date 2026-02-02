# 📊 Sistema de Particionamiento de Tablas

## 🎯 Objetivo
Las tablas principales del sistema están particionadas por **fecha** para optimizar el rendimiento de consultas y facilitar el mantenimiento de datos históricos.

---

## 📋 Tablas Particionadas

### 1. **`gastos`** (RANGE por `fecha`)
```sql
Partition key: RANGE (fecha)
Particiones actuales: 2024-2030 (7 particiones)
```

**Estructura:**
- `gastos_2024` → 2024-01-01 a 2024-12-31
- `gastos_2025` → 2025-01-01 a 2025-12-31
- `gastos_2026` → 2026-01-01 a 2026-12-31
- ... hasta 2030

**Índices por partición:**
- PRIMARY KEY (id, fecha)
- `idx_gastos_estacion_fecha` (estacion_id, fecha)
- `idx_gastos_zona_fecha` (zona_id, fecha)
- `idx_gastos_tipo` (tipo_gasto, fecha)
- `idx_gastos_categoria` (categoria, fecha)

---

### 2. **`entregas`** (RANGE por `fecha`)
```sql
Partition key: RANGE (fecha)
Particiones actuales: 2024-2030 (7 particiones)
```

**Estructura:**
- `entregas_2024` → 2024-01-01 a 2024-12-31
- `entregas_2025` → 2025-01-01 a 2025-12-31
- `entregas_2026` → 2026-01-01 a 2026-12-31
- ... hasta 2030

**Índices por partición:**
- PRIMARY KEY (id, fecha)
- `idx_entregas_estacion_fecha` (estacion_id, fecha)
- `idx_entregas_zona_fecha` (zona_id, fecha)
- `idx_entregas_zona_origen_fecha` (zona_origen_id, fecha)
- `idx_entregas_tipo` (tipo_entrega, fecha)

---

### 3. **`liquidaciones_mensuales`** (RANGE por `anio`)
```sql
Partition key: RANGE (anio)
Particiones actuales: 2024-2028 (5 particiones)
```

**Estructura:**
- `liquidaciones_mensuales_2024` → anio = 2024
- `liquidaciones_mensuales_2025` → anio = 2025
- `liquidaciones_mensuales_2026` → anio = 2026
- ... hasta 2028

**Índices por partición:**
- PRIMARY KEY (id, anio)
- `idx_liquidaciones_estacion_periodo` UNIQUE (estacion_id, anio, mes)
- `idx_liquidaciones_zona_periodo` UNIQUE (zona_id, anio, mes)
- `idx_liquidaciones_estado` (estado)
- `idx_liquidaciones_fecha` (fecha_cierre)

---

### 4. **`reportes`** (RANGE por `fecha`)
```sql
Partition key: RANGE (fecha)
Particiones: Por año
```

**Índices por partición:**
- PRIMARY KEY (id, fecha)
- `idx_reportes_estacion` (estacion_id)
- `idx_reportes_creado_por` (creado_por)

---

### 5. **`reporte_productos`** (RANGE por `fecha`)
```sql
Partition key: RANGE (fecha)
Particiones actuales: 5 particiones
```

**Índices por partición:**
- PRIMARY KEY (id, fecha)
- Hereda la partición del reporte padre

---

## 🔧 Mantenimiento Anual

### ⏰ Cuándo Crear Nuevas Particiones
**Recomendado:** Antes del 15 de diciembre de cada año, crear las particiones para el año siguiente.

### 📝 Script de Creación Manual

```sql
-- ========================================
-- CREAR PARTICIONES PARA AÑO 2031
-- ========================================

BEGIN;

-- 1. Gastos
CREATE TABLE IF NOT EXISTS gastos_2031 PARTITION OF gastos
    FOR VALUES FROM ('2031-01-01') TO ('2032-01-01');

-- 2. Entregas
CREATE TABLE IF NOT EXISTS entregas_2031 PARTITION OF entregas
    FOR VALUES FROM ('2031-01-01') TO ('2032-01-01');

-- 3. Liquidaciones Mensuales
CREATE TABLE IF NOT EXISTS liquidaciones_mensuales_2031 PARTITION OF liquidaciones_mensuales
    FOR VALUES FROM (2031) TO (2032);

-- 4. Reportes (si aplica)
CREATE TABLE IF NOT EXISTS reportes_2031 PARTITION OF reportes
    FOR VALUES FROM ('2031-01-01') TO ('2032-01-01');

-- 5. Reporte Productos (si aplica)
CREATE TABLE IF NOT EXISTS reporte_productos_2031 PARTITION OF reporte_productos
    FOR VALUES FROM ('2031-01-01') TO ('2032-01-01');

COMMIT;
```

---

## 🚀 Verificar Particiones

### Ver todas las particiones de una tabla:
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename LIKE 'gastos_%'
ORDER BY tablename;
```

### Verificar rangos de particiones:
```sql
SELECT 
    pt.relname AS partition_name,
    pg_get_expr(pt.relpartbound, pt.oid, true) AS partition_expression
FROM pg_class base
JOIN pg_inherits i ON i.inhparent = base.oid
JOIN pg_class pt ON pt.oid = i.inhrelid
WHERE base.relname = 'gastos'
ORDER BY pt.relname;
```

### Verificar índices por partición:
```sql
SELECT 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename LIKE 'gastos_2026'
ORDER BY indexname;
```

---

## 📊 Beneficios del Particionamiento

### 1. **Rendimiento de Consultas**
- Las consultas filtradas por fecha solo escanean las particiones relevantes
- Ejemplo: Consultar enero 2026 solo lee `gastos_2026`

### 2. **Mantenimiento Simplificado**
- Eliminar datos antiguos es tan simple como `DROP TABLE gastos_2020`
- No requiere `DELETE` masivo que bloquea la tabla

### 3. **Respaldos Incrementales**
- Se puede respaldar solo las particiones recientes
- Particiones antiguas pueden ser respaldadas con menor frecuencia

### 4. **Escalabilidad**
- Cada partición puede tener diferentes configuraciones de almacenamiento
- Datos antiguos pueden moverse a almacenamiento más lento

---

## ⚠️ Consideraciones Importantes

### 1. **Clave Primaria**
- Siempre debe incluir la columna de particionamiento
- Ejemplo: `PRIMARY KEY (id, fecha)` en lugar de solo `id`

### 2. **Foreign Keys**
- Las restricciones de clave foránea deben incluir la columna de particionamiento
- Ejemplo: `FOREIGN KEY (reporte_id, fecha)`

### 3. **Consultas Sin Filtro de Fecha**
- Consultas sin filtro de fecha escanean **todas** las particiones
- Siempre incluir filtro de fecha cuando sea posible

### 4. **Inserciones**
- Si se intenta insertar una fecha fuera de los rangos, la operación falla
- Por eso es crítico crear particiones anticipadamente

---

## 📈 Monitoreo

### Tamaño de Particiones:
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    (SELECT COUNT(*) FROM gastos WHERE fecha >= '2026-01-01' AND fecha < '2027-01-01') as row_count
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'gastos_2026';
```

### Consultas por Partición:
```sql
-- Ver estadísticas de uso de índices por partición
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND tablename LIKE 'gastos_%'
ORDER BY idx_scan DESC;
```

---

## 🔄 Migración de Datos Antiguos

Si necesitas mover datos de una tabla sin particionar a una particionada:

```sql
-- 1. Crear tabla temporal con estructura particionada
CREATE TABLE gastos_new (LIKE gastos INCLUDING ALL) PARTITION BY RANGE (fecha);

-- 2. Crear particiones
CREATE TABLE gastos_new_2024 PARTITION OF gastos_new
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
-- ... más particiones

-- 3. Copiar datos
INSERT INTO gastos_new SELECT * FROM gastos;

-- 4. Renombrar tablas (en transacción)
BEGIN;
ALTER TABLE gastos RENAME TO gastos_old;
ALTER TABLE gastos_new RENAME TO gastos;
COMMIT;

-- 5. Verificar y eliminar tabla antigua
DROP TABLE gastos_old;
```

---

## 📅 Calendario de Mantenimiento

| Tarea | Frecuencia | Período Recomendado |
|-------|-----------|---------------------|
| Crear particiones nuevas | Anual | 1-15 diciembre |
| Verificar tamaño particiones | Trimestral | Fin de cada trimestre |
| Archivar particiones antiguas | Anual | Enero (datos >5 años) |
| Revisar índices | Semestral | Junio y diciembre |
| Analizar estadísticas | Mensual | Primer día del mes |

---

## 🛠️ Troubleshooting

### Error: "no partition of relation ... found for row"
**Causa:** Intentando insertar una fecha sin partición correspondiente  
**Solución:** Crear la partición para ese año antes de insertar

### Consultas lentas en particiones
**Causa:** Estadísticas desactualizadas  
**Solución:**
```sql
ANALYZE gastos;
ANALYZE entregas;
ANALYZE liquidaciones_mensuales;
```

### Partición demasiado grande
**Causa:** Acumulación de datos en una partición  
**Solución:** Considerar sub-particionamiento mensual para años muy activos

---

## 📚 Referencias

- [PostgreSQL Partitioning Documentation](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Best Practices for Table Partitioning](https://wiki.postgresql.org/wiki/Table_partitioning)

---

**Última actualización:** 2 de febrero de 2026  
**Versión:** 1.0  
**Mantenido por:** Equipo de Desarrollo
