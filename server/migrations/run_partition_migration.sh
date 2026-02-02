#!/bin/bash

# =====================================================
# Script para ejecutar la migración de particionamiento
# =====================================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}  MIGRACIÓN: Particionamiento de Tablas${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""

# Configuración de la base de datos
DB_NAME="repvtas"
DB_USER="webops"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${YELLOW}⚠️  ADVERTENCIA:${NC} Esta migración realizará cambios importantes en la base de datos:"
echo "  - Renombrará las tablas existentes"
echo "  - Creará nuevas tablas particionadas"
echo "  - Migrará todos los datos"
echo "  - Eliminará las tablas antiguas"
echo ""
echo -e "${YELLOW}📦 Se recomienda hacer un backup antes de continuar.${NC}"
echo ""
read -p "¿Deseas crear un backup automático antes de continuar? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]
then
    BACKUP_FILE="backup_pre_partition_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${GREEN}Creando backup...${NC}"
    pg_dump -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME > "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup creado: $BACKUP_FILE${NC}"
    echo ""
fi

echo -e "${YELLOW}⏸️  Detener servicios de aplicación...${NC}"
pm2 stop repvtas-backend 2>/dev/null || echo "Backend no estaba corriendo"
echo ""

read -p "¿Continuar con la migración? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo -e "${RED}❌ Migración cancelada${NC}"
    pm2 start repvtas-backend 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}🚀 Ejecutando migración...${NC}"
echo ""

# Ejecutar la migración
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f 009_partition_tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migración completada exitosamente!${NC}"
    echo ""
    echo -e "${GREEN}📊 Ejecutando verificación...${NC}"
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f 009_partition_tables_verify.sql
    
    echo ""
    echo -e "${GREEN}🔄 Reiniciando servicios...${NC}"
    pm2 restart all
    
    echo ""
    echo -e "${GREEN}=================================================${NC}"
    echo -e "${GREEN}  ✅ MIGRACIÓN COMPLETADA${NC}"
    echo -e "${GREEN}=================================================${NC}"
    echo ""
    echo -e "${GREEN}📝 Información importante:${NC}"
    echo "  - Las tablas ahora están particionadas por año"
    echo "  - Se crearon particiones para 2024-2027 y una por defecto"
    echo "  - Use la función create_partitions_for_next_year() cada año"
    echo ""
    echo -e "${GREEN}🔧 Funciones útiles:${NC}"
    echo "  SELECT create_partition_for_year('reportes', 2028);"
    echo "  SELECT create_partitions_for_next_year();"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error durante la migración${NC}"
    echo -e "${YELLOW}Los servicios permanecen detenidos para investigación${NC}"
    echo -e "${YELLOW}Revisa los logs para más detalles${NC}"
    echo ""
    echo -e "${YELLOW}Para revertir, ejecuta el backup:${NC}"
    echo "  pm2 stop all"
    echo "  psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
    echo "  pm2 restart all"
    exit 1
fi
