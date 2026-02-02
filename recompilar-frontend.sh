#!/bin/bash

# Script para recompilar el frontend con la URL correcta del backend
# Ejecutar con: bash recompilar-frontend.sh

set -e

cd /home/webops/ReporteVentas

echo "🔨 Recompilando frontend con URL correcta del backend..."

# Verificar que .env existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cat > .env <<EOF
VITE_API_URL=http://189.206.183.110:5000/api
EOF
fi

# Limpiar dist (puede requerir sudo si tiene permisos de root)
echo "🧹 Limpiando directorio dist..."
if [ -d "dist" ]; then
    rm -rf dist/* 2>/dev/null || {
        echo "⚠️  Algunos archivos requieren sudo. Ejecuta:"
        echo "   sudo rm -rf /home/webops/ReporteVentas/dist"
        echo "   Luego ejecuta este script nuevamente"
        exit 1
    }
fi

# Compilar
echo "📦 Compilando frontend..."
pnpm build

echo "✅ Frontend recompilado"
echo ""
echo "🔄 Reiniciando frontend con PM2..."
pm2 restart repvtas-frontend

echo ""
echo "✅ Proceso completado"
echo ""
echo "Verifica que funciona:"
echo "  curl http://localhost:3030"
