import { pool } from '../config/database.js';

async function listColumns() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'roles'
    `);
    console.log(res.rows);
    
    // Also list roles content
    const rolesRes = await client.query('SELECT * FROM roles');
    console.log('Roles content:', rolesRes.rows);
  } catch (error) {
    console.error(error);
  } finally {
    client.release();
    process.exit();
  }
}

listColumns();
