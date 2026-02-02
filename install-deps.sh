#!/bin/bash

# Script para instalar dependencias
# Ejecutar con: bash install-deps.sh

set -e

# Configurar CI para pnpm en modo no interactivo
export CI=true

echo "📦 Instalando dependencias..."

# Verificar que pnpm esté instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm no está instalado"
    echo "   Instálalo con: npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm encontrado: $(pnpm --version)"

# Instalar dependencias del frontend
echo ""
echo "📦 Instalando dependencias del frontend..."
cd /home/webops/ReporteVentas
CI=true pnpm install --no-frozen-lockfile || CI=true pnpm install

# Instalar dependencias del backend
echo ""
echo "📦 Instalando dependencias del backend..."
cd /home/webops/ReporteVentas/server
CI=true pnpm install --no-frozen-lockfile || CI=true pnpm install

echo ""
echo "✅ Todas las dependencias instaladas correctamente"
