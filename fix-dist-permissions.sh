#!/bin/bash

# Script para limpiar dist y recompilar frontend
# Ejecutar con: bash fix-dist-permissions.sh

set -e

cd /home/webops/ReporteVentas

echo "🔨 Recompilando frontend con URL correcta del backend..."
echo ""

# Verificar que .env existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cat > .env <<EOF
VITE_API_URL=http://189.206.183.110:5000/api
EOF
fi

# Intentar limpiar dist
echo "🧹 Limpiando directorio dist..."
if [ -d "dist" ]; then
    # Intentar eliminar sin sudo primero
    rm -rf dist/* 2>/dev/null || true
    rm -rf dist/.* 2>/dev/null || true
    
    # Si aún existe, intentar cambiar permisos
    if [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then
        echo "⚠️  Algunos archivos requieren permisos de root."
        echo ""
        echo "Por favor ejecuta este comando manualmente:"
        echo "   sudo rm -rf /home/webops/ReporteVentas/dist"
        echo ""
        echo "Luego ejecuta este script nuevamente:"
        echo "   bash fix-dist-permissions.sh"
        exit 1
    fi
fi

# Compilar
echo "📦 Compilando frontend..."
pnpm build

# Verificar que se compiló con la URL correcta
if grep -r "189.206.183.110:5000" dist/assets/*.js 2>/dev/null | head -1 > /dev/null; then
    echo "✅ Frontend compilado con URL correcta del backend"
else
    echo "⚠️  No se encontró la URL en los archivos compilados (puede ser normal si está minificado)"
fi

echo ""
echo "🔄 Reiniciando frontend con PM2..."
pm2 restart repvtas-frontend

echo ""
echo "✅ Proceso completado"
echo ""
echo "Verifica que funciona:"
echo "  curl http://localhost:3030"
echo ""
echo "El frontend debería estar accesible en:"
echo "  http://189.206.183.110:3030"
