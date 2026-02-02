#!/bin/bash

# Script de despliegue para producción
# Ejecutar con: bash deploy.sh

set -e

echo "🚀 Desplegando aplicación en producción..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que pnpm esté instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm no está instalado. Instálalo con: npm install -g pnpm"
    exit 1
fi

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
if [ ! -d "node_modules" ]; then
    pnpm install
else
    pnpm install --frozen-lockfile || pnpm install
fi

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd server
if [ ! -d "node_modules" ]; then
    pnpm install
else
    pnpm install --frozen-lockfile || pnpm install
fi
cd ..

# Verificar que el .env existe
if [ ! -f "server/.env" ]; then
    echo "⚠️  Advertencia: No se encontró server/.env"
    echo "   Ejecuta: bash setup-env.sh para crearlo"
    echo "   Continuando con la compilación..."
fi

# Compilar frontend
echo "🔨 Compilando frontend..."
pnpm build

# Compilar backend
echo "🔨 Compilando backend..."
cd server
pnpm build
cd ..

echo "✅ Despliegue completado"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Verifica que el archivo server/.env esté configurado correctamente"
echo "   2. Inicia el servidor backend: cd server && pnpm start"
echo "   3. Para servir el frontend, puedes usar:"
echo "      - nginx (recomendado para producción)"
echo "      - pm2 serve dist 3000 (temporal)"
echo "   4. O configura un servidor web para servir los archivos de dist/"
