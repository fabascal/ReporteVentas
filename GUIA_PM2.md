# 🚀 Guía de PM2 para Producción

## ¿Qué es PM2?

PM2 es un gestor de procesos para Node.js que:
- ✅ Mantiene las aplicaciones corriendo siempre (reinicia si se caen)
- ✅ Inicia automáticamente al reiniciar el servidor
- ✅ Gestiona logs de forma centralizada
- ✅ Permite escalar aplicaciones fácilmente
- ✅ Monitorea el uso de recursos (CPU, memoria)

## 🚀 Configuración Rápida

Ejecuta este comando para configurar todo automáticamente:

```bash
cd /home/webops/ReporteVentas
bash setup-pm2.sh
```

Este script:
1. Instala PM2 si no está instalado
2. Instala `serve` para servir el frontend
3. Inicia backend y frontend con PM2
4. Configura inicio automático al reiniciar el servidor

## 📋 Comandos Útiles de PM2

### Ver estado
```bash
pm2 status
```

### Ver logs
```bash
# Todos los logs
pm2 logs

# Solo backend
pm2 logs repvtas-backend

# Solo frontend
pm2 logs repvtas-frontend

# Logs en tiempo real
pm2 logs --lines 50
```

### Controlar procesos
```bash
# Detener todos
pm2 stop all

# Iniciar todos
pm2 start all

# Reiniciar todos
pm2 restart all

# Detener y eliminar todos
pm2 delete all

# Reiniciar solo el backend
pm2 restart repvtas-backend

# Reiniciar solo el frontend
pm2 restart repvtas-frontend
```

### Monitoreo
```bash
# Ver uso de recursos en tiempo real
pm2 monit

# Ver información detallada
pm2 show repvtas-backend
pm2 show repvtas-frontend
```

### Guardar y restaurar
```bash
# Guardar configuración actual
pm2 save

# Restaurar procesos guardados
pm2 resurrect
```

## 🔧 Configuración Manual

Si prefieres configurar manualmente:

### 1. Instalar PM2
```bash
npm install -g pm2
npm install -g serve
```

### 2. Iniciar aplicaciones
```bash
cd /home/webops/ReporteVentas
pm2 start ecosystem.config.js
```

### 3. Guardar configuración
```bash
pm2 save
```

### 4. Configurar inicio automático
```bash
pm2 startup
# Ejecuta el comando que PM2 te muestre (requiere sudo)
```

## 📊 Verificar que Funciona

### Backend
```bash
curl http://localhost:5000/api/health
# Debería responder: {"status":"ok","message":"Server is running"}
```

### Frontend
```bash
curl http://localhost:3000
# Debería devolver el HTML del frontend
```

O abre en el navegador:
- Frontend: `http://tu-servidor:3000`
- Backend API: `http://tu-servidor:5000/api/health`

## 🔄 Actualizar la Aplicación

Cuando actualices el código:

```bash
cd /home/webops/ReporteVentas

# 1. Compilar
pnpm build
cd server && pnpm build && cd ..

# 2. Reiniciar con PM2
pm2 restart all

# O reiniciar individualmente
pm2 restart repvtas-backend
pm2 restart repvtas-frontend
```

## 📝 Logs

Los logs se guardan en:
- Backend: `logs/backend-out.log` y `logs/backend-error.log`
- Frontend: `logs/frontend-out.log` y `logs/frontend-error.log`

También puedes verlos con:
```bash
pm2 logs
```

## 🛡️ Configuración de Firewall

Asegúrate de que los puertos estén abiertos:

```bash
# Si usas ufw
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 5000/tcp  # Backend
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

## 🌐 Configurar Nginx (Opcional pero Recomendado)

Para producción, es mejor usar nginx como proxy reverso:

```bash
sudo nano /etc/nginx/sites-available/repvtas
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar:
```bash
sudo ln -s /etc/nginx/sites-available/repvtas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ Ventajas de PM2 vs Ejecutar Manualmente

| Característica | Manual | PM2 |
|---------------|--------|-----|
| Reinicio automático si se cae | ❌ | ✅ |
| Inicio al reiniciar servidor | ❌ | ✅ |
| Gestión de logs | ❌ | ✅ |
| Monitoreo de recursos | ❌ | ✅ |
| Fácil escalado | ❌ | ✅ |
| Producción | ❌ | ✅ |

## 🆘 Solución de Problemas

### PM2 no inicia los procesos
```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### Los procesos se detienen
```bash
pm2 logs  # Ver qué error hay
pm2 restart all
```

### No inicia al reiniciar el servidor
```bash
pm2 startup
# Ejecuta el comando que muestra (requiere sudo)
pm2 save
```

### Verificar que PM2 está corriendo
```bash
pm2 status
# Debería mostrar ambos procesos como "online"
```
