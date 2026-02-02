#!/bin/bash

# Script completo para resolver todos los problemas
# Ejecutar con: bash fix-all.sh
# NOTA: Algunos comandos requieren sudo

set -e

echo "🔧 Solucionando problemas de permisos y dependencias..."
echo ""

cd /home/webops/ReporteVentas

# 1. Limpiar node_modules
echo "🧹 Limpiando node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules 2>/dev/null || {
        echo "⚠️  Algunos archivos requieren sudo. Ejecuta:"
        echo "   sudo rm -rf /home/webops/ReporteVentas/node_modules"
        echo "   sudo rm -rf /home/webops/ReporteVentas/server/node_modules"
    }
fi

if [ -d "server/node_modules" ]; then
    rm -rf server/node_modules 2>/dev/null || {
        echo "⚠️  Algunos archivos requieren sudo"
    }
fi

# 2. Corregir .env
echo ""
echo "📝 Configurando .env..."
if [ -f "server/.env.local" ] && [ ! -w "server/.env" ]; then
    echo "   Usando .env.local (el código ya está configurado para usarlo)"
    echo "   Si quieres usar .env, ejecuta: sudo chown webops:webops server/.env"
else
    echo "   ✅ .env es editable"
fi

# 3. Instalar dependencias
echo ""
echo "📦 Instalando dependencias del frontend..."
export CI=true
pnpm install --no-frozen-lockfile || pnpm install || {
    echo "❌ Error instalando dependencias del frontend"
    echo "   Intenta: sudo chown -R webops:webops /home/webops/ReporteVentas"
    exit 1
}

echo ""
echo "📦 Instalando dependencias del backend..."
cd server
CI=true pnpm install --no-frozen-lockfile || CI=true pnpm install || {
    echo "❌ Error instalando dependencias del backend"
    exit 1
}
cd ..

echo ""
echo "✅ Dependencias instaladas"
echo ""
echo "🔨 Compilando proyecto..."
echo ""

# 4. Compilar frontend
echo "📦 Compilando frontend..."
pnpm build || {
    echo "❌ Error compilando frontend"
    exit 1
}

# 5. Compilar backend
echo "📦 Compilando backend..."
cd server
pnpm build || {
    echo "❌ Error compilando backend"
    echo ""
    echo "Revisa los errores arriba. Posibles causas:"
    echo "  - Faltan dependencias: ejecuta 'pnpm install' en server/"
    echo "  - Errores de TypeScript: revisa tsconfig.json"
    exit 1
}
cd ..

echo ""
echo "✅ ¡Compilación completada exitosamente!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Verifica server/.env o server/.env.local"
echo "   2. Inicia el backend: cd server && pnpm start"
echo "   3. Sirve el frontend desde dist/ con nginx o pm2"
