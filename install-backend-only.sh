#!/bin/bash

# Script para instalar solo dependencias del backend
# Ejecutar con: bash install-backend-only.sh

set -e

export CI=true

cd /home/webops/ReporteVentas/server

echo "📦 Instalando dependencias del backend..."

# Verificar que pnpm esté instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm no está instalado"
    exit 1
fi

# Instalar dependencias
CI=true pnpm install

# Verificar que @types/node esté instalado
if [ ! -d "node_modules/@types/node" ]; then
    echo "⚠️  @types/node no encontrado, instalando..."
    CI=true pnpm add -D @types/node
fi

echo "✅ Dependencias del backend instaladas"
