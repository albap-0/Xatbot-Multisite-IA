const express = require('express')
const multer = require('multer')
const DocumentController = require('../controllers/documentController')
const responsibleAuth = require('../middleware/responsibleAuth')

//config Multer, para guardar los archivos subidos en uploads de 
// forma temporal, luego se borran
const upload = multer({ dest: 'uploads/' })

module.exports = (storage) => {
    const router = express.Router()
    const controller = new DocumentController(storage)

    //RUTAS PARA RESPONSABLE

    // ruta para subir archivo pdf o txt        POST /documents/:chatbotId/upload
    //form-data con campo 'file' y el fichero a subir
    router.post('/:chatbotId/upload', responsibleAuth, upload.single('file'), (req, res) => controller.uploadDocument(req, res))

    // ruta para subir url       POST /documents/:chatbotId/url
    //JSON { "url": "..." }
    router.post('/:chatbotId/url', responsibleAuth, (req, res) => controller.uploadUrl(req, res))

    // ruta para listar todos los documentos de un chatbot       GET /documents/:chatbotId
    router.get('/:chatbotId', responsibleAuth, (req, res) => controller.getDocuments(req, res))

    // ruta para borrar un documento de un chatbor      DELETE /documents/:chatbotId
    // Body: { "documentName": "XXX.pdf" }
    router.delete('/:chatbotId', responsibleAuth, (req, res) => controller.deleteDocument(req, res))

    return router
};