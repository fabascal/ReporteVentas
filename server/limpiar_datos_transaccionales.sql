-- Script para limpiar datos transaccionales manteniendo catálogos
-- Ejecutar con: psql -d repvtas < limpiar_datos_transaccionales.sql

\echo '=== Iniciando limpieza de datos transaccionales ==='

-- 1. Limpiar logs de auditoría
\echo '1. Limpiando logs de auditoría...'
TRUNCATE TABLE sistema_auditoria CASCADE;
TRUNCATE TABLE reportes_auditoria CASCADE;

-- 2. Limpiar reportes mensuales (agregados)
\echo '2. Limpiando reportes mensuales agregados...'
TRUNCATE TABLE reportes_mensuales CASCADE;

-- 3. Limpiar cierres de períodos
\echo '3. Limpiando cierres de períodos...'
TRUNCATE TABLE zonas_periodos_cierre CASCADE;

-- 4. Limpiar liquidaciones mensuales
\echo '4. Limpiando liquidaciones mensuales...'
TRUNCATE TABLE liquidaciones_mensuales CASCADE;

-- 5. Limpiar gastos
\echo '5. Limpiando gastos...'
TRUNCATE TABLE gastos CASCADE;

-- 6. Limpiar entregas
\echo '6. Limpiando entregas...'
TRUNCATE TABLE entregas CASCADE;

-- 7. Limpiar productos de reportes (primero, por relaciones)
\echo '7. Limpiando productos de reportes...'
TRUNCATE TABLE reporte_productos CASCADE;

-- 8. Limpiar reportes
\echo '8. Limpiando reportes...'
TRUNCATE TABLE reportes CASCADE;

-- 9. Verificar conteos
\echo ''
\echo '=== Verificando conteos finales (deben estar en 0) ==='
\echo 'Reportes:'
SELECT COUNT(*) as reportes FROM reportes;

\echo 'Productos de reportes:'
SELECT COUNT(*) as reporte_productos FROM reporte_productos;

\echo 'Reportes mensuales:'
SELECT COUNT(*) as reportes_mensuales FROM reportes_mensuales;

\echo 'Gastos:'
SELECT COUNT(*) as gastos FROM gastos;

\echo 'Entregas:'
SELECT COUNT(*) as entregas FROM entregas;

\echo 'Cierres de períodos:'
SELECT COUNT(*) as cierres FROM zonas_periodos_cierre;

\echo 'Liquidaciones mensuales:'
SELECT COUNT(*) as liquidaciones FROM liquidaciones_mensuales;

\echo 'Logs de auditoría de reportes:'
SELECT COUNT(*) as reportes_auditoria FROM reportes_auditoria;

\echo 'Logs de auditoría del sistema:'
SELECT COUNT(*) as sistema_auditoria FROM sistema_auditoria;

\echo ''
\echo '=== Verificando catálogos (NO deben estar vacíos) ==='
\echo 'Usuarios:'
SELECT COUNT(*) as usuarios FROM users;

\echo 'Estaciones:'
SELECT COUNT(*) as estaciones FROM estaciones;

\echo 'Zonas:'
SELECT COUNT(*) as zonas FROM zonas;

\echo 'Ejercicios fiscales:'
SELECT anio, nombre, estado FROM ejercicios_fiscales ORDER BY anio DESC;

\echo 'Productos catálogo:'
SELECT COUNT(*) as productos FROM productos_catalogo;

\echo 'Roles:'
SELECT COUNT(*) as roles FROM roles;

\echo 'Menús:'
SELECT COUNT(*) as menus FROM menus;

\echo ''
\echo '=== Limpieza completada exitosamente ==='
\echo 'Los catálogos de configuración se mantuvieron intactos'
\echo 'Todos los datos transaccionales fueron eliminados'
