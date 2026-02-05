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
    console.log('=== ELIMINANDO PERÍODOS DE 2024 ===');
    
    // 1. Contar antes
    const antes = await pool.query(`
      SELECT COUNT(*) as total
      FROM periodos_mensuales
      WHERE anio = 2024
    `);
    console.log(`Períodos de 2024 antes: ${antes.rows[0].total}`);
    
    // 2. Eliminar
    const resultado = await pool.query(`
      DELETE FROM periodos_mensuales
      WHERE anio = 2024
    `);
    console.log(`Filas eliminadas: ${resultado.rowCount}`);
    
    // 3. Contar después
    const despues = await pool.query(`
      SELECT COUNT(*) as total
      FROM periodos_mensuales
      WHERE anio = 2024
    `);
    console.log(`Períodos de 2024 después: ${despues.rows[0].total}`);
    
    // 4. Mostrar años disponibles
    const anios = await pool.query(`
      SELECT DISTINCT anio
      FROM periodos_mensuales
      ORDER BY anio DESC
    `);
    console.log('\n✅ Años disponibles ahora:');
    anios.rows.forEach(row => console.log(`   - ${row.anio}`));
    
    await pool.end();
    console.log('\n✅ Períodos de 2024 eliminados correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
