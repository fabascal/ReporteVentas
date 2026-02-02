#!/bin/bash

# Script para configurar la base de datos
# Ejecutar con: bash setup-db.sh

set -e

echo "🗄️  Configurando base de datos..."

# Solicitar credenciales
read -p "Usuario de PostgreSQL (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Contraseña de PostgreSQL: " DB_PASSWORD
echo ""

read -p "Nombre de la base de datos (default: repvtas): " DB_NAME
DB_NAME=${DB_NAME:-repvtas}

# Crear base de datos
echo "📝 Creando base de datos..."
sudo -u postgres psql <<EOF
-- Crear usuario si no existe
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Dar permisos
ALTER USER $DB_USER CREATEDB;

-- Crear base de datos
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "✅ Base de datos '$DB_NAME' creada exitosamente"
