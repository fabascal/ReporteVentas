#!/bin/bash

# Script para configurar PM2 y levantar frontend y backend
# Ejecutar con: bash setup-pm2.sh

set -e

cd /home/webops/ReporteVentas

echo "🚀 Configurando PM2 para producción..."

# Verificar que PM2 esté instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2 (requiere sudo)..."
    echo "   Ejecutando: sudo npm install -g pm2"
    sudo npm install -g pm2
else
    echo "✅ PM2 ya está instalado: $(pm2 --version)"
fi

# Crear directorio de logs si no existe
mkdir -p logs

# Detener procesos existentes si están corriendo
echo "🛑 Deteniendo procesos existentes..."
pm2 delete all 2>/dev/null || true

# Instalar serve para el frontend si no está instalado
if ! command -v serve &> /dev/null; then
    echo "📦 Instalando serve para el frontend (requiere sudo)..."
    echo "   Ejecutando: sudo npm install -g serve"
    sudo npm install -g serve
fi

# Iniciar aplicaciones con PM2
echo "🚀 Iniciando backend y frontend con PM2..."
pm2 start ecosystem.config.cjs

# Guardar configuración
echo "💾 Guardando configuración de PM2..."
pm2 save

# Configurar inicio automático
echo "⚙️  Configurando inicio automático..."
pm2 startup | tail -1 | bash || {
    echo "⚠️  No se pudo configurar el inicio automático automáticamente"
    echo "   Ejecuta manualmente el comando que PM2 te mostró arriba"
}

echo ""
echo "✅ Configuración completada"
echo ""
echo "📊 Ver estado: pm2 status"
echo "📋 Ver logs: pm2 logs"
echo "🛑 Detener: pm2 stop all"
echo "▶️  Iniciar: pm2 start all"
echo "🔄 Reiniciar: pm2 restart all"
