#!/bin/bash

# Script de instalación para producción
# Ejecutar con: bash install.sh

set -e

echo "🚀 Instalando dependencias del sistema..."

# Instalar Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js ya está instalado: $(node --version)"
fi

# Instalar pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm
else
    echo "✅ pnpm ya está instalado: $(pnpm --version)"
fi

# Instalar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "📦 Instalando PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    echo "✅ PostgreSQL ya está instalado: $(psql --version)"
fi

echo "✅ Instalación de dependencias completada"
