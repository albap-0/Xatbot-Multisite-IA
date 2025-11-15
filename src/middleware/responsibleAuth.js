const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

//Se encarga de verificar que el token JWT de Authorization está 
// OKEY y guardar info en req.user para poder usarla desde Controller
const responsibleAuth = (req, res, next) => {
    // Token del responsable en Authorization con formato "Bearer TOKEN"
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[Auth] responsibleAuth: Token con mal formato o inexistent.'); // LOG DE PROVA
        return res.status(401).json({ error: 'No se ha proporcionado token o el formato es incorrecto' });
    }
    const token = authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'No se ha proporcionado token' });
    }

    // Validar que token sea OKEY
    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        //caso: token inválido o caducado
        if (err) {
            console.error('Token inválido:', err.message);
            return res.status(403).json({ error: 'Token inválido' });
        }

        //caso: token válido
        // console.log(`[respAuth] Token OKEY para el user: ${userPayload.email}`)
        req.user = userPayload; //se guarda info del resp en req.user
        next();
    });
};

module.exports = responsibleAuth;