-- Script para limpiar datos transaccionales manteniendo catálogos
-- Ejecutar con: psql -U postgres -d repvtas < limpiar_datos_transaccionales.sql

\echo '=== Iniciando limpieza de datos transaccionales ==='

-- 1. Limpiar logs de auditoría
\echo '1. Limpiando logs de auditoría...'
TRUNCATE TABLE sistema_auditoria CASCADE;
TRUNCATE TABLE reportes_auditoria CASCADE;

-- 2. Limpiar reportes mensuales
\echo '2. Limpiando reportes mensuales...'
TRUNCATE TABLE reportes_mensuales CASCADE;

-- 3. Limpiar cierres de períodos
\echo '3. Limpiando cierres de períodos...'
TRUNCATE TABLE zonas_periodos_cierre CASCADE;

-- 4. Limpiar gastos
\echo '4. Limpiando gastos...'
TRUNCATE TABLE gastos CASCADE;

-- 5. Limpiar entregas
\echo '5. Limpiando entregas...'
TRUNCATE TABLE entregas CASCADE;

-- 6. Limpiar productos de reportes (primero, por relaciones)
\echo '6. Limpiando productos de reportes...'
TRUNCATE TABLE reporte_productos CASCADE;

-- 7. Limpiar reportes
\echo '7. Limpiando reportes...'
TRUNCATE TABLE reportes CASCADE;

-- 8. Resetear secuencias si existen (para IDs autoincrementales)
\echo '8. Reseteando secuencias...'
-- Nota: Si usas UUIDs no es necesario, pero por si acaso

-- 9. Verificar conteos
\echo '9. Verificando conteos finales...'
\echo 'Reportes restantes:'
SELECT COUNT(*) as reportes FROM reportes;

\echo 'Productos de reportes restantes:'
SELECT COUNT(*) as reporte_productos FROM reporte_productos;

\echo 'Reportes mensuales restantes:'
SELECT COUNT(*) as reportes_mensuales FROM reportes_mensuales;

\echo 'Gastos restantes:'
SELECT COUNT(*) as gastos FROM gastos;

\echo 'Entregas restantes:'
SELECT COUNT(*) as entregas FROM entregas;

\echo 'Cierres de períodos restantes:'
SELECT COUNT(*) as cierres FROM zonas_periodos_cierre;

\echo 'Logs de auditoría de reportes restantes:'
SELECT COUNT(*) as reportes_auditoria FROM reportes_auditoria;

\echo 'Logs de auditoría del sistema restantes:'
SELECT COUNT(*) as sistema_auditoria FROM sistema_auditoria;

\echo ''
\echo '=== Verificando catálogos (NO deben estar vacíos) ==='
\echo 'Usuarios:'
SELECT COUNT(*) as usuarios FROM users;

\echo 'Estaciones:'
SELECT COUNT(*) as estaciones FROM estaciones;

\echo 'Zonas:'
SELECT COUNT(*) as zonas FROM zonas;

\echo 'Períodos mensuales:'
SELECT COUNT(*) as periodos FROM periodos_mensuales;

\echo 'Productos catálogo:'
SELECT COUNT(*) as productos FROM productos_catalogo;

\echo ''
\echo '=== Limpieza completada exitosamente ==='
