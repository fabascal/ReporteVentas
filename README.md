# RepVtas - Sistema de Reportes de Ventas

Sistema de gestión de reportes de ventas para estaciones de servicio con control de roles y flujo de aprobación.

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL
- **Estilos**: Tailwind CSS 4
- **Gestor de paquetes**: pnpm
- **Autenticación**: JWT + OAuth (Google, GitHub)

## 📋 Características

- ✅ Autenticación con JWT y OAuth (Google, GitHub)
- ✅ Sistema de roles: Administrador, GerenteEstacion, GerenteZona, Direccion
- ✅ Rutas protegidas por roles
- ✅ Captura de reportes de ventas (Premium, Magna, Diesel)
- ✅ Flujo de aprobación: GerenteEstacion → GerenteZona → Direccion
- ✅ Dashboard específico para cada rol

## 🛠️ Instalación

### Prerrequisitos

- Node.js 20+
- pnpm
- PostgreSQL 14+

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias del frontend
pnpm install

# Instalar dependencias del backend
cd server
pnpm install
```

### 2. Configurar base de datos

1. Crear base de datos PostgreSQL:
```sql
CREATE DATABASE repvtas;
```

2. Copiar archivo de variables de entorno:
```bash
cd server
cp .env.example .env
```

3. Editar `.env` con tus credenciales de PostgreSQL:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=repvtas
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu-secret-key-seguro
```

### 3. Inicializar datos de prueba (opcional)

```bash
cd server
pnpm seed
```

Esto creará usuarios de prueba y datos iniciales. Verás las credenciales en la consola.

### 4. Ejecutar el proyecto

**Terminal 1 - Backend:**
```bash
cd server
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
```

El frontend estará disponible en `http://localhost:3000`
El backend estará disponible en `http://localhost:5000`

## 📁 Estructura del Proyecto

```
RepVtas/
├── src/                    # Código fuente del frontend
│   ├── components/         # Componentes React
│   ├── contexts/           # Context API (Auth)
│   ├── pages/              # Páginas/Views
│   ├── services/           # Servicios API
│   └── types/              # TypeScript types
├── server/                 # Backend
│   ├── src/
│   │   ├── config/         # Configuración (DB)
│   │   ├── controllers/    # Controladores
│   │   ├── middleware/     # Middleware (auth)
│   │   ├── routes/         # Rutas API
│   │   └── types/          # TypeScript types
│   └── package.json
├── demo/                   # Carpetas de demo
│   ├── dashboard_del_director/
│   ├── dashboard_del_gerente/
│   ├── dashboard_del_gerente_de_zona/
│   ├── formulario_de_captura_de_ventas/
│   └── inicio_de_sesión/
└── package.json
```

## 👥 Roles y Permisos

### Administrador
- Acceso completo al sistema
- Gestión de usuarios y estaciones

### GerenteEstacion
- Crear reportes de ventas
- Ver sus propios reportes
- Asignado a estaciones específicas

### GerenteZona
- Revisar y aprobar/rechazar reportes
- Ver reportes de estaciones en sus zonas asignadas

### Direccion
- Ver solo reportes aprobados
- Dashboard con estadísticas y totales

## 🔐 Autenticación

El sistema soporta:
- Login tradicional (email/password)
- OAuth con Google
- OAuth con GitHub

## 📊 Flujo de Reportes

1. **GerenteEstacion** crea un reporte con:
   - Precio y litros vendidos de Premium
   - Precio y litros vendidos de Magna
   - Precio y litros vendidos de Diesel

2. **GerenteZona** revisa y puede:
   - Aprobar el reporte
   - Rechazarlo con comentarios

3. **Direccion** visualiza:
   - Solo reportes aprobados
   - Estadísticas y totales por tipo de combustible

## 🗄️ Base de Datos

Las tablas se crean automáticamente al iniciar el servidor:
- `users` - Usuarios del sistema
- `zonas` - Zonas geográficas
- `estaciones` - Estaciones de servicio
- `reportes` - Reportes de ventas
- `user_estaciones` - Relación usuarios-estaciones
- `user_zonas` - Relación usuarios-zonas

## 🔧 Scripts Disponibles

**Frontend:**
- `pnpm dev` - Servidor de desarrollo
- `pnpm build` - Build de producción
- `pnpm preview` - Preview del build

**Backend:**
- `pnpm dev` - Servidor de desarrollo con hot reload
- `pnpm build` - Compilar TypeScript
- `pnpm start` - Ejecutar servidor en producción
- `pnpm seed` - Poblar base de datos con datos de prueba

## 📝 Notas

- Asegúrate de tener PostgreSQL corriendo antes de iniciar el servidor
- El JWT_SECRET debe ser cambiado en producción
- Las credenciales de OAuth deben configurarse en el archivo `.env` del servidor

