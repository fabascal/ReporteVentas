import { pool } from '../config/database.js';

async function checkAdmin() {
  try {
    const res = await pool.query("SELECT id, email, role, role_id FROM users WHERE email LIKE '%admin%' OR role = 'Administrador'");
    console.log('Admin users found:', res.rows);
    
    // También verificar roles
    const roles = await pool.query("SELECT * FROM roles WHERE codigo = 'Administrador'");
    console.log('Admin role:', roles.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('Error querying database:', err);
    process.exit(1);
  }
}

checkAdmin();
