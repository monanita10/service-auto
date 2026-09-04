require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function creeazaAdmin() {
  const parolaCriptata = await bcrypt.hash('admin1234', 10);
  await pool.query(
    "INSERT INTO utilizatori (nume, email, parola_hash, rol) VALUES ($1, $2, $3, 'admin')",
    ['Mecanic Șef', 'admin@service.ro', parolaCriptata]
  );
  console.log('Cont admin creat: admin@service.ro / admin1234');
  pool.end();
}
creeazaAdmin();