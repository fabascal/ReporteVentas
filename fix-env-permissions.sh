#!/bin/bash

# Script para corregir permisos del archivo .env
# Ejecutar con: bash fix-env-permissions.sh

set -e

cd /home/webops/ReporteVentas/server

echo "🔧 Corrigiendo permisos del archivo .env..."

# Intentar cambiar propietario (requiere sudo)
if [ -f ".env" ] && [ ! -w ".env" ]; then
    echo "📝 El archivo .env existe pero no tienes permisos de escritura"
    echo ""
    echo "Intentando cambiar propietario..."
    
    # Intentar con sudo (puede pedir contraseña)
    sudo chown webops:webops .env 2>/dev/null && {
        echo "✅ Permisos corregidos exitosamente"
        echo "   Ahora puedes editar el archivo .env"
        exit 0
    } || {
        echo "⚠️  No se pudo cambiar el propietario automáticamente"
        echo ""
        echo "Opciones:"
        echo "1. Ejecuta manualmente: sudo chown webops:webops /home/webops/ReporteVentas/server/.env"
        echo "2. O usa el archivo .env.local que ya está creado"
        echo ""
        
        # Crear backup y nuevo .env
        if [ -f ".env.local" ]; then
            echo "📋 Creando nuevo .env desde .env.local..."
            cat .env.local > .env.new 2>/dev/null && {
                echo "✅ Archivo .env.new creado"
                echo "   Puedes renombrarlo: mv .env.new .env"
                echo "   O copiar su contenido manualmente"
            } || {
                echo "❌ No se pudo crear .env.new"
            }
        fi
    }
else
    if [ -f ".env" ]; then
        echo "✅ El archivo .env ya tiene permisos correctos"
    else
        echo "⚠️  El archivo .env no existe"
        if [ -f ".env.local" ]; then
            echo "📋 Copiando .env.local a .env..."
            cp .env.local .env
            echo "✅ Archivo .env creado desde .env.local"
        else
            echo "❌ No se encontró .env ni .env.local"
            echo "   Ejecuta: bash setup-env.sh"
        fi
    fi
fi
