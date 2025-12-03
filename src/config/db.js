const { Pool } = require('pg');
require('dotenv').config();

// Crear el "pool" de conexiones (un grupo de conexiones listas para usar)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Prueba de conexión automática al arrancar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('[Error BBDD] No se pudo conectar a PostgreSQL:', err.message);
  }
  console.log('Conectado a PostgreSQL OKEY');
  release(); // Liberar la conexión
});

module.exports = pool;