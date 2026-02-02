#!/bin/bash

# Script para configurar variables de entorno
# Ejecutar con: bash setup-env.sh

set -e

echo "⚙️  Configurando variables de entorno..."

cd "$(dirname "$0")/server"

# Solicitar información
read -p "DB_HOST (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "DB_PORT (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "DB_NAME (default: repvtas): " DB_NAME
DB_NAME=${DB_NAME:-repvtas}

read -p "DB_USER (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "DB_PASSWORD: " DB_PASSWORD
echo ""

read -p "PORT (default: 5000): " PORT
PORT=${PORT:-5000}

read -p "FRONTEND_URL (default: http://localhost:3000): " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}

# Generar JWT_SECRET aleatorio
JWT_SECRET=$(openssl rand -base64 32)

echo ""
read -p "¿Deseas configurar OAuth? (s/n): " CONFIG_OAUTH

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

if [[ "$CONFIG_OAUTH" == "s" || "$CONFIG_OAUTH" == "S" ]]; then
    read -p "GOOGLE_CLIENT_ID (opcional): " GOOGLE_CLIENT_ID
    read -sp "GOOGLE_CLIENT_SECRET (opcional): " GOOGLE_CLIENT_SECRET
    echo ""
    read -p "GITHUB_CLIENT_ID (opcional): " GITHUB_CLIENT_ID
    read -sp "GITHUB_CLIENT_SECRET (opcional): " GITHUB_CLIENT_SECRET
    echo ""
fi

# Crear archivo .env
cat > .env <<EOF
# Database
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET

# Server
PORT=$PORT
NODE_ENV=production

# Frontend
FRONTEND_URL=$FRONTEND_URL

# OAuth (opcional)
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
EOF

echo "✅ Archivo .env creado en server/.env"
echo ""
echo "⚠️  IMPORTANTE: Guarda el JWT_SECRET de forma segura:"
echo "   $JWT_SECRET"
