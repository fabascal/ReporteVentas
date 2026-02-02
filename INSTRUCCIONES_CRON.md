# ⏰ Configuración de Tareas Programadas (Cron)

## 📋 Tareas Automáticas del Sistema

### 1. **Creación Anual de Particiones**

**Frecuencia:** 1 de diciembre a las 00:00 (anualmente)  
**Script:** `/home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh`  
**Propósito:** Crear particiones para el año siguiente en todas las tablas particionadas

---

## 🔧 Configurar Cron Job

### Opción 1: Editar crontab directamente

```bash
# Editar crontab del usuario webops
crontab -e

# Agregar esta línea al final:
0 0 1 12 * PGPASSWORD=qwerty /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh
```

### Opción 2: Script de instalación automática

Crear archivo `/home/webops/ReporteVentas/server/scripts/install_cron.sh`:

```bash
#!/bin/bash

# Guardar crontab actual
crontab -l > /tmp/mycron 2>/dev/null || echo "" > /tmp/mycron

# Agregar tarea si no existe
if ! grep -q "mantenimiento_anual_particiones" /tmp/mycron; then
    echo "0 0 1 12 * PGPASSWORD=qwerty /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh" >> /tmp/mycron
    crontab /tmp/mycron
    echo "✓ Tarea cron instalada exitosamente"
else
    echo "- Tarea cron ya existe"
fi

# Limpiar
rm /tmp/mycron

# Mostrar crontab actual
echo ""
echo "Crontab actual:"
crontab -l | grep -v "^#"
```

Luego ejecutar:
```bash
chmod +x /home/webops/ReporteVentas/server/scripts/install_cron.sh
/home/webops/ReporteVentas/server/scripts/install_cron.sh
```

---

## 📅 Sintaxis de Cron

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (0=Domingo)
│ │ │ │ │
│ │ │ │ │
* * * * * comando a ejecutar
```

### Ejemplos:

```bash
# Cada día a las 2:30 AM
30 2 * * * /ruta/al/script.sh

# Cada lunes a las 9:00 AM
0 9 * * 1 /ruta/al/script.sh

# Primer día de cada mes a medianoche
0 0 1 * * /ruta/al/script.sh

# Cada hora
0 * * * * /ruta/al/script.sh

# Cada 15 minutos
*/15 * * * * /ruta/al/script.sh
```

---

## 🔍 Verificar Tareas Programadas

### Ver crontab actual:
```bash
crontab -l
```

### Ver logs del sistema cron:
```bash
sudo tail -f /var/log/syslog | grep CRON
```

### Ver logs del script específico:
```bash
ls -lth /home/webops/ReporteVentas/logs/particiones_*.log | head -5
tail -f /home/webops/ReporteVentas/logs/particiones_*.log
```

---

## 🧪 Probar el Script Manualmente

Antes de configurar el cron, prueba el script manualmente:

```bash
# Ejecutar con salida en pantalla
PGPASSWORD=qwerty /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh

# Ver el log generado
ls -lth /home/webops/ReporteVentas/logs/particiones_*.log | head -1
cat /home/webops/ReporteVentas/logs/particiones_*.log
```

---

## 📊 Verificar Resultado

Después de ejecutar (manual o automático):

```bash
# Conectar a PostgreSQL
PGPASSWORD=qwerty psql -h localhost -U webops -d repvtas

# Ver particiones creadas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'gastos_%' OR 
    tablename LIKE 'entregas_%' OR
    tablename LIKE 'liquidaciones_mensuales_%'
  )
ORDER BY tablename DESC
LIMIT 10;
```

---

## ⚠️ Consideraciones de Seguridad

### Problema: Password en crontab
El password de la base de datos está visible en el crontab. Para mayor seguridad:

### Solución 1: Archivo .pgpass
```bash
# Crear archivo ~/.pgpass
echo "localhost:5432:repvtas:webops:qwerty" > ~/.pgpass
chmod 600 ~/.pgpass

# Modificar crontab (sin PGPASSWORD)
0 0 1 12 * /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh
```

### Solución 2: Variables de entorno
```bash
# Crear archivo de configuración
echo "export PGPASSWORD=qwerty" > /home/webops/.db_env
chmod 600 /home/webops/.db_env

# Modificar script para cargar variables
# En mantenimiento_anual_particiones.sh, agregar al inicio:
source /home/webops/.db_env

# Modificar crontab
0 0 1 12 * /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh
```

---

## 🔔 Notificaciones

### Enviar email al completar:

Descomentar en el script:
```bash
echo "Mantenimiento de particiones completado. Ver log: $LOG_FILE" | \
  mail -s "Mantenimiento DB - Particiones" admin@example.com
```

Requiere configurar `mail` o `sendmail` en el sistema.

### Notificar en Slack/Discord (webhook):

Agregar al final del script:
```bash
# Webhook de Slack
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✓ Mantenimiento de particiones completado"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Webhook de Discord
curl -X POST -H 'Content-type: application/json' \
  --data '{"content":"✓ Mantenimiento de particiones completado"}' \
  https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

---

## 🗓️ Calendario Anual de Mantenimiento

| Mes | Día | Tarea | Automática |
|-----|-----|-------|------------|
| Enero | 1 | Archivar particiones >5 años | ❌ Manual |
| Marzo | 31 | Revisar índices | ❌ Manual |
| Junio | 30 | Analizar estadísticas | ❌ Manual |
| Septiembre | 30 | Revisar tamaños de particiones | ❌ Manual |
| **Diciembre** | **1** | **Crear particiones año siguiente** | **✅ Automática (Cron)** |

---

## 🛠️ Troubleshooting

### Cron no se ejecuta

**Verificar:**
1. ¿El servicio cron está activo?
   ```bash
   sudo systemctl status cron
   ```

2. ¿El script tiene permisos de ejecución?
   ```bash
   ls -l /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh
   ```

3. ¿El crontab está bien escrito?
   ```bash
   crontab -l
   ```

4. ¿Hay logs de error?
   ```bash
   sudo grep CRON /var/log/syslog | tail -20
   ```

### Script falla al ejecutar

**Verificar:**
1. ¿Las rutas son absolutas?
2. ¿El password de DB es correcto?
3. ¿PostgreSQL está corriendo?
   ```bash
   sudo systemctl status postgresql
   ```

---

## 📝 Desinstalar Cron Job

Si necesitas remover la tarea:

```bash
# Editar crontab
crontab -e

# Eliminar o comentar la línea (agregar # al inicio):
# 0 0 1 12 * PGPASSWORD=qwerty /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh
```

---

**Última actualización:** 2 de febrero de 2026  
**Versión:** 1.0  
**Mantenido por:** Equipo de Desarrollo
