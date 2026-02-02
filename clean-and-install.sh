#!/bin/bash

# Script para limpiar e instalar dependencias
# REQUIERE SUDO para limpiar node_modules problemáticos
# Ejecutar con: sudo bash clean-and-install.sh

set -e

export CI=true

cd /home/webops/ReporteVentas

echo "🧹 Limpiando node_modules problemáticos..."

# Limpiar node_modules del frontend si tiene problemas de permisos
if [ -d "node_modules/.bin" ] && [ ! -w "node_modules/.bin" ]; then
    echo "   Eliminando node_modules/.bin problemático..."
    rm -rf node_modules/.bin 2>/dev/null || sudo rm -rf node_modules/.bin
fi

# Limpiar todo node_modules si es necesario
if [ -d "node_modules" ] && [ ! -w "node_modules" ]; then
    echo "   Eliminando node_modules del frontend (requiere permisos)..."
    sudo rm -rf node_modules
fi

# Limpiar node_modules del backend si existe
if [ -d "server/node_modules" ]; then
    echo "   Limpiando node_modules del backend..."
    rm -rf server/node_modules
fi

echo ""
echo "📦 Instalando dependencias del frontend..."
cd /home/webops/ReporteVentas
CI=true pnpm install

echo ""
echo "📦 Instalando dependencias del backend..."
cd /home/webops/ReporteVentas/server
CI=true pnpm install

# Verificar @types/node
if [ ! -d "node_modules/@types/node" ]; then
    echo "⚠️  Instalando @types/node..."
    CI=true pnpm add -D @types/node
fi

echo ""
echo "✅ Todas las dependencias instaladas correctamente"
