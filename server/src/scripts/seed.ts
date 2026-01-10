import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { Role } from '../types/auth.js'

async function seed() {
  try {
    console.log('🌱 Iniciando seed de datos...')

    // Crear zonas
    const zona1 = await pool.query(
      'INSERT INTO zonas (nombre) VALUES ($1) RETURNING id',
      ['Zona Norte']
    )
    const zona2 = await pool.query(
      'INSERT INTO zonas (nombre) VALUES ($1) RETURNING id',
      ['Zona Sur']
    )

    const zona1Id = zona1.rows[0].id
    const zona2Id = zona2.rows[0].id

    console.log('✅ Zonas creadas')

    // Crear estaciones
    const estacion1 = await pool.query(
      'INSERT INTO estaciones (nombre, zona_id) VALUES ($1, $2) RETURNING id',
      ['Estación Centro', zona1Id]
    )
    const estacion2 = await pool.query(
      'INSERT INTO estaciones (nombre, zona_id) VALUES ($1, $2) RETURNING id',
      ['Estación Norte', zona1Id]
    )
    const estacion3 = await pool.query(
      'INSERT INTO estaciones (nombre, zona_id) VALUES ($1, $2) RETURNING id',
      ['Estación Sur', zona2Id]
    )

    const estacion1Id = estacion1.rows[0].id
    const estacion2Id = estacion2.rows[0].id
    const estacion3Id = estacion3.rows[0].id

    console.log('✅ Estaciones creadas')

    // Crear usuarios
    const passwordHash = await bcrypt.hash('password123', 10)

    const admin = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ['admin@repvtas.com', passwordHash, 'Administrador', Role.Administrador]
    )

    const gerenteEstacion = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [
        'gerente.estacion@repvtas.com',
        passwordHash,
        'Gerente Estación',
        Role.GerenteEstacion,
      ]
    )

    const gerenteZona = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ['gerente.zona@repvtas.com', passwordHash, 'Gerente Zona', Role.GerenteZona]
    )

    const director = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ['director@repvtas.com', passwordHash, 'Director', Role.Direccion]
    )

    const adminId = admin.rows[0].id
    const gerenteEstacionId = gerenteEstacion.rows[0].id
    const gerenteZonaId = gerenteZona.rows[0].id
    const directorId = director.rows[0].id

    console.log('✅ Usuarios creados')

    // Asignar estaciones al gerente de estación
    await pool.query(
      'INSERT INTO user_estaciones (user_id, estacion_id) VALUES ($1, $2)',
      [gerenteEstacionId, estacion1Id]
    )
    await pool.query(
      'INSERT INTO user_estaciones (user_id, estacion_id) VALUES ($1, $2)',
      [gerenteEstacionId, estacion2Id]
    )

    // Asignar zonas al gerente de zona
    await pool.query(
      'INSERT INTO user_zonas (user_id, zona_id) VALUES ($1, $2)',
      [gerenteZonaId, zona1Id]
    )
    await pool.query(
      'INSERT INTO user_zonas (user_id, zona_id) VALUES ($1, $2)',
      [gerenteZonaId, zona2Id]
    )

    console.log('✅ Asignaciones creadas')

    console.log('\n📋 Usuarios de prueba creados:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Administrador:')
    console.log('  Email: admin@repvtas.com')
    console.log('  Password: password123')
    console.log('\nGerente Estación:')
    console.log('  Email: gerente.estacion@repvtas.com')
    console.log('  Password: password123')
    console.log('\nGerente Zona:')
    console.log('  Email: gerente.zona@repvtas.com')
    console.log('  Password: password123')
    console.log('\nDirector:')
    console.log('  Email: director@repvtas.com')
    console.log('  Password: password123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('✅ Seed completado exitosamente')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  }
}

seed()

