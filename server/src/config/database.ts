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

  // Agregar columnas de importe y merma si no existen (para bases de datos existentes)
  await pool.query(`
    DO $$ 
    BEGIN 
      -- Premium
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_importe') THEN
        ALTER TABLE reportes ADD COLUMN premium_importe DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_merma_volumen') THEN
        ALTER TABLE reportes ADD COLUMN premium_merma_volumen DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_merma_importe') THEN
        ALTER TABLE reportes ADD COLUMN premium_merma_importe DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_merma_porcentaje') THEN
        ALTER TABLE reportes ADD COLUMN premium_merma_porcentaje DECIMAL(10, 6) DEFAULT 0;
      END IF;
      -- Migrar premium_merma a premium_merma_volumen si existe
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_merma') THEN
        UPDATE reportes SET premium_merma_volumen = premium_merma WHERE premium_merma_volumen = 0 AND premium_merma > 0;
        ALTER TABLE reportes DROP COLUMN IF EXISTS premium_merma;
      END IF;
      
      -- Magna
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_importe') THEN
        ALTER TABLE reportes ADD COLUMN magna_importe DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_merma_volumen') THEN
        ALTER TABLE reportes ADD COLUMN magna_merma_volumen DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_merma_importe') THEN
        ALTER TABLE reportes ADD COLUMN magna_merma_importe DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_merma_porcentaje') THEN
        ALTER TABLE reportes ADD COLUMN magna_merma_porcentaje DECIMAL(10, 6) DEFAULT 0;
      END IF;
      -- Migrar magna_merma a magna_merma_volumen si existe
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_merma') THEN
        UPDATE reportes SET magna_merma_volumen = magna_merma WHERE magna_merma_volumen = 0 AND magna_merma > 0;
        ALTER TABLE reportes DROP COLUMN IF EXISTS magna_merma;
      END IF;
      
      -- Diesel
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_importe') THEN
        ALTER TABLE reportes ADD COLUMN diesel_importe DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_merma_volumen') THEN
        ALTER TABLE reportes ADD COLUMN diesel_merma_volumen DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_merma_importe') THEN
        ALTER TABLE reportes ADD COLUMN diesel_merma_importe DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_merma_porcentaje') THEN
        ALTER TABLE reportes ADD COLUMN diesel_merma_porcentaje DECIMAL(10, 6) DEFAULT 0;
      END IF;
      -- Migrar diesel_merma a diesel_merma_volumen si existe
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_merma') THEN
        UPDATE reportes SET diesel_merma_volumen = diesel_merma WHERE diesel_merma_volumen = 0 AND diesel_merma > 0;
        ALTER TABLE reportes DROP COLUMN IF EXISTS diesel_merma;
      END IF;
    END $$;
  `)

  // Agregar nuevos campos de inventario y compras si no existen
  await pool.query(`
    DO $$ 
    BEGIN 
      -- Aceites (campo único a nivel de reporte, no por producto)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'aceites') THEN
        ALTER TABLE reportes ADD COLUMN aceites DECIMAL(10, 2) DEFAULT 0;
      END IF;
      
      -- Eliminar campos de aceites por producto si existen (migración)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_aceites') THEN
        -- Migrar datos: sumar los tres valores y guardar en aceites
        UPDATE reportes SET aceites = COALESCE(premium_aceites, 0) + COALESCE(magna_aceites, 0) + COALESCE(diesel_aceites, 0) WHERE aceites = 0;
        -- Eliminar columnas por producto
        ALTER TABLE reportes DROP COLUMN IF EXISTS premium_aceites;
        ALTER TABLE reportes DROP COLUMN IF EXISTS magna_aceites;
        ALTER TABLE reportes DROP COLUMN IF EXISTS diesel_aceites;
      END IF;
      
      -- Premium
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_iib') THEN
        ALTER TABLE reportes ADD COLUMN premium_iib DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_compras') THEN
        ALTER TABLE reportes ADD COLUMN premium_compras DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_cct') THEN
        ALTER TABLE reportes ADD COLUMN premium_cct DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_v_dsc') THEN
        ALTER TABLE reportes ADD COLUMN premium_v_dsc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_dc') THEN
        ALTER TABLE reportes ADD COLUMN premium_dc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_dif_v_dsc') THEN
        ALTER TABLE reportes ADD COLUMN premium_dif_v_dsc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_if') THEN
        ALTER TABLE reportes ADD COLUMN premium_if DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'premium_iffb') THEN
        ALTER TABLE reportes ADD COLUMN premium_iffb DECIMAL(10, 2) DEFAULT 0;
      END IF;
      
      -- Magna
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_iib') THEN
        ALTER TABLE reportes ADD COLUMN magna_iib DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_compras') THEN
        ALTER TABLE reportes ADD COLUMN magna_compras DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_cct') THEN
        ALTER TABLE reportes ADD COLUMN magna_cct DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_v_dsc') THEN
        ALTER TABLE reportes ADD COLUMN magna_v_dsc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_dc') THEN
        ALTER TABLE reportes ADD COLUMN magna_dc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_dif_v_dsc') THEN
        ALTER TABLE reportes ADD COLUMN magna_dif_v_dsc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_if') THEN
        ALTER TABLE reportes ADD COLUMN magna_if DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'magna_iffb') THEN
        ALTER TABLE reportes ADD COLUMN magna_iffb DECIMAL(10, 2) DEFAULT 0;
      END IF;
      
      -- Diesel
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_iib') THEN
        ALTER TABLE reportes ADD COLUMN diesel_iib DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_compras') THEN
        ALTER TABLE reportes ADD COLUMN diesel_compras DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_cct') THEN
        ALTER TABLE reportes ADD COLUMN diesel_cct DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_v_dsc') THEN
        ALTER TABLE reportes ADD COLUMN diesel_v_dsc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_dc') THEN
        ALTER TABLE reportes ADD COLUMN diesel_dc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_dif_v_dsc') THEN
        ALTER TABLE reportes ADD COLUMN diesel_dif_v_dsc DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_if') THEN
        ALTER TABLE reportes ADD COLUMN diesel_if DECIMAL(10, 2) DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reportes' AND column_name = 'diesel_iffb') THEN
        ALTER TABLE reportes ADD COLUMN diesel_iffb DECIMAL(10, 2) DEFAULT 0;
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

  // Crear índice para búsquedas rápidas
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reportes_auditoria_reporte_id ON reportes_auditoria(reporte_id);
    CREATE INDEX IF NOT EXISTS idx_reportes_auditoria_fecha ON reportes_auditoria(fecha_cambio DESC);
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
  // Nota: Esto solo se ejecutará si no hay conflictos y se hace de forma segura
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
        -- Si hay algún error, simplemente continuar sin cambiar la PK
        -- La tabla seguirá funcionando con la PK antigua
        RAISE NOTICE 'No se pudo cambiar la PRIMARY KEY de menu_roles: %', SQLERRM;
      END $$;
    `)
  } catch (error) {
    // Si hay un error en la migración de la PK, solo loguearlo pero no fallar
    console.warn('⚠️  Advertencia: No se pudo cambiar la PRIMARY KEY de menu_roles. Continuando...', error)
  }

  // Insertar productos por defecto si no existen
  await pool.query(`
    INSERT INTO productos_catalogo (nombre_api, nombre_display, tipo_producto, activo)
    VALUES 
      ('91 Octanos', 'Premium', 'premium', true),
      ('87 Octanos', 'Magna', 'magna', true),
      ('Diesel', 'Diesel', 'diesel', true)
    ON CONFLICT (nombre_api) DO NOTHING
  `)

  // Migrar menús iniciales desde menuConfig.ts si no existen
  await pool.query(`
    DO $$
    DECLARE
      menu_record RECORD;
      role_name VARCHAR(50);
    BEGIN
      -- Admin routes
      INSERT INTO menus (menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match, activo)
      VALUES 
        ('admin-resumen', 'route', '/admin', NULL, 'Resumen', 'dashboard', 1, true, true),
        ('admin-usuarios', 'route', '/admin/usuarios', NULL, 'Usuarios', 'people', 2, false, false),
        ('admin-reportes', 'route', '/admin/reportes', NULL, 'Reportes', 'description', 3, false, true),
        ('admin-zonas', 'route', '/admin/zonas-estaciones', NULL, 'Zonas', 'location_on', 4, false, false),
        ('admin-configuracion', 'route', '/admin/configuracion', NULL, 'Configuración', 'settings', 5, false, true),
        ('admin-productos', 'route', '/admin/productos', NULL, 'Productos', 'inventory_2', 6, false, false),
        ('admin-logs', 'route', '/admin/logs', NULL, 'Logs', 'history', 7, false, true)
      ON CONFLICT (menu_id) DO UPDATE SET 
        tipo = EXCLUDED.tipo,
        path = EXCLUDED.path,
        view_id = EXCLUDED.view_id,
        label = EXCLUDED.label,
        icon = EXCLUDED.icon,
        orden = EXCLUDED.orden,
        requiere_exact_match = EXCLUDED.requiere_exact_match,
        activo = EXCLUDED.activo;
      
      -- Desactivar menús de Usuarios, Zonas y Productos (ahora están en Configuración)
      UPDATE menus SET activo = false WHERE menu_id IN ('admin-usuarios', 'admin-zonas', 'admin-productos');

      -- GerenteEstacion views
      INSERT INTO menus (menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match, activo)
      VALUES 
        ('gerente-estacion-dashboard', 'view', NULL, 'dashboard', 'Dashboard', 'dashboard', 0, false, true),
        ('gerente-estacion-reportes', 'view', NULL, 'reportes', 'Reportes de Ventas', 'description', 1, false, true),
        ('gerente-estacion-nueva-captura', 'view', NULL, 'nuevaCaptura', 'Nueva Captura', 'add', 2, false, true),
        ('gerente-estacion-historial', 'view', NULL, 'historial', 'Historial', 'history', 3, false, true)
      ON CONFLICT (menu_id) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        path = EXCLUDED.path,
        view_id = EXCLUDED.view_id,
        label = EXCLUDED.label,
        icon = EXCLUDED.icon,
        orden = EXCLUDED.orden,
        requiere_exact_match = EXCLUDED.requiere_exact_match,
        activo = EXCLUDED.activo;

      -- GerenteZona views
      INSERT INTO menus (menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match, activo)
      VALUES 
        ('gerente-zona-dashboard', 'view', NULL, 'dashboard', 'Dashboard', 'dashboard', 1, false, true),
        ('gerente-zona-revision', 'view', NULL, 'revision', 'Revisión', 'task_alt', 2, false, true),
        ('gerente-zona-historial', 'view', NULL, 'historial', 'Historial', 'history', 3, false, true)
      ON CONFLICT (menu_id) DO NOTHING;

      -- Director views
      INSERT INTO menus (menu_id, tipo, path, view_id, label, icon, orden, requiere_exact_match, activo)
      VALUES 
        ('director-resumen', 'view', NULL, 'resumen', 'Resumen', 'dashboard', 1, false, true)
      ON CONFLICT (menu_id) DO NOTHING;

      -- Asignar roles a los menús usando role_id
      -- Admin menus -> Administrador
      FOR menu_record IN SELECT id FROM menus WHERE menu_id LIKE 'admin-%' LOOP
        INSERT INTO menu_roles (menu_id, role_id, role)
        SELECT menu_record.id, r.id, r.codigo
        FROM roles r WHERE r.codigo = 'Administrador'
        ON CONFLICT (menu_id, role_id) DO NOTHING;
      END LOOP;

      -- Asignar menús de historial al Administrador también
      FOR menu_record IN SELECT id FROM menus WHERE menu_id IN ('gerente-estacion-historial', 'gerente-zona-historial') LOOP
        INSERT INTO menu_roles (menu_id, role_id, role)
        SELECT menu_record.id, r.id, r.codigo
        FROM roles r WHERE r.codigo = 'Administrador'
        ON CONFLICT (menu_id, role_id) DO NOTHING;
      END LOOP;

      -- GerenteEstacion menus -> GerenteEstacion
      FOR menu_record IN SELECT id FROM menus WHERE menu_id LIKE 'gerente-estacion-%' LOOP
        INSERT INTO menu_roles (menu_id, role_id, role)
        SELECT menu_record.id, r.id, r.codigo
        FROM roles r WHERE r.codigo = 'GerenteEstacion'
        ON CONFLICT (menu_id, role_id) DO NOTHING;
      END LOOP;

      -- GerenteZona menus -> GerenteZona
      FOR menu_record IN SELECT id FROM menus WHERE menu_id LIKE 'gerente-zona-%' LOOP
        INSERT INTO menu_roles (menu_id, role_id, role)
        SELECT menu_record.id, r.id, r.codigo
        FROM roles r WHERE r.codigo = 'GerenteZona'
        ON CONFLICT (menu_id, role_id) DO NOTHING;
      END LOOP;

      -- Director menus -> Direccion
      FOR menu_record IN SELECT id FROM menus WHERE menu_id LIKE 'director-%' LOOP
        INSERT INTO menu_roles (menu_id, role_id, role)
        SELECT menu_record.id, r.id, r.codigo
        FROM roles r WHERE r.codigo = 'Direccion'
        ON CONFLICT (menu_id, role_id) DO NOTHING;
      END LOOP;
    END $$;
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

  // Migración: Mover datos de reportes a reporte_productos (solo si la tabla reporte_productos está vacía)
  await pool.query(`
    DO $$
    DECLARE
      producto_premium_id UUID;
      producto_magna_id UUID;
      producto_diesel_id UUID;
      reporte_record RECORD;
      total_migrados INTEGER := 0;
    BEGIN
      -- Verificar si ya se migró (si reporte_productos tiene datos, no migrar)
      IF EXISTS (SELECT 1 FROM reporte_productos LIMIT 1) THEN
        RAISE NOTICE 'Los datos ya fueron migrados a reporte_productos. Saltando migración.';
        RETURN;
      END IF;

      -- Obtener o crear IDs de productos
      SELECT id INTO producto_premium_id FROM productos_catalogo WHERE nombre_api = '91 Octanos' OR tipo_producto = 'premium' LIMIT 1;
      IF producto_premium_id IS NULL THEN
        INSERT INTO productos_catalogo (nombre_api, nombre_display, tipo_producto, activo, orden)
        VALUES ('91 Octanos', 'Premium', 'premium', true, 1)
        RETURNING id INTO producto_premium_id;
      END IF;

      SELECT id INTO producto_magna_id FROM productos_catalogo WHERE nombre_api = '87 Octanos' OR tipo_producto = 'magna' LIMIT 1;
      IF producto_magna_id IS NULL THEN
        INSERT INTO productos_catalogo (nombre_api, nombre_display, tipo_producto, activo, orden)
        VALUES ('87 Octanos', 'Magna', 'magna', true, 2)
        RETURNING id INTO producto_magna_id;
      END IF;

      SELECT id INTO producto_diesel_id FROM productos_catalogo WHERE nombre_api = 'Diesel' OR tipo_producto = 'diesel' LIMIT 1;
      IF producto_diesel_id IS NULL THEN
        INSERT INTO productos_catalogo (nombre_api, nombre_display, tipo_producto, activo, orden)
        VALUES ('Diesel', 'Diesel', 'diesel', true, 3)
        RETURNING id INTO producto_diesel_id;
      END IF;

      -- Migrar datos de reportes a reporte_productos
      FOR reporte_record IN 
        SELECT 
          id,
          premium_precio, premium_litros, premium_importe,
          premium_merma_volumen, premium_merma_importe, premium_merma_porcentaje,
          premium_iib, premium_compras, premium_cct, premium_v_dsc, premium_dc, premium_dif_v_dsc, premium_if, premium_iffb,
          magna_precio, magna_litros, magna_importe,
          magna_merma_volumen, magna_merma_importe, magna_merma_porcentaje,
          magna_iib, magna_compras, magna_cct, magna_v_dsc, magna_dc, magna_dif_v_dsc, magna_if, magna_iffb,
          diesel_precio, diesel_litros, diesel_importe,
          diesel_merma_volumen, diesel_merma_importe, diesel_merma_porcentaje,
          diesel_iib, diesel_compras, diesel_cct, diesel_v_dsc, diesel_dc, diesel_dif_v_dsc, diesel_if, diesel_iffb
        FROM reportes
        WHERE id NOT IN (SELECT DISTINCT reporte_id FROM reporte_productos WHERE reporte_id IS NOT NULL)
      LOOP
        -- Premium
        INSERT INTO reporte_productos (
          reporte_id, producto_id, precio, litros, importe,
          merma_volumen, merma_importe, merma_porcentaje,
          iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb
        ) VALUES (
          reporte_record.id, producto_premium_id,
          COALESCE(reporte_record.premium_precio, 0),
          COALESCE(reporte_record.premium_litros, 0),
          COALESCE(reporte_record.premium_importe, 0),
          COALESCE(reporte_record.premium_merma_volumen, 0),
          COALESCE(reporte_record.premium_merma_importe, 0),
          COALESCE(reporte_record.premium_merma_porcentaje, 0),
          COALESCE(reporte_record.premium_iib, 0),
          COALESCE(reporte_record.premium_compras, 0),
          COALESCE(reporte_record.premium_cct, 0),
          COALESCE(reporte_record.premium_v_dsc, 0),
          COALESCE(reporte_record.premium_dc, 0),
          COALESCE(reporte_record.premium_dif_v_dsc, 0),
          COALESCE(reporte_record.premium_if, 0),
          COALESCE(reporte_record.premium_iffb, 0)
        ) ON CONFLICT (reporte_id, producto_id) DO NOTHING;

        -- Magna
        INSERT INTO reporte_productos (
          reporte_id, producto_id, precio, litros, importe,
          merma_volumen, merma_importe, merma_porcentaje,
          iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb
        ) VALUES (
          reporte_record.id, producto_magna_id,
          COALESCE(reporte_record.magna_precio, 0),
          COALESCE(reporte_record.magna_litros, 0),
          COALESCE(reporte_record.magna_importe, 0),
          COALESCE(reporte_record.magna_merma_volumen, 0),
          COALESCE(reporte_record.magna_merma_importe, 0),
          COALESCE(reporte_record.magna_merma_porcentaje, 0),
          COALESCE(reporte_record.magna_iib, 0),
          COALESCE(reporte_record.magna_compras, 0),
          COALESCE(reporte_record.magna_cct, 0),
          COALESCE(reporte_record.magna_v_dsc, 0),
          COALESCE(reporte_record.magna_dc, 0),
          COALESCE(reporte_record.magna_dif_v_dsc, 0),
          COALESCE(reporte_record.magna_if, 0),
          COALESCE(reporte_record.magna_iffb, 0)
        ) ON CONFLICT (reporte_id, producto_id) DO NOTHING;

        -- Diesel
        INSERT INTO reporte_productos (
          reporte_id, producto_id, precio, litros, importe,
          merma_volumen, merma_importe, merma_porcentaje,
          iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb
        ) VALUES (
          reporte_record.id, producto_diesel_id,
          COALESCE(reporte_record.diesel_precio, 0),
          COALESCE(reporte_record.diesel_litros, 0),
          COALESCE(reporte_record.diesel_importe, 0),
          COALESCE(reporte_record.diesel_merma_volumen, 0),
          COALESCE(reporte_record.diesel_merma_importe, 0),
          COALESCE(reporte_record.diesel_merma_porcentaje, 0),
          COALESCE(reporte_record.diesel_iib, 0),
          COALESCE(reporte_record.diesel_compras, 0),
          COALESCE(reporte_record.diesel_cct, 0),
          COALESCE(reporte_record.diesel_v_dsc, 0),
          COALESCE(reporte_record.diesel_dc, 0),
          COALESCE(reporte_record.diesel_dif_v_dsc, 0),
          COALESCE(reporte_record.diesel_if, 0),
          COALESCE(reporte_record.diesel_iffb, 0)
        ) ON CONFLICT (reporte_id, producto_id) DO NOTHING;

        total_migrados := total_migrados + 1;
      END LOOP;

      IF total_migrados > 0 THEN
        RAISE NOTICE 'Migración completada: % reportes migrados a reporte_productos', total_migrados;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error en migración: %', SQLERRM;
    END $$;
  `)

  // Migración: Eliminar columnas obsoletas de reportes (solo si los datos ya fueron migrados)
  await pool.query(`
    DO $$
    DECLARE
      columnas_obsoletas TEXT[] := ARRAY[
        'premium_precio', 'premium_litros', 'premium_importe',
        'premium_merma_volumen', 'premium_merma_importe', 'premium_merma_porcentaje',
        'premium_iib', 'premium_compras', 'premium_cct', 'premium_v_dsc', 
        'premium_dc', 'premium_dif_v_dsc', 'premium_if', 'premium_iffb',
        'premium_aceites',
        'magna_precio', 'magna_litros', 'magna_importe',
        'magna_merma_volumen', 'magna_merma_importe', 'magna_merma_porcentaje',
        'magna_iib', 'magna_compras', 'magna_cct', 'magna_v_dsc',
        'magna_dc', 'magna_dif_v_dsc', 'magna_if', 'magna_iffb',
        'magna_aceites',
        'diesel_precio', 'diesel_litros', 'diesel_importe',
        'diesel_merma_volumen', 'diesel_merma_importe', 'diesel_merma_porcentaje',
        'diesel_iib', 'diesel_compras', 'diesel_cct', 'diesel_v_dsc',
        'diesel_dc', 'diesel_dif_v_dsc', 'diesel_if', 'diesel_iffb',
        'diesel_aceites'
      ];
      columnas_aceites TEXT[] := ARRAY['premium_aceites', 'magna_aceites', 'diesel_aceites'];
      columna TEXT;
      columna_existe BOOLEAN;
      datos_migrados BOOLEAN;
      columnas_eliminadas INTEGER := 0;
    BEGIN
      -- Siempre eliminar columnas de aceites por producto (no se usan)
      FOREACH columna IN ARRAY columnas_aceites
      LOOP
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'reportes' AND column_name = columna
        ) INTO columna_existe;

        IF columna_existe THEN
          BEGIN
            EXECUTE format('ALTER TABLE reportes DROP COLUMN IF EXISTS %I', columna);
            columnas_eliminadas := columnas_eliminadas + 1;
            RAISE NOTICE 'Columna de aceites eliminada: %', columna;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error al eliminar columna de aceites %: %', columna, SQLERRM;
          END;
        END IF;
      END LOOP;

      -- Verificar si los datos ya fueron migrados para eliminar otras columnas
      SELECT EXISTS(SELECT 1 FROM reporte_productos LIMIT 1) INTO datos_migrados;
      
      IF NOT datos_migrados THEN
        RAISE NOTICE 'Los datos aún no han sido migrados a reporte_productos. Solo se eliminaron columnas de aceites.';
        RETURN;
      END IF;

      -- Verificar que hay al menos algunos reportes con productos migrados
      IF NOT EXISTS (
        SELECT 1 FROM reporte_productos rp
        JOIN reportes r ON rp.reporte_id = r.id
        LIMIT 1
      ) THEN
        RAISE NOTICE 'No se encontraron reportes con productos migrados. Solo se eliminaron columnas de aceites.';
        RETURN;
      END IF;

      -- Eliminar cada columna obsoleta si existe
      FOREACH columna IN ARRAY columnas_obsoletas
      LOOP
        -- Verificar si la columna existe
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'reportes' AND column_name = columna
        ) INTO columna_existe;

        IF columna_existe THEN
          BEGIN
            EXECUTE format('ALTER TABLE reportes DROP COLUMN IF EXISTS %I', columna);
            columnas_eliminadas := columnas_eliminadas + 1;
            RAISE NOTICE 'Columna eliminada: %', columna;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error al eliminar columna %: %', columna, SQLERRM;
          END;
        END IF;
      END LOOP;

      IF columnas_eliminadas > 0 THEN
        RAISE NOTICE 'Limpieza completada: % columnas obsoletas eliminadas de la tabla reportes', columnas_eliminadas;
      ELSE
        RAISE NOTICE 'No se encontraron columnas obsoletas para eliminar (puede que ya fueron eliminadas).';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error en limpieza de columnas: %', SQLERRM;
    END $$;
  `)

  console.log('✅ Database tables created/verified')
}

