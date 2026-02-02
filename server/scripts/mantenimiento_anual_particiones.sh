#!/bin/bash
# ========================================
# Script de Mantenimiento Anual de Particiones
# Ejecutar: Cada 1 de diciembre a las 00:00
# ========================================

# Configuración
DB_HOST="localhost"
DB_USER="webops"
DB_NAME="repvtas"
DB_PORT="5432"
LOG_DIR="/home/webops/ReporteVentas/logs"
LOG_FILE="$LOG_DIR/particiones_$(date +%Y%m%d_%H%M%S).log"
SCRIPT_DIR="/home/webops/ReporteVentas/server/migrations"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
}

# Inicio
log "=========================================="
log "MANTENIMIENTO ANUAL DE PARTICIONES"
log "=========================================="

# Verificar que existe el directorio de logs
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    log_success "Directorio de logs creado: $LOG_DIR"
fi

# Verificar conexión a la base de datos
log "Verificando conexión a PostgreSQL..."
if PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    log_success "Conexión a PostgreSQL exitosa"
else
    log_error "No se pudo conectar a PostgreSQL"
    exit 1
fi

# Ejecutar script de creación de particiones
log "Ejecutando script de creación de particiones..."
if PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/crear_particiones_futuras.sql" >> "$LOG_FILE" 2>&1; then
    log_success "Particiones creadas exitosamente"
else
    log_error "Error al crear particiones"
    exit 1
fi

# Verificar tamaños de particiones
log "Verificando tamaños de particiones..."
PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'GASTOS' as tipo,
    COUNT(*) as total_particiones,
    pg_size_pretty(SUM(pg_total_relation_size('public.' || tablename))) as tamaño_total
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'gastos_%'
UNION ALL
SELECT 
    'ENTREGAS' as tipo,
    COUNT(*) as total_particiones,
    pg_size_pretty(SUM(pg_total_relation_size('public.' || tablename))) as tamaño_total
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'entregas_%'
UNION ALL
SELECT 
    'LIQUIDACIONES' as tipo,
    COUNT(*) as total_particiones,
    pg_size_pretty(SUM(pg_total_relation_size('public.' || tablename))) as tamaño_total
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'liquidaciones_mensuales_%'
UNION ALL
SELECT 
    'REPORTES' as tipo,
    COUNT(*) as total_particiones,
    pg_size_pretty(SUM(pg_total_relation_size('public.' || tablename))) as tamaño_total
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'reportes_%' AND tablename NOT LIKE '%mensuales%'
UNION ALL
SELECT 
    'REPORTES_MENSUALES' as tipo,
    COUNT(*) as total_particiones,
    pg_size_pretty(SUM(pg_total_relation_size('public.' || tablename))) as tamaño_total
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'reportes_mensuales_%';
" >> "$LOG_FILE" 2>&1

log_success "Reporte de tamaños generado"

# Actualizar estadísticas
log "Actualizando estadísticas de la base de datos..."
if PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
    ANALYZE gastos;
    ANALYZE entregas;
    ANALYZE liquidaciones_mensuales;
    ANALYZE reportes;
    ANALYZE reporte_productos;
    ANALYZE reportes_mensuales;
" >> "$LOG_FILE" 2>&1; then
    log_success "Estadísticas actualizadas"
else
    log_warning "Error al actualizar estadísticas (no crítico)"
fi

# Limpiar logs antiguos (más de 1 año)
log "Limpiando logs antiguos..."
find "$LOG_DIR" -name "particiones_*.log" -type f -mtime +365 -delete
log_success "Logs antiguos eliminados"

# Resumen final
log "=========================================="
log "MANTENIMIENTO COMPLETADO EXITOSAMENTE"
log "=========================================="
log "Log guardado en: $LOG_FILE"

# Enviar notificación (opcional - descomentar si se configura email)
# echo "Mantenimiento de particiones completado. Ver log: $LOG_FILE" | mail -s "Mantenimiento DB - Particiones" admin@example.com

exit 0
