const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

if (!GOOGLE_CLIENT_ID) {
  console.error("Error: GOOGLE_CLIENT_ID no está configurado en el .env. La autenticación fallará");
}
if (!JWT_SECRET) {
  console.error("Error: JWT_SECRET no está configurado en el .env. La autenticación fallará");
}

// inicializar el cliente de google
const client = new OAuth2Client(GOOGLE_CLIENT_ID);


//Se encarga de autenticar (login y registro) usuarios responsables y finales
class AuthController {
  constructor(storage) {
    this.storage = storage;
  }

  async loginResponsible(req, res) {
    try {
      // recibe el token id de Google desde el frontedn
      const { id_token } = req.body;
      if (!id_token) {
        return res.status(400).json({ error: 'El token Google ID es necesario' });
      }

      // se verifica el token rx con Google
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken: id_token,
          audience: GOOGLE_CLIENT_ID, 
        });
      } catch (errVerifyGoogle) {
        console.error('Error verificando el token de Google:', errVerifyGoogle.message);
        return res.status(401).json({ error: 'Token de Google inválido' });
      }
      
      const payload = ticket.getPayload();
      const email = payload.email;
      // console.log(`[Auth] Intento de login (Responsable) con email: ${email}`)

      // caso: no hay email 
      if (!email) {
        return res.status(401).json({ error: 'Token de Google inválido: No se ha encontrado el email' });
      }

      // comprobar si el correo está en la lista de responsables
      const responsibles = await this.storage.getResponsibles();
      const responsibleUser = responsibles.find(user => user.email === email);

      // caso: el usuario no está en la lista
      if (!responsibleUser) {
        console.warn(`[Auth] ERROR: EL usuario ${email} ha intentado hacer login de Responsable pero no está en la lista de autorizados`)
        return res.status(403).json({ error: 'Usuario no autorizado. Contacte con el administrador' });
      }

      // caso: usuario responsable está OKEY, se crea token propio de sesión JWT
      const sessionTokenPayload = {
        id: responsibleUser.id,
        email: responsibleUser.email,
        name: payload.name, // se coge mismo el nombre de google
        role: 'responsible'
      };

      const sessionToken = jwt.sign(
        sessionTokenPayload,
        JWT_SECRET,
        { expiresIn: '8h' } // caducidad token 8HORAS
      );

      console.log(`[Auth] Login de Responsable OKEY para: ${email}`)
      res.json({
        message: 'Login successful',
        token: sessionToken, // token q el frontend tiene q guardar
        user: sessionTokenPayload,
      });

    } catch (err) {
      console.error('Error durante el login:', err.message);
      res.status(500).json({ error: 'Error interno del servidor durante el login' });
    }
  }



  async loginOrRegisterFinalUser(req, res) {
    try {
      const { id_token } = req.body;
      if (!id_token) {
        return res.status(400).json({ error: 'El token Google ID es necesario' });
      }

      // se verifica el token rx con Google
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken: id_token,
          audience: GOOGLE_CLIENT_ID, 
        });
      } catch (errVerifyGoogle) {
        console.error('Error verificando el token de Google:', errVerifyGoogle.message);
        return res.status(401).json({ error: 'Token de Google inválido' });
      }
      
      const payload = ticket.getPayload();
      const email = payload.email;
      // console.log(`[Auth] Intento de login (U_final) con email: ${email}`)

      // caso: no hay email
      if (!email) {
        return res.status(401).json({ error: 'Token de Google inválido. No se ha encontrado el email' });
      }

      // comprobar si el correo está ya registrado en la lista de usuarios finales
      const finalUsers = await this.storage.getFinalUsers();
      let user = finalUsers.find(u => u.email === email);

      //caso: usuario no registrado 
      if (!user) {
        //console.log(`[Auth] Usuario Final ${email} no encontrado. Registrando`)
        const { v4: uuidv4 } = require('uuid');
        
        user = {
          id: uuidv4(),
          email: email,
          name: payload.name,
          createdAt: new Date().toLocaleString()
        };
        
        finalUsers.push(user); // Añadir nuevo usuario a la lista
        await this.storage.saveFinalUsers(finalUsers); // Actualizar lista usuarios almacenamiento
      } else {
        console.log(`[Auth] Usuario final ${email} encontrado. Haciendo login`); // LOG DE PROVA
      }

      // caso: usuario final ya está registrado, se hace login y se crea token propio de sesión JWT
      const sessionTokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'final_user'
      };

      const sessionToken = jwt.sign(
        sessionTokenPayload,
        JWT_SECRET,
        { expiresIn: '8h' } // caducidad token 8HORAS
      );

      console.log(`[Auth] Login/Registro User final OKEY para: ${email}`);
      res.json({
        message: 'Login/Register successful',
        token: sessionToken, // token q el frontend tiene q guardar
        user: sessionTokenPayload,
      });

    } catch (err) {
      console.error('Error durante el login/register de usuario final:', err.message);
      res.status(500).json({ error: 'Error interno del servidor durante el login/register de usuario final' });
    }
  }


}

module.exports = AuthController;