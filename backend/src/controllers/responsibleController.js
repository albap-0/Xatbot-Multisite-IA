const { v4: uuidv4 } = require('uuid')

//Se encarga de la lógica de admin (gestionar los responsables: creación, 
// borrado, asignación chatbots) y de los responsables (ver sus chatbots)
class ResponsibleController {
  constructor(storage) {
      this.storage = storage 
  }

  // admin crea acceso responsable nuevo
  async createResponsible(req, res) {
    try {
      const { email } = req.body //lo hacemos con el email solo
      if (!email) {
        return res.status(400).json({ error: 'El correo es necesario' })
      }

      //hace falta validar que el correo q el admin ponga tenga buen formato?

      const responsibles = await this.storage.getResponsibles()

      // caso: ya existe el usuario
      if (responsibles.find(responsible => responsible.email === email)) {
        return res.status(409).json({ error: 'Con este correo ya existe un responsable' })
      }

      // Creamos el usuario nuevo (sin contraseña)
      const newResponsible = {
        id: uuidv4(),
        email: email,
        createdAt: new Date().toLocaleString()
      }

      responsibles.push(newResponsible)
      await this.storage.saveResponsibles(responsibles)

      // console.log(`[Admin] Nuevo responsable creado: ${email} (ID: ${newResponsible.id})`)
      res.status(201).json(newResponsible)

    } catch (err) {
      console.error('Error creando responsable:', err)
      res.status(500).json({ error: 'Error creando responsable' })
    }
  }


  // admin elimina acceso a responsable
  async deleteResponsible(req, res) {
    try {
      const { id } = req.params
      let responsibles = await this.storage.getResponsibles()
      const responsibleIndex = responsibles.findIndex(responsible => responsible.id === id)

      if (responsibleIndex === -1) {
        return res.status(404).json({ error: 'Responsable no encontrado' })
      }

      // console.log(`[Admin] Borrando responsable: ${responsibles[responsibleIndex].email} (ID: ${id})`)

      responsibles.splice(responsibleIndex, 1) // se borra de la lista
      await this.storage.saveResponsibles(responsibles) // se actualiza fichero 

      // Desasignar chatbots del responsable q eliminamos
      let chatbots = await this.storage.getChatbots()
      let chatbotsModified = false
      chatbots.forEach(bot => {
        if (bot.owner === id) {
          bot.owner = null
          chatbotsModified = true
          //console.log(`[Admin] Chatbot ${bot.id} desasignado del usuario borrado`)
        }
      })

      if (chatbotsModified) {
        await this.storage.saveChatbots(chatbots)
      }

      res.status(204).send()

    } catch (err) {
      console.error('Error eliminando acceso responsable:', err)
      res.status(500).json({ error: 'Error eliminando acceso responsable' })
    }
  }

  // Admin asigna chatbot a un responsable
  // id del chatbot en el body 
  // id del responsable en la url
  async assignChatbotToResponsible(req, res) {
    try {
      const { responsibleId } = req.params
      const { chatbotId } = req.body 
      if (!chatbotId) {
        return res.status(400).json({ error: 'El chatbotId es necesario en el body' })
      }

      const respUser = await this.storage.getResponsibleById(responsibleId) 
      if (!respUser) {
        return res.status(404).json({ error: 'Responsable no encontrado' })
      }

      let chatbots = await this.storage.getChatbots()
      const chatbot = chatbots.find(bot => bot.id === chatbotId)
      
      if (!chatbot) {
        return res.status(404).json({ error: 'Chatbot no encontrado' })
      }

      if (chatbot.owner && chatbot.owner !== responsibleId) {
        // console.warn(`[Admin] Intento de asignar chatbot ${chatbotId} (propietari: ${chatbot.owner}) a ${responsibleId}`)
        return res.status(409).json({ error: 'El chatbot ya está asignado a otro responsable' })
      }

      chatbot.owner = responsible.id // en el owner del chatbot se guarda id responsable
      await this.storage.saveChatbots(chatbots)

      // console.log(`[Admin] Chatbot ${chatbotId} asignado a ${responsible.email}`)
      res.status(200).json({ message: `Chatbot ${chatbotId} asignado a ${responsibleId}`, chatbot })

    } catch (err) {
      console.error('Error asignando chatbot:', err)
      res.status(500).json({ error: 'Error asignando chatbot' })
    }
  }

  // Admin quita owner chatbot
  // id del chatbot en la url
  async unassignChatbot(req, res) {
    try {
      const { chatbotId } = req.params
      let chatbots = await this.storage.getChatbots()
      const chatbot = chatbots.find(bot => bot.id === chatbotId)
      
      if (!chatbot) {
        return res.status(404).json({ error: 'Chatbot no encontrado' })
      }
      if (chatbot.owner === null) {
        return res.status(400).json({ error: 'El chatbot no está asignado a ningún usuario' })
      }
      // console.log(`[Admin] Desasignando chatbot ${chatbotId} de su propietario actual`)
      chatbot.owner = null
      await this.storage.saveChatbots(chatbots)

      res.status(200).json({ message: `Chatbot ${chatbotId} desasignado`, chatbot })

    } catch (err) {
      console.error('Error desasignando chatbot:', err)
      res.status(500).json({ error: 'Error desasignando chatbot' })
    }
  }

  // Admin ve lista de todos los responsables
  async getAllResponsibles(req, res) {
    try {
      const responsibles = await this.storage.getResponsibles()
      res.json(responsibles)
    } catch (err) {
      console.error('Error fetching responsibles:', err)
      res.status(500).json({ error: 'Error fetching responsibles' })
    }
  }

  // Ver chatbots de un responsable autenticado
  async getMyChatbots(req, res) {
    try {
      const responsibleId = req.user.id; //viene de responsable autenticado, contiene id, email, createdAt
      //console.log(`[Responsible] El usuario responsable ${req.user.email} quiere ver sus chatbots`)
      
      const allChatbots = await this.storage.getChatbots();

      // buscar chatbots por x owner
      const myChatbots = allChatbots.filter(bot => bot.owner === responsibleId);

      //console.log(`[Responsible] Se han encontrado ${myChatbots.length} chatbots para ${req.user.email}`);
      res.json(myChatbots);

    } catch (err) {
      console.error('Error buscando chatbots del usuario responsable:', err);
      res.status(500).json({ error: 'Error buscando chatbots del usuario responsable' });
    }
  }
  
}

module.exports = ResponsibleController