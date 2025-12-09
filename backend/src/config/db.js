const { Pool } = require('pg')
require('dotenv').config()

//configurar la conexión a la base de datos PostgreSQL
// mantiene algunas conexiones abiertas listas para usar rápido
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

// ping para verificar la conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error('No se ha podido conectar a PostgreSQL.')
    //console.error('Error:', err.message)
    return
  }
  console.log('Conectado a PostgreSQL OKEY')
  release() // soltar la conexión cliente para q esté disponible
})

module.exports = pool