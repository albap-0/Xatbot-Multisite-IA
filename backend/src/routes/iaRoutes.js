const express = require('express')
const IAController = require('../controllers/iaController')

module.exports = (storage) => {
    const router = express.Router()
    const controller = new IAController(storage) //para ver webs asignadas al chatbot

    // ruta para consultar el chatbot        POST /api/chat/:id
    router.post('/:chatbotId', (req, res) => controller.askChatbot(req, res))

    // ruta para verificar web asignada correctamente           GET /api/chat/verify/:chatbotId
    router.get('/verify/:chatbotId', (req, res) => controller.verifyAccess(req, res))

    return router
};