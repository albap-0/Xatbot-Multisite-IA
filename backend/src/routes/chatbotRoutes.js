const express = require('express')
const adminAuth = require('../middleware/adminAuth')
const ChatbotController = require('../controllers/chatbotController')
const responsibleAuth = require('../middleware/responsibleAuth')

module.exports = (storage) => {
    const router = express.Router()
    const controller = new ChatbotController(storage)

    //ADMIN
    // ruta para crear chatbot vacío, solo admin puede  POST /chatbots
    router.post('/', adminAuth, (req, res) => controller.createEmptyChatbot(req, res))

    // ruta para eliminar un chatbot por ID, solo admin    DELETE /chatbots/:id
    router.delete('/:id', adminAuth, (req, res) => controller.deleteChatbot(req, res))


    //PUBLICAS
    // ruta para obtener todos los chatbots. HACE FALTA Q SEA SOLO ADMIN??  GET /chatbots
    router.get('/', (req, res) => controller.getAllChatbots(req, res))

    // ruta para ver chatbot concreto por ID. HACE FALTA Q SEA SOLO ADMIN?? GET /chatbots/:id
    router.get('/:id', (req, res) => controller.getById(req, res))


    //RESPONSABLE
    // ruta para asignar web o editar chatbot PUT /chatbots/:id
    router.put('/:id', responsibleAuth, (req, res) => controller.updateChatbot(req, res))

    return router;
}