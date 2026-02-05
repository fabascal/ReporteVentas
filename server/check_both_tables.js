import pkg from 'pg';
import dotenv from 'dotenv';

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
    console.log('=== TABLA: ejercicios_fiscales (Dashboard Financiero y Admin) ===');
    const ejercicios = await pool.query(`
      SELECT anio, nombre, estado
      FROM ejercicios_fiscales
      ORDER BY anio DESC
    `);
    console.log('Años en ejercicios_fiscales:');
    ejercicios.rows.forEach(row => {
      console.log(`  - ${row.anio}: ${row.nombre} (${row.estado})`);
    });
    
    console.log('\n=== TABLA: periodos_mensuales (Dashboard Gerente Estación) ===');
    const periodos = await pool.query(`
      SELECT DISTINCT anio
      FROM periodos_mensuales
      ORDER BY anio DESC
    `);
    console.log('Años en periodos_mensuales:');
    periodos.rows.forEach(row => {
      console.log(`  - ${row.anio}`);
    });
    
    console.log('\n=== INCONSISTENCIA DETECTADA ===');
    const aniosEjercicios = new Set(ejercicios.rows.map(r => r.anio));
    const aniosPeriodos = periodos.rows.map(r => r.anio);
    
    const enPeriodosPeroNoEnEjercicios = aniosPeriodos.filter(a => !aniosEjercicios.has(a));
    const enEjerciciosPeroNoEnPeriodos = [...aniosEjercicios].filter(a => !aniosPeriodos.includes(a));
    
    if (enPeriodosPeroNoEnEjercicios.length > 0) {
      console.log('⚠️  Años en periodos_mensuales pero NO en ejercicios_fiscales:', enPeriodosPeroNoEnEjercicios);
    }
    if (enEjerciciosPeroNoEnPeriodos.length > 0) {
      console.log('⚠️  Años en ejercicios_fiscales pero NO en periodos_mensuales:', enEjerciciosPeroNoEnPeriodos);
    }
    if (enPeriodosPeroNoEnEjercicios.length === 0 && enEjerciciosPeroNoEnPeriodos.length === 0) {
      console.log('✅ Ambas tablas están sincronizadas');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
