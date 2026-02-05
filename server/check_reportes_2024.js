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
    console.log('=== VERIFICANDO REPORTES DE 2024 ===');
    
    const reportes2024 = await pool.query(`
      SELECT COUNT(*) as total
      FROM reportes
      WHERE EXTRACT(YEAR FROM fecha) = 2024
    `);
    
    console.log(`Total de reportes de 2024: ${reportes2024.rows[0].total}`);
    
    if (reportes2024.rows[0].total === '0') {
      console.log('✅ NO hay reportes de 2024. Es seguro eliminar los períodos.');
    } else {
      console.log('⚠️  SÍ hay reportes de 2024. NO debes eliminar los períodos.');
      console.log('\n=== PRIMEROS 5 REPORTES DE 2024 ===');
      const ejemplos = await pool.query(`
        SELECT fecha, estado, aceites
        FROM reportes
        WHERE EXTRACT(YEAR FROM fecha) = 2024
        ORDER BY fecha ASC
        LIMIT 5
      `);
      console.log(JSON.stringify(ejemplos.rows, null, 2));
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
