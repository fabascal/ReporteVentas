#!/bin/bash

# Script de prueba para API Externa
# Sistema de Reportes de Ventas

BASE_URL="http://189.206.183.110:3001/api/external"

echo "================================"
echo "Prueba de API Externa"
echo "================================"
echo ""

# 1. Autenticación
echo "1. Obteniendo token de autenticación..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "demo_api_user",
    "api_secret": "demo_secret_123"
  }')

TOKEN=$(echo $AUTH_RESPONSE | jq -r '.token')
EXPIRES_AT=$(echo $AUTH_RESPONSE | jq -r '.expires_at')

if [ "$TOKEN" == "null" ]; then
  echo "❌ Error en autenticación"
  echo $AUTH_RESPONSE | jq
  exit 1
fi

echo "✅ Token obtenido exitosamente"
echo "   Token: ${TOKEN:0:50}..."
echo "   Expira: $EXPIRES_AT"
echo ""

# 2. Validar Token
echo "2. Validando token..."
VALIDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/validate" \
  -H "Authorization: Bearer $TOKEN")

IS_VALID=$(echo $VALIDATE_RESPONSE | jq -r '.valid')

if [ "$IS_VALID" == "true" ]; then
  echo "✅ Token válido"
  echo $VALIDATE_RESPONSE | jq '{success, valid, api_key, nombre}'
else
  echo "❌ Token inválido"
  echo $VALIDATE_RESPONSE | jq
fi
echo ""

# 3. Obtener Reportes Mensuales
echo "3. Obteniendo reportes mensuales..."
echo "   Estación: 11091 (AUTLAN)"
echo "   Periodo: Noviembre 2025"
REPORTES_RESPONSE=$(curl -s -X GET "$BASE_URL/reportes-mensuales?identificador_externo=11091&anio=2025&mes=11" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

SUCCESS=$(echo $REPORTES_RESPONSE | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  echo "✅ Reportes obtenidos exitosamente"
  echo ""
  echo "Información de la estación:"
  echo $REPORTES_RESPONSE | jq '.data.estacion'
  echo ""
  echo "Periodo:"
  echo $REPORTES_RESPONSE | jq '.data.periodo'
  echo ""
  echo "Resumen de totales:"
  echo $REPORTES_RESPONSE | jq '.data.agregados.totales'
  echo ""
  echo "Premium:"
  echo $REPORTES_RESPONSE | jq '.data.agregados.premium | {total_litros, total_importe, precio_promedio}'
  echo ""
  echo "Magna:"
  echo $REPORTES_RESPONSE | jq '.data.agregados.magna | {total_litros, total_importe, precio_promedio}'
  echo ""
  echo "Diesel:"
  echo $REPORTES_RESPONSE | jq '.data.agregados.diesel | {total_litros, total_importe, precio_promedio}'
else
  echo "❌ Error obteniendo reportes"
  echo $REPORTES_RESPONSE | jq
fi
echo ""

# 4. Obtener Eficiencia de Estaciones
echo "4. Obteniendo eficiencia de todas las estaciones..."
echo "   Periodo: Noviembre 2025"
EFICIENCIA_RESPONSE=$(curl -s -X GET "$BASE_URL/eficiencia-estaciones?anio=2025&mes=11" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

SUCCESS_EF=$(echo $EFICIENCIA_RESPONSE | jq -r '.success')

if [ "$SUCCESS_EF" == "true" ]; then
  echo "✅ Eficiencia obtenida exitosamente"
  echo ""
  echo "Resumen general:"
  echo $EFICIENCIA_RESPONSE | jq '.data | {periodo, total_estaciones, total_zonas}'
  echo ""
  echo "Primeras 3 estaciones de la primera zona:"
  echo $EFICIENCIA_RESPONSE | jq '.data.zonas[0] | {nombre, total_estaciones, estaciones: .estaciones[0:3] | map({nombre, identificador_externo, eficiencia})}'
else
  echo "❌ Error obteniendo eficiencia"
  echo $EFICIENCIA_RESPONSE | jq
fi
echo ""

# 5. Renovar Token
echo "5. Renovando token..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/refresh" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

NEW_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.token')
NEW_EXPIRES=$(echo $REFRESH_RESPONSE | jq -r '.expires_at')

if [ "$NEW_TOKEN" != "null" ]; then
  echo "✅ Token renovado exitosamente"
  echo "   Nuevo Token: ${NEW_TOKEN:0:50}..."
  echo "   Nueva Expiración: $NEW_EXPIRES"
else
  echo "❌ Error renovando token"
  echo $REFRESH_RESPONSE | jq
fi
echo ""

# 6. Probar token expirado/inválido
echo "6. Probando con token inválido..."
INVALID_RESPONSE=$(curl -s -X GET "$BASE_URL/reportes-mensuales?identificador_externo=11091&anio=2025&mes=11" \
  -H "Authorization: Bearer token_invalido" \
  -H "Content-Type: application/json")

ERROR=$(echo $INVALID_RESPONSE | jq -r '.error')

if [ "$ERROR" != "null" ]; then
  echo "✅ Validación de token funcionando correctamente"
  echo "   Error esperado: $ERROR"
else
  echo "❌ La validación de token no funcionó correctamente"
fi
echo ""

echo "================================"
echo "Pruebas completadas"
echo "================================"
