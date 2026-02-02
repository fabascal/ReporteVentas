# 🚀 Inicio Rápido con PM2

## Pasos para Levantar Frontend y Backend con PM2

### 1. Instalar PM2 y serve (requiere sudo)

```bash
sudo npm install -g pm2
sudo npm install -g serve
```

### 2. Ejecutar el script de configuración

```bash
cd /home/webops/ReporteVentas
sudo bash setup-pm2.sh
```

O manualmente:

```bash
cd /home/webops/ReporteVentas

# Crear directorio de logs
mkdir -p logs

# Detener procesos existentes
pm2 delete all 2>/dev/null || true

# Iniciar backend y frontend
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático (ejecuta el comando que PM2 muestre)
pm2 startup
```

### 3. Verificar que está funcionando

```bash
# Ver estado
pm2 status

# Debería mostrar:
# - repvtas-backend (online)
# - repvtas-frontend (online)

# Ver logs
pm2 logs

# Probar endpoints
curl http://localhost:5000/api/health
curl http://localhost:3000
```

## 📊 Comandos Útiles

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar todo
pm2 restart all

# Detener todo
pm2 stop all

# Iniciar todo
pm2 start all

# Monitoreo de recursos
pm2 monit
```

## ✅ Ventajas de PM2

- ✅ **Reinicio automático**: Si el proceso se cae, PM2 lo reinicia automáticamente
- ✅ **Inicio al arrancar**: Los procesos se inician automáticamente al reiniciar el servidor
- ✅ **Gestión de logs**: Todos los logs en un solo lugar
- ✅ **Monitoreo**: Puedes ver CPU, memoria, etc.
- ✅ **Producción**: Ideal para servidores en producción

## 🔍 Verificar Acceso

### Backend
```bash
curl http://localhost:5000/api/health
# Respuesta esperada: {"status":"ok","message":"Server is running"}
```

### Frontend
```bash
curl http://localhost:3000
# Debería devolver el HTML del frontend
```

O abre en el navegador:
- Frontend: `http://tu-servidor-ip:3000`
- Backend: `http://tu-servidor-ip:5000/api/health`

## 🔄 Actualizar Código

Cuando actualices el código:

```bash
cd /home/webops/ReporteVentas

# 1. Compilar
pnpm build
cd server && pnpm build && cd ..

# 2. Reiniciar con PM2
pm2 restart all
```

## 📝 Logs

Los logs están en:
- `logs/backend-out.log` - Salida del backend
- `logs/backend-error.log` - Errores del backend
- `logs/frontend-out.log` - Salida del frontend
- `logs/frontend-error.log` - Errores del frontend

O ver todos con:
```bash
pm2 logs
```
