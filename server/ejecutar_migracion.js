import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'repvtas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

(async () => {
  try {
    console.log('=== EJECUTANDO MIGRACIÓN: Eliminar periodos_mensuales ===\n');
    
    // Leer el archivo SQL
    const sql = fs.readFileSync('./migrations/011_eliminar_periodos_mensuales.sql', 'utf8');
    
    // Ejecutar la migración
    await pool.query(sql);
    
    console.log('✅ Migración ejecutada exitosamente\n');
    
    // Verificar cambios
    console.log('=== VERIFICANDO CAMBIOS ===\n');
    
    // 1. Verificar que periodos_mensuales ya no existe
    const tablasResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'periodos_mensuales'
    `);
    
    if (tablasResult.rows.length === 0) {
      console.log('✅ Tabla periodos_mensuales eliminada');
    } else {
      console.log('⚠️  Tabla periodos_mensuales aún existe');
    }
    
    // 2. Verificar estructura de zonas_periodos_cierre
    const columnasResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'zonas_periodos_cierre' 
      AND column_name IN ('anio', 'mes', 'periodo_id')
      ORDER BY column_name
    `);
    
    console.log('\n✅ Columnas de zonas_periodos_cierre:');
    columnasResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    // 3. Contar registros en zonas_periodos_cierre
    const countResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM zonas_periodos_cierre
    `);
    console.log(`\n✅ Registros en zonas_periodos_cierre: ${countResult.rows[0].total}`);
    
    await pool.end();
    console.log('\n✅ Migración completada correctamente');
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
})();
