#!/bin/bash

# Script para corregir permisos
# Ejecutar con: bash fix-permissions.sh

echo "🔧 Corrigiendo permisos..."

cd /home/webops/ReporteVentas

# Intentar cambiar permisos de node_modules si existe
if [ -d "node_modules" ]; then
    echo "📁 Corrigiendo permisos de node_modules (frontend)..."
    chmod -R u+w node_modules 2>/dev/null || echo "⚠️  Algunos archivos no se pudieron modificar (puede requerir sudo)"
fi

if [ -d "server/node_modules" ]; then
    echo "📁 Corrigiendo permisos de node_modules (backend)..."
    chmod -R u+w server/node_modules 2>/dev/null || echo "⚠️  Algunos archivos no se pudieron modificar (puede requerir sudo)"
fi

# Crear .env desde .env.local si no tiene permisos
if [ -f "server/.env.local" ] && [ ! -w "server/.env" ]; then
    echo "📝 El archivo .env no es editable, pero .env.local existe"
    echo "   El servidor puede usar .env.local si modificas el código"
    echo "   O ejecuta: sudo chown webops:webops server/.env"
fi

echo "✅ Permisos corregidos (en la medida de lo posible)"
