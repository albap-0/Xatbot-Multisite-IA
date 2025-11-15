//require('dotenv').config() ya lo hacemos en el app.js

//Se encarga de verificar que el token admin enviado corresponde 
//con el token admin configurado en las variables de entorno
const adminAuth = (req, res, next) => {
    //el admin envia el token en el header
    const token = (req.headers['x-admin-token'] || '').trim(); 

    //caso: no hay token admin enviado en el header
    if (!token) {
        console.log('adminAuth: no hay token en el header');
        return res.status(401).json({ error: 'No se ha proporcionado un token' })
    }

    const adminToken = (process.env.ADMIN_TOKEN || '').trim();

    console.log("Token recibido del header:", `"${token}"`);
    //console.log("Token esperado del .env:", `"${adminToken}"`);

    //caso: no hay token admin configurado en el .env
    if (!adminToken) {
        console.error('adminAuth: ADMIN_TOKEN no está configurado en las variables de entorno');
        return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    //caso: token no coincide
    if (token !== adminToken) {
        return res.status(403).json({ error: 'Token incorrecto' })
    }

    //caso: token correcto
    next() 
}

module.exports = adminAuth