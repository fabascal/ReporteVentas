import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  try {
    const password = 'admin'; // Contraseña temporal
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const res = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE email = 'admin@repvtas.com'",
      [hash]
    );
    
    console.log('Password reset successfully for admin@repvtas.com');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
}

resetAdminPassword();
