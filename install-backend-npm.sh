#!/bin/bash

# Script para instalar dependencias del backend usando npm
# Úsalo si pnpm tiene problemas de permisos
# Ejecutar con: bash install-backend-npm.sh

set -e

cd /home/webops/ReporteVentas/server

echo "📦 Instalando dependencias del backend con npm..."

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

# Instalar dependencias
npm install

# Verificar que @types/node esté instalado
if [ ! -d "node_modules/@types/node" ]; then
    echo "⚠️  @types/node no encontrado, instalando..."
    npm install --save-dev @types/node
fi

echo "✅ Dependencias del backend instaladas con npm"
echo ""
echo "📝 Nota: Si usas npm para instalar, usa 'npm run build' en lugar de 'pnpm build'"
