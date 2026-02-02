import { pool } from '../config/database.js';

async function listColumns() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'menu_roles'
    `);
    console.log(res.rows);
  } catch (error) {
    console.error(error);
  } finally {
    client.release();
    process.exit();
  }
}

listColumns();
