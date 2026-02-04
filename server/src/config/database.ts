import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'repvtas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

// Configurar el parser de tipos para que interprete TIMESTAMP (OID 1114) como UTC
pool.on('connect', (client) => {
  // Asegurar que la sesión use UTC
  client.query('SET timezone = "UTC"')
})

// OID 1114 es TIMESTAMP (sin zona horaria).
// Por defecto, pg lo interpreta en la hora local del servidor.
// Forzamos a que agregue 'Z' para que se interprete como UTC.
pg.types.setTypeParser(1114, (str) => {
  // Si la cadena ya tiene Z o offset, dejarla como está
  if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) {
    return new Date(str)
  }
  // Si no tiene zona horaria, agregar 'Z' para forzar UTC
  return new Date(str + 'Z')
})

export async function initDatabase() {
  try {
    // Test connection
    await pool.query('SELECT NOW()')
    console.log('✅ Database connected')

    // Create tables if they don't exist
    await createTables()
  } catch (error) {
    console.error('❌ Database connection error:', error)
    throw error
  }
}

async function createTables() {
  // Roles table (debe crearse antes de users)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      codigo VARCHAR(50) UNIQUE NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      descripcion TEXT,
      activo BOOLEAN DEFAULT true,
      orden INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Insertar roles por defecto si no existen
  await pool.query(`
    INSERT INTO roles (codigo, nombre, descripcion, orden, activo)
    VALUES 
      ('Administrador', 'Administrador', 'Acceso completo al sistema', 1, true),
      ('GerenteEstacion', 'Gerente de Estación', 'Gestiona reportes de estaciones asignadas', 2, true),
      ('GerenteZona', 'Gerente de Zona', 'Revisa y aprueba reportes de su zona', 3, true),
      ('Direccion', 'Dirección', 'Visualiza reportes aprobados', 4, true)
    ON CONFLICT (codigo) DO NOTHING
  `)

  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'GerenteEstacion', 'GerenteZona', 'Direccion')),
      oauth_provider VARCHAR(50),
      oauth_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Agregar columna role_id si no existe (migración)
  await pool.query(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role_id'
      ) THEN
        ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);
      END IF;
    END $$;
  `)

  // Agregar columnas para 2FA si no existen
  await pool.query(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'two_factor_secret'
      ) THEN
        ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'two_factor_enabled'
      ) THEN
        ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
      END IF;
    END $$;
  `)

  // Migrar roles existentes de VARCHAR a role_id
  await pool.query(`
    DO $$
    DECLARE
      user_record RECORD;
      role_uuid UUID;
    BEGIN
      -- Solo migrar si role_id es NULL y role tiene valor
      FOR user_record IN SELECT id, role FROM users WHERE role_id IS NULL AND role IS NOT NULL LOOP
        SELECT id INTO role_uuid FROM roles WHERE codigo = user_record.role;
        IF role_uuid IS NOT NULL THEN
          UPDATE users SET role_id = role_uuid WHERE id = user_record.id;
        END IF;
      END LOOP;
    END $$;
  `)

  // Zonas table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS zonas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(255) NOT NULL,
      activa BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Estaciones table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS estaciones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(255) NOT NULL,
      zona_id UUID REFERENCES zonas(id),
      activa BOOLEAN DEFAULT true,
      identificador_externo VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Add identificador_externo column if it doesn't exist (for existing databases)
  await pool.query(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'estaciones' AND column_name = 'identificador_externo'
      ) THEN
        ALTER TABLE estaciones ADD COLUMN identificador_externo VARCHAR(50);
      END IF;
      
      -- Agregar campos de configuración de productos
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'estaciones' AND column_name = 'tiene_premium'
      ) THEN
        ALTER TABLE estaciones ADD COLUMN tiene_premium BOOLEAN DEFAULT true;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'estaciones' AND column_name = 'tiene_magna'
      ) THEN
        ALTER TABLE estaciones ADD COLUMN tiene_magna BOOLEAN DEFAULT true;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'estaciones' AND column_name = 'tiene_diesel'
      ) THEN
        ALTER TABLE estaciones ADD COLUMN tiene_diesel BOOLEAN DEFAULT true;
      END IF;
    END $$;
  `)

  // User-Estaciones relationship (many-to-many)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_estaciones (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      estacion_id UUID REFERENCES estaciones(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, estacion_id)
    )
  `)

  // User-Zonas relationship (many-to-many)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_zonas (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      zona_id UUID REFERENCES zonas(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, zona_id)
    )
  `)

  // Reportes table (normalizada - solo campos generales)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reportes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      estacion_id UUID REFERENCES estaciones(id),
      fecha DATE NOT NULL,
      aceites DECIMAL(10, 2) DEFAULT 0,
      estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'EnRevision', 'Aprobado', 'Rechazado')),
      creado_por UUID REFERENCES users(id),
      revisado_por UUID REFERENCES users(id),
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_revision TIMESTAMP,
      comentarios TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Agregar columna aceites si no existe (para bases de datos existentes)
  await pool.query(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'aceites') THEN
        ALTER TABLE reportes ADD COLUMN aceites DECIMAL(10, 2) DEFAULT 0;
      END IF;
    END $$;
  `)

  // Tabla de auditoría/trazabilidad para reportes
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reportes_auditoria (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporte_id UUID REFERENCES reportes(id) ON DELETE CASCADE,
      usuario_id UUID REFERENCES users(id),
      usuario_nombre VARCHAR(255),
      accion VARCHAR(50) NOT NULL CHECK (accion IN ('CREAR', 'ACTUALIZAR', 'APROBAR', 'RECHAZAR', 'CAMBIO_ESTADO')),
      campo_modificado VARCHAR(100),
      valor_anterior TEXT,
      valor_nuevo TEXT,
      descripcion TEXT,
      fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Asegurar columna usuario_nombre para auditoría (compatibilidad con bases existentes)
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reportes_auditoria' AND column_name = 'usuario_nombre'
      ) THEN
        ALTER TABLE reportes_auditoria ADD COLUMN usuario_nombre VARCHAR(255);
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reportes_auditoria' AND column_name = 'fecha_reporte'
      ) THEN
        ALTER TABLE reportes_auditoria ADD COLUMN fecha_reporte DATE;
      END IF;
    END $$;
  `)

  // Crear índice para búsquedas rápidas
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reportes_auditoria_reporte_id ON reportes_auditoria(reporte_id);
    CREATE INDEX IF NOT EXISTS idx_reportes_auditoria_fecha ON reportes_auditoria(fecha_cambio DESC);
  `)

  // Tabla de auditoría general del sistema (gastos, entregas, cierres, etc.)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sistema_auditoria (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entidad_tipo VARCHAR(50) NOT NULL,
      entidad_id UUID,
      usuario_id UUID REFERENCES users(id),
      usuario_nombre VARCHAR(255),
      accion VARCHAR(50) NOT NULL,
      descripcion TEXT,
      datos_anteriores JSONB,
      datos_nuevos JSONB,
      metadata JSONB,
      fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Crear índices para la tabla de auditoría del sistema
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_sistema_auditoria_entidad ON sistema_auditoria(entidad_tipo, entidad_id);
    CREATE INDEX IF NOT EXISTS idx_sistema_auditoria_fecha ON sistema_auditoria(fecha_cambio DESC);
    CREATE INDEX IF NOT EXISTS idx_sistema_auditoria_usuario ON sistema_auditoria(usuario_id);
  `)

  // Configuracion table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracion (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clave VARCHAR(255) UNIQUE NOT NULL,
      valor TEXT,
      descripcion TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Productos Catalogo table (mejorada para soportar más tipos)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS productos_catalogo (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre_api VARCHAR(255) NOT NULL UNIQUE,
      nombre_display VARCHAR(255) NOT NULL,
      tipo_producto VARCHAR(50) NOT NULL,
      activo BOOLEAN DEFAULT true,
      orden INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Eliminar constraint restrictiva de tipo_producto si existe (migración)
  await pool.query(`
    DO $$ 
    BEGIN 
      -- Eliminar constraint antigua si existe
      IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'productos_catalogo_tipo_producto_check'
      ) THEN
        ALTER TABLE productos_catalogo DROP CONSTRAINT productos_catalogo_tipo_producto_check;
      END IF;
      
      -- Agregar columna orden si no existe
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos_catalogo' AND column_name = 'orden'
      ) THEN
        ALTER TABLE productos_catalogo ADD COLUMN orden INTEGER DEFAULT 0;
      END IF;
    END $$;
  `)

  // Tabla normalizada para productos de reportes
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reporte_productos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporte_id UUID REFERENCES reportes(id) ON DELETE CASCADE,
      producto_id UUID REFERENCES productos_catalogo(id),
      precio DECIMAL(10, 2) NOT NULL,
      litros DECIMAL(10, 2) NOT NULL,
      importe DECIMAL(10, 2) NOT NULL DEFAULT 0,
      merma_volumen DECIMAL(10, 2) DEFAULT 0,
      merma_importe DECIMAL(10, 2) DEFAULT 0,
      merma_porcentaje DECIMAL(10, 6) DEFAULT 0,
      iib DECIMAL(10, 2) DEFAULT 0,
      compras DECIMAL(10, 2) DEFAULT 0,
      cct DECIMAL(10, 2) DEFAULT 0,
      v_dsc DECIMAL(10, 2) DEFAULT 0,
      dc DECIMAL(10, 2) DEFAULT 0,
      dif_v_dsc DECIMAL(10, 2) DEFAULT 0,
      if DECIMAL(10, 2) DEFAULT 0,
      iffb DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reporte_id, producto_id)
    )
  `)

  // Crear índices para reporte_productos
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reporte_productos_reporte_id ON reporte_productos(reporte_id);
    CREATE INDEX IF NOT EXISTS idx_reporte_productos_producto_id ON reporte_productos(producto_id);
  `)

  // Menus table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menus (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      menu_id VARCHAR(255) UNIQUE NOT NULL,
      tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('route', 'view')),
      path VARCHAR(500),
      view_id VARCHAR(255),
      label VARCHAR(255) NOT NULL,
      icon VARCHAR(100) NOT NULL,
      orden INTEGER DEFAULT 0,
      requiere_exact_match BOOLEAN DEFAULT false,
      activo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Menu-Roles relationship (many-to-many)
  // Primero crear la tabla con la estructura antigua si no existe
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_roles (
      menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'GerenteEstacion', 'GerenteZona', 'Direccion')),
      PRIMARY KEY (menu_id, role)
    )
  `)

  // Agregar columna role_id si no existe (migración)
  await pool.query(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu_roles' AND column_name = 'role_id'
      ) THEN
        ALTER TABLE menu_roles ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `)

  // Migrar menu_roles existentes de VARCHAR a role_id
  await pool.query(`
    DO $$
    DECLARE
      menu_role_record RECORD;
      role_uuid UUID;
    BEGIN
      -- Solo migrar si role_id es NULL y role tiene valor
      FOR menu_role_record IN SELECT menu_id, role FROM menu_roles WHERE role_id IS NULL AND role IS NOT NULL LOOP
        SELECT id INTO role_uuid FROM roles WHERE codigo = menu_role_record.role;
        IF role_uuid IS NOT NULL THEN
          -- Verificar si ya existe la combinación menu_id + role_id
          IF NOT EXISTS (SELECT 1 FROM menu_roles WHERE menu_id = menu_role_record.menu_id AND role_id = role_uuid) THEN
            UPDATE menu_roles SET role_id = role_uuid WHERE menu_id = menu_role_record.menu_id AND role = menu_role_record.role;
          ELSE
            -- Si ya existe, eliminar el duplicado
            DELETE FROM menu_roles WHERE menu_id = menu_role_record.menu_id AND role = menu_role_record.role;
          END IF;
        END IF;
      END LOOP;
    END $$;
  `)

  // Cambiar PRIMARY KEY a (menu_id, role_id) si la tabla tiene datos migrados
  try {
    await pool.query(`
      DO $$
      BEGIN
        -- Solo intentar cambiar la PK si no existe ya una constraint con role_id
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'menu_roles_pkey' 
          AND conrelid = 'menu_roles'::regclass
          AND array_length(conkey, 1) = 2
          AND EXISTS (
            SELECT 1 FROM pg_attribute 
            WHERE attrelid = 'menu_roles'::regclass 
            AND attname = 'role_id' 
            AND attnum = ANY(conkey)
          )
        ) THEN
          -- Verificar que todos los registros tengan role_id y no haya duplicados
          IF NOT EXISTS (SELECT 1 FROM menu_roles WHERE role_id IS NULL)
            AND NOT EXISTS (
              SELECT menu_id, role_id, COUNT(*) 
              FROM menu_roles 
              WHERE role_id IS NOT NULL 
              GROUP BY menu_id, role_id 
              HAVING COUNT(*) > 1
            ) THEN
            -- Eliminar la PK antigua y crear la nueva
            ALTER TABLE menu_roles DROP CONSTRAINT IF EXISTS menu_roles_pkey;
            ALTER TABLE menu_roles ADD PRIMARY KEY (menu_id, role_id);
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No se pudo cambiar la PRIMARY KEY de menu_roles: %', SQLERRM;
      END $$;
    `)
  } catch (error) {
    console.warn('⚠️  Advertencia: No se pudo cambiar la PRIMARY KEY de menu_roles. Continuando...', error)
  }

  // Tabla de usuarios API externos
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      api_key VARCHAR(255) UNIQUE NOT NULL,
      api_secret VARCHAR(255) NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      estaciones_permitidas UUID[],
      activo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)

  // Insertar usuario API demo si no existe
  await pool.query(`
    INSERT INTO api_users (api_key, api_secret, nombre, estaciones_permitidas, activo)
    VALUES ('demo_api_user', 'demo_secret_123', 'Usuario API Demo', ARRAY[]::UUID[], true)
    ON CONFLICT (api_key) DO NOTHING
  `)

  // Insertar productos por defecto si no existen
  await pool.query(`
    INSERT INTO productos_catalogo (nombre_api, nombre_display, tipo_producto, activo)
    VALUES 
      ('91 Octanos', 'Premium', 'premium', true),
      ('87 Octanos', 'Magna', 'magna', true),
      ('Diesel', 'Diesel', 'diesel', true)
    ON CONFLICT (nombre_api) DO NOTHING
  `)

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reportes_estacion ON reportes(estacion_id);
    CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes(fecha);
    CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
    CREATE INDEX IF NOT EXISTS idx_reportes_creado_por ON reportes(creado_por);
    CREATE INDEX IF NOT EXISTS idx_estaciones_identificador_externo ON estaciones(identificador_externo);
    CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion(clave);
    CREATE INDEX IF NOT EXISTS idx_menus_menu_id ON menus(menu_id);
    CREATE INDEX IF NOT EXISTS idx_menu_roles_menu_id ON menu_roles(menu_id);
    CREATE INDEX IF NOT EXISTS idx_menu_roles_role_id ON menu_roles(role_id);
    CREATE INDEX IF NOT EXISTS idx_roles_codigo ON roles(codigo);
    CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
  `)

  console.log('✅ Database tables created/verified')
}
