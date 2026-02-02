#!/bin/bash

# Script para corregir TODOS los permisos del proyecto
# REQUIERE SUDO
# Ejecutar con: sudo bash fix-all-permissions.sh

set -e

cd /home/webops/ReporteVentas

echo "🔧 Corrigiendo todos los permisos del proyecto..."

# Cambiar propietario de todo el proyecto
echo "📁 Cambiando propietario de todo el proyecto a webops:webops..."
chown -R webops:webops /home/webops/ReporteVentas

# Asegurar permisos correctos
echo "🔐 Ajustando permisos..."
find /home/webops/ReporteVentas -type d -exec chmod 755 {} \;
find /home/webops/ReporteVentas -type f -exec chmod 644 {} \;
find /home/webops/ReporteVentas -name "*.sh" -exec chmod +x {} \;

echo ""
echo "✅ Permisos corregidos"
echo ""
echo "Ahora puedes:"
echo "  1. Editar cualquier archivo"
echo "  2. Compilar el proyecto: cd server && pnpm build"
echo "  3. Ejecutar el servidor: cd server && pnpm start"
