const express = require('express')
const AuthController = require('../controllers/authController')

module.exports = (storage) => {
    const router = express.Router()
    const controller = new AuthController(storage)

    // ruta para login, solo responsable  POST /login-responsible
    router.post('/login-responsible', (req, res) => controller.loginResponsible(req, res))

    // ruta para login/registro, usuarios finales  POST /login-final-user
    router.post('/login-final-user', (req, res) => controller.loginOrRegisterFinalUser(req, res))

    return router
}