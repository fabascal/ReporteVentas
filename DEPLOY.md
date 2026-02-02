# 🚀 Guía de Despliegue en Producción

Esta guía te ayudará a desplegar el sistema RepVtas en un servidor de producción.

## 📋 Prerrequisitos

- Acceso sudo al servidor
- Conexión a internet
- Puerto 3000 y 5000 disponibles (o configurar otros puertos)

## 🔧 Paso 1: Instalar Dependencias del Sistema

Ejecuta el script de instalación:

```bash
cd /home/webops/ReporteVentas
bash install.sh
```

Este script instalará:
- Node.js 20.x
- pnpm
- PostgreSQL

**Nota:** Si no tienes acceso sudo, instala estas herramientas manualmente.

## 🗄️ Paso 2: Configurar Base de Datos

Ejecuta el script de configuración de base de datos:

```bash
bash setup-db.sh
```

Este script:
- Creará el usuario de PostgreSQL (si no existe)
- Creará la base de datos `repvtas`
- Configurará los permisos necesarios

**Alternativa manual:**
```bash
sudo -u postgres psql
CREATE DATABASE repvtas;
CREATE USER tu_usuario WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE repvtas TO tu_usuario;
\q
```

## ⚙️ Paso 3: Configurar Variables de Entorno

Ejecuta el script de configuración:

```bash
bash setup-env.sh
```

Este script creará el archivo `server/.env` con todas las variables necesarias.

**Alternativa manual:**
Copia el contenido de `server/ENV_SETUP.md` y crea `server/.env` con tus valores.

## 📦 Paso 4: Instalar Dependencias del Proyecto

```bash
# Instalar dependencias del frontend
pnpm install

# Instalar dependencias del backend
cd server
pnpm install
cd ..
```

## 🌱 Paso 5: Inicializar Base de Datos (Opcional)

Si deseas datos de prueba:

```bash
cd server
pnpm seed
cd ..
```

Esto creará usuarios de prueba y datos iniciales.

## 🔨 Paso 6: Compilar para Producción

```bash
# Compilar frontend
pnpm build

# Compilar backend
cd server
pnpm build
cd ..
```

O usa el script de despliegue:

```bash
bash deploy.sh
```

## 🚀 Paso 7: Ejecutar en Producción

### Opción 1: Usando PM2 (Recomendado)

1. Instalar PM2 globalmente:
```bash
npm install -g pm2
```

2. Crear directorio de logs:
```bash
mkdir -p logs
```

3. Iniciar aplicaciones:
```bash
pm2 start ecosystem.config.js
```

4. Guardar configuración para reinicio automático:
```bash
pm2 save
pm2 startup
```

5. Verificar estado:
```bash
pm2 status
pm2 logs
```

### Opción 2: Usando systemd

Crea un servicio systemd para el backend:

```bash
sudo nano /etc/systemd/system/repvtas-backend.service
```

Contenido:
```ini
[Unit]
Description=RepVtas Backend
After=network.target postgresql.service

[Service]
Type=simple
User=webops
WorkingDirectory=/home/webops/ReporteVentas/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activar servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable repvtas-backend
sudo systemctl start repvtas-backend
sudo systemctl status repvtas-backend
```

Para el frontend, usa nginx o un servidor web estático.

### Opción 3: Ejecutar Manualmente

**Backend:**
```bash
cd server
NODE_ENV=production pnpm start
```

**Frontend:**
Usa nginx o cualquier servidor web estático para servir los archivos de `dist/`.

## 🌐 Paso 8: Configurar Nginx (Opcional pero Recomendado)

Crea un archivo de configuración de nginx:

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
        root /home/webops/ReporteVentas/dist;
        try_files $uri $uri/ /index.html;
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

Activar configuración:
```bash
sudo ln -s /etc/nginx/sites-available/repvtas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Paso 9: Configurar Firewall

Si usas ufw:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## ✅ Verificación

1. Verifica que el backend esté corriendo:
```bash
curl http://localhost:5000/api/health
```

2. Verifica que el frontend esté accesible:
```bash
curl http://localhost:3000
```

## 📝 Notas Importantes

- **JWT_SECRET**: Cambia el JWT_SECRET en producción por uno seguro y único
- **Base de datos**: Realiza backups regulares de PostgreSQL
- **Logs**: Revisa los logs regularmente en `logs/` o usando `pm2 logs`
- **SSL**: Configura HTTPS en producción usando Let's Encrypt
- **Variables de entorno**: Nunca commitees el archivo `.env` al repositorio

## 🔄 Actualizar la Aplicación

Para actualizar la aplicación:

```bash
cd /home/webops/ReporteVentas
git pull
bash deploy.sh
pm2 restart all  # Si usas PM2
# O
sudo systemctl restart repvtas-backend  # Si usas systemd
```

## 🆘 Solución de Problemas

### El backend no inicia
- Verifica que PostgreSQL esté corriendo: `sudo systemctl status postgresql`
- Verifica las credenciales en `server/.env`
- Revisa los logs: `pm2 logs repvtas-backend` o `journalctl -u repvtas-backend`

### El frontend no carga
- Verifica que el build se haya completado: `ls -la dist/`
- Verifica que el servidor web esté configurado correctamente
- Revisa la consola del navegador para errores

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `server/.env`
- Verifica que la base de datos exista: `sudo -u postgres psql -l`
