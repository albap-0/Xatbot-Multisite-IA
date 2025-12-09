const express = require('express')
const adminAuth = require('../middleware/adminAuth') // protegit per l'admin
const ResponsibleController = require('../controllers/responsibleController')
const responsibleAuth = require('../middleware/responsibleAuth') // protegit per responsables

module.exports = (storage) => {
    const router = express.Router()
    const controller = new ResponsibleController(storage)

    //RUTAS ADMINISTRADOR
    // crear acceso a un responsable, solo admin      POST /users
    router.post('/', adminAuth, (req, res) => controller.createResponsible(req, res))

    // eliminar acceso responsable, solo admin         DELETE /users/:id
    router.delete('/:id', adminAuth, (req, res) => controller.deleteResponsible(req, res))

    // ver todos los responsables, solo admin         GET /users
    router.get('/', adminAuth, (req, res) => controller.getAllResponsibles(req, res))

    // asignar un chatbot a un responsable, solo admin     POST /users/:responsibleId/assign-chatbot
    // BODY: { "chatbotId": "..." }
    router.post('/:responsibleId/assign-chatbot', adminAuth, (req, res) => controller.assignChatbotToResponsible(req, res))

    // quitar chatbot a un responsable, solo admin      POST /users/unassign-chatbot/:chatbotId
    router.post('/unassign-chatbot/:chatbotId', adminAuth, (req, res) => controller.unassignChatbot(req, res))


    //RUTAS RESPONSABLE
    // ver chatbots asignados al responsable, solo responsable   GET /users/my-chatbots
    router.get('/my-chatbots', responsibleAuth, (req, res) => controller.getMyChatbots(req, res))

    
    return router;
}