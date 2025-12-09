const {v4: uuidv4} = require('uuid') //genera IDs únicos

//Se encarga de gestionar los chatbots: creación, búsqueda, eliminación
class ChatbotController{
  constructor(storage) {
      this.storage = storage
  }

  async createEmptyChatbot (req, res) {
    try{
      const chatbots = await this.storage.getChatbots()

      const newChatbot = {
        id: uuidv4(), //genera ID único
        createdAt: new Date().toLocaleString(), //fecha creación
        owner: null //RESPONSABLE ASIGNADO
      }

      //console.log(`Creando nuevo chatbot vacío con ID: ${newChatbot.id}`);
      chatbots.push(newChatbot)
      await this.storage.saveChatbots(chatbots) //guardar lista actualizada
      
      res.status(201).json({ id: newChatbot.id }) //devolver el nuevo chatbot con ID
      
    } catch (err){
        console.error('Error creando el chatbot:', err)
        res.status(500).json({ error: 'Error creando el chatbot' })
      }
  }


  // Obtener todos los chatbots
  //solo para admin?
  async getAllChatbots(req, res) {
    try {
      const chatbots = await this.storage.getChatbots()
      res.json(chatbots)
    } catch (err) {
      console.error('Error buscando chatbots:', err)
      res.status(500).json({ error: 'Error buscando chatbots' })
    }
  }

  async getById(req, res){
    try {
      const { id } = req.params
      const chatbots = await this.storage.getChatbots()

      const chatbot = chatbots.find(bot => bot.id === id) //buscar chatbot por ID

      //caso: chatbot no encontrado
      if (!chatbot) {
        console.log(`Chatbot no existe: ${id}`)
        return res.status(404).json({ error: 'Chatbot no encontrado' })
      }

      //caso: chatbot encontrado
      res.json(chatbot)
      
    } catch(err){
      res.status(500).json({ error: 'Error al buscar el chatbot' })
    }
  }


  // Eliminar un chatbot por ID (Admin)
  async deleteChatbot(req, res){
    try {
      const { id } = req.params // Id del chatbot en la URL
      const chatbots = await this.storage.getChatbots()

      // Encontrar el índice del chatbot a eliminar
      const botIndex = chatbots.findIndex(bot => bot.id === id)

      // caso: chatbot no encontrado
      if (botIndex === -1) {
        console.log(`Intentando eliminar chatbot q no existe: ${id}`)
        return res.status(404).json({ error: 'Chatbot no encontrado' })
      }

      chatbots.splice(botIndex, 1) // eliminar chatbot del array
      await this.storage.saveChatbots(chatbots) // guardar array actualizado

      console.log(`Chatbot con ID ${id} eliminado correctamente.`)
      res.status(204).send() 
      
    } catch(err){
      console.error('Error eliminando chatbot:', err)
      res.status(500).json({ error: 'Error eliminando chatbot' })
    }
  }

  // Asignar web a uno de sus chatbots (Responsable) o cambiar nombre
  async updateChatbot(req, res) {
    try {
      const { id } = req.params
      const { name, website } = req.body 

      const chatbots = await this.storage.getChatbots()
      const botIndex = chatbots.findIndex(bot => bot.id === id)

      if (botIndex === -1) {
        return res.status(404).json({ error: 'Chatbot no encontrado' })
      }

      const currentBot = chatbots[botIndex]
      
      //caso: el u.resp no es el owner del chatbot 
      if (currentBot.owner !== req.user.id) {
        //console.warn(`Usuario Resp ${req.user.id} intenta modificar un chatbot que no es suyo: ${id}`);
        return res.status(403).json({ error: 'No tienes permiso para modificar este chatbot' })
      }

      //actualizar solo los campos modificados
      const updatedBot = {
        ...currentBot,
        name: name !== undefined ? name : currentBot.name,
        website: website !== undefined ? website : currentBot.website
      }

      chatbots[botIndex] = updatedBot
      await this.storage.saveChatbots(chatbots)

      console.log(`ID ${id} actualizado por su responsable. Web: ${updatedBot.website}. Nombre: ${updatedBot.name}`)
      res.json(updatedBot)

    } catch (err) {
      console.error('Error actualizando el chatbot:', err)
      res.status(500).json({ error: 'Error actualizando el chatbot' })
    }
  }
}

module.exports = ChatbotController

