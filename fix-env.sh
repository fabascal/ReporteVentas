#!/bin/bash

# Script para crear/corregir el archivo .env
# Ejecutar con: bash fix-env.sh

set -e

cd "$(dirname "$0")/server"

echo "⚙️  Configurando archivo .env..."

# Si el archivo existe pero es de root, crear uno nuevo
if [ -f ".env" ] && [ ! -w ".env" ]; then
    echo "⚠️  El archivo .env existe pero no tienes permisos de escritura"
    echo "📝 Creando nuevo archivo .env.local..."
    
    # Leer valores del .env existente si es posible
    DB_HOST=$(grep "^DB_HOST=" .env 2>/dev/null | cut -d '=' -f2 || echo "localhost")
    DB_PORT=$(grep "^DB_PORT=" .env 2>/dev/null | cut -d '=' -f2 || echo "5432")
    DB_NAME=$(grep "^DB_NAME=" .env 2>/dev/null | cut -d '=' -f2 || echo "repvtas")
    DB_USER=$(grep "^DB_USER=" .env 2>/dev/null | cut -d '=' -f2 || echo "postgres")
    DB_PASSWORD=$(grep "^DB_PASSWORD=" .env 2>/dev/null | cut -d '=' -f2 || echo "")
    PORT=$(grep "^PORT=" .env 2>/dev/null | cut -d '=' -f2 || echo "5000")
    JWT_SECRET=$(grep "^JWT_SECRET=" .env 2>/dev/null | cut -d '=' -f2 || echo "")
    FRONTEND_URL=$(grep "^FRONTEND_URL=" .env 2>/dev/null | cut -d '=' -f2 || echo "http://localhost:3000")
    
    # Generar JWT_SECRET si no existe
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    fi
    
    # Crear nuevo archivo
    cat > .env.local <<EOF
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
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
EOF
    
    echo "✅ Archivo .env.local creado"
    echo "⚠️  IMPORTANTE: El servidor buscará .env primero, luego .env.local"
    echo "   Si necesitas usar .env.local, copia su contenido a .env con:"
    echo "   cp server/.env.local server/.env"
    echo ""
    echo "   O ejecuta: sudo chown webops:webops server/.env"
else
    echo "✅ El archivo .env es editable"
    echo "   Puedes editarlo con: nano server/.env"
    echo "   O ejecuta: bash setup-env.sh para recrearlo"
fi
