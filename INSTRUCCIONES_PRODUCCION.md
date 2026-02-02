# 📋 Instrucciones Rápidas para Producción

## ✅ Estado Actual

El repositorio ha sido clonado exitosamente en `/home/webops/ReporteVentas`

## 🚀 Pasos para Completar el Despliegue

### 1. Instalar Dependencias del Sistema

```bash
cd /home/webops/ReporteVentas
bash install.sh
```

**Si no tienes acceso sudo**, instala manualmente:
- Node.js 20.x: https://nodejs.org/
- pnpm: `npm install -g pnpm`
- PostgreSQL: `sudo apt-get install postgresql postgresql-contrib`

### 2. Configurar Base de Datos

```bash
bash setup-db.sh
```

O manualmente:
```bash
sudo -u postgres psql
CREATE DATABASE repvtas;
CREATE USER postgres WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE repvtas TO postgres;
\q
```

### 3. Configurar Variables de Entorno

```bash
bash setup-env.sh
```

Esto creará `server/.env` con todas las configuraciones necesarias.

### 4. Instalar y Compilar

```bash
# Instalar dependencias
pnpm install
cd server && pnpm install && cd ..

# Compilar para producción
pnpm build
cd server && pnpm build && cd ..
```

O usa el script automatizado:
```bash
bash deploy.sh
```

### 5. Inicializar Base de Datos (Opcional)

Si quieres datos de prueba:
```bash
cd server
pnpm seed
cd ..
```

### 6. Ejecutar en Producción

**Opción A: Con PM2 (Recomendado)**
```bash
npm install -g pm2
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Opción B: Manual**
```bash
# Terminal 1 - Backend
cd server
NODE_ENV=production pnpm start

# Terminal 2 - Frontend (con nginx o servidor estático)
# Los archivos compilados están en dist/
```

## 📝 Archivos Creados

- `install.sh` - Instala Node.js, pnpm y PostgreSQL
- `setup-db.sh` - Configura la base de datos
- `setup-env.sh` - Configura variables de entorno
- `deploy.sh` - Compila el proyecto para producción
- `ecosystem.config.js` - Configuración de PM2
- `DEPLOY.md` - Guía completa de despliegue

## 🔍 Verificación

Después de iniciar los servicios:

```bash
# Verificar backend
curl http://localhost:5000/api/health

# Verificar frontend
curl http://localhost:3000
```

## 📚 Documentación Completa

Consulta `DEPLOY.md` para una guía detallada con todas las opciones de configuración.
