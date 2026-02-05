#!/bin/bash

# Script para actualizar referencias a periodos_mensuales en financiero.controller.ts

FILE="./src/controllers/financiero.controller.ts"
BACKUP="./src/controllers/financiero.controller_BACKUP.ts"

# Crear backup
cp "$FILE" "$BACKUP"

# Reemplazos:
# 1. Eliminar consultas que buscan periodo_id y reemplazar con validación de ejercicio
sed -i "s/const periodoResult = await pool.query(/\/\/ Validación de ejercicio fiscal\n      const ejercicioResult = await pool.query(/g" "$FILE"

# 2. Reemplazar SELECT id FROM periodos_mensuales con SELECT id FROM ejercicios_fiscales
sed -i "s/'SELECT id FROM periodos_mensuales WHERE mes = \$1 AND anio = \$2'/'SELECT id FROM ejercicios_fiscales WHERE anio = \$2 AND estado = '\''activo'\'''/g" "$FILE"

# 3. Reemplazar SELECT fecha_inicio, fecha_fin FROM periodos_mensuales
# Esto se debe reemplazar con cálculo directo de fechas
sed -i "s/'SELECT fecha_inicio, fecha_fin FROM periodos_mensuales WHERE anio = \$1 AND mes = \$2'/NULL \/\/ Se calculará directamente/g" "$FILE"
sed -i "s/'SELECT fecha_inicio, fecha_fin FROM periodos_mensuales WHERE mes = \$1 AND anio = \$2'/NULL \/\/ Se calculará directamente/g" "$FILE"

# 4. Reemplazar WHERE periodo_id = con WHERE anio = y mes =
sed -i "s/WHERE zona_id = \$1 AND periodo_id = \$2/WHERE zona_id = \$1 AND anio = anio_var AND mes = mes_var/g" "$FILE"
sed -i "s/WHERE e.id = \$1 AND zpc.periodo_id = \$2/WHERE e.id = \$1 AND zpc.anio = anio_var AND zpc.mes = mes_var/g" "$FILE"

echo "✅ Reemplazos básicos completados"
echo "⚠️  Se requieren ajustes manuales adicionales"
echo "Backup guardado en: $BACKUP"
