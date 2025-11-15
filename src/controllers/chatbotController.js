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
        docs: [], //documentos asociados
        owner: null //RESPONSABLE ASIGNADO
      };

      //console.log(`[Chatbot] Creando nuevo chatbot vacío con ID: ${newChatbot.id}`);
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
        console.log(`[Chatbot] Búsqueda de chatbot inexistente: ${id}`)
        return res.status(404).json({ error: 'Chatbot no encontrado' })
      }

      //caso: chatbot encontrado
      res.json(chatbot); 
      
    } catch(err){
      res.status(500).json({ error: 'Error en la búsqueda del chatbot' })
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
        console.log(`[Chatbot] Intentando eliminar chatbot inexistente: ${id}`)
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


}

module.exports = ChatbotController

