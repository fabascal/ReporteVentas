# 🎯 Instrucciones Finales para Completar el Despliegue

## ⚠️ Problema Actual: Permisos

Varios archivos y directorios son propiedad de `root`, lo que impide:
- Editar archivos
- Compilar el proyecto
- Ejecutar el servidor

## ✅ Solución Rápida (Recomendada)

Ejecuta este comando **con sudo** para corregir todos los permisos:

```bash
cd /home/webops/ReporteVentas
sudo bash fix-all-permissions.sh
```

Este script:
- Cambiará el propietario de todo el proyecto a `webops:webops`
- Ajustará los permisos correctamente
- Permitirá compilar y ejecutar sin problemas

## 📝 Pasos Completos para Despliegue

### 1. Corregir Permisos (REQUIERE SUDO)

```bash
cd /home/webops/ReporteVentas
sudo bash fix-all-permissions.sh
```

### 2. Verificar Dependencias

```bash
# Frontend
cd /home/webops/ReporteVentas
ls -la node_modules | head -5

# Backend
cd /home/webops/ReporteVentas/server
ls -la node_modules | head -5
```

Si faltan dependencias:

```bash
# Frontend
cd /home/webops/ReporteVentas
CI=true pnpm install

# Backend (usar npm si pnpm tiene problemas)
cd /home/webops/ReporteVentas/server
npm install
```

### 3. Compilar Proyecto

```bash
# Frontend (ya compilado, pero puedes recompilar)
cd /home/webops/ReporteVentas
pnpm build

# Backend
cd /home/webops/ReporteVentas/server
pnpm build
# O si pnpm falla:
npm run build
```

### 4. Verificar Base de Datos

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U webops -d repvtas -h localhost -c "SELECT 1;"
```

### 5. Iniciar Servidor

```bash
cd /home/webops/ReporteVentas/server
pnpm start
# O
npm start
```

## 🔍 Verificación

Una vez iniciado el servidor:

```bash
# Verificar que el backend responda
curl http://localhost:5000/api/health

# Debería responder: {"status":"ok","message":"Server is running"}
```

## 🚀 Producción con PM2

Para ejecutar en producción:

```bash
# Instalar PM2
npm install -g pm2

# Iniciar con PM2
cd /home/webops/ReporteVentas
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs

# Guardar configuración
pm2 save
pm2 startup
```

## 📋 Resumen de Archivos Creados

- `fix-all-permissions.sh` - Corrige todos los permisos (requiere sudo)
- `install-backend-npm.sh` - Instala dependencias del backend con npm
- `clean-and-install.sh` - Limpia e instala todo
- `SOLUCION_COMPILACION.md` - Documentación de errores de compilación
- `RESUMEN_PROGRESO.md` - Estado actual del proyecto

## ⚡ Comando Rápido Todo-en-Uno

```bash
cd /home/webops/ReporteVentas
sudo bash fix-all-permissions.sh && \
cd server && npm install && pnpm build && \
cd .. && pnpm build && \
echo "✅ ¡Todo listo! Ahora puedes iniciar el servidor con: cd server && pnpm start"
```
