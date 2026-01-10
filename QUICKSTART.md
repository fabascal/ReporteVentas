# 🚀 Inicio Rápido

## Pasos para comenzar

### 1. Instalar dependencias

```bash
# Frontend
pnpm install

# Backend
cd server
pnpm install
cd ..
```

### 2. Configurar PostgreSQL

1. Asegúrate de que PostgreSQL esté corriendo
2. Crea la base de datos:
```sql
CREATE DATABASE repvtas;
```

3. Crea el archivo `.env` en la carpeta `server`:
```bash
cd server
cp .env.example .env
```

4. Edita `server/.env` con tus credenciales:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=repvtas
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu-secret-key-seguro
```

### 3. Inicializar datos de prueba

```bash
cd server
pnpm seed
```

Esto creará:
- 4 usuarios de prueba (uno por cada rol)
- 2 zonas
- 3 estaciones
- Asignaciones de usuarios a estaciones/zonas

**Credenciales de prueba:**
- Admin: `admin@repvtas.com` / `password123`
- Gerente Estación: `gerente.estacion@repvtas.com` / `password123`
- Gerente Zona: `gerente.zona@repvtas.com` / `password123`
- Director: `director@repvtas.com` / `password123`

### 4. Iniciar servidores

**Terminal 1 - Backend:**
```bash
cd server
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
```

### 5. Acceder a la aplicación

Abre tu navegador en: `http://localhost:3000`

Inicia sesión con cualquiera de las credenciales de prueba para ver los diferentes dashboards según el rol.

## 🎯 Próximos pasos

1. **Crear un reporte**: Inicia sesión como Gerente Estación y crea un reporte de ventas
2. **Aprobar reporte**: Inicia sesión como Gerente Zona y aprueba el reporte
3. **Ver estadísticas**: Inicia sesión como Director para ver los reportes aprobados y estadísticas

## ⚠️ Notas importantes

- Asegúrate de que PostgreSQL esté corriendo antes de iniciar el servidor
- El seed puede ejecutarse múltiples veces (eliminará datos existentes)
- Cambia el JWT_SECRET en producción
- Configura las credenciales de OAuth en `server/.env` si quieres usar autenticación social

