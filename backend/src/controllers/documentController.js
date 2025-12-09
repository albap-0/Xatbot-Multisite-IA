const pool = require('../config/db')
const fs = require('fs')
const PDFParser = require("pdf2json") 
const axios = require('axios')
const cheerio = require('cheerio')
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters")
const { Mistral } = require('@mistralai/mistralai')

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

class DocumentController {
    
    constructor(storage) {
        this.storage = storage
    }

    // OPCIÓN A: SUBIR PDF O TXT
    async uploadDocument(req, res) {
        const { chatbotId } = req.params
        const file = req.file

        if (!file) return res.status(400).json({ error: 'No has subido ningún archivo' })

        try {
            //Comprobar si es el dueño del chatbot
            const isOwner = await this._checkOwnership(chatbotId, req.user.id)
            if (!isOwner) {
                this._deleteTempFile(file)
                return res.status(403).json({ error: 'No tienes permiso sobre este chatbot.' })
            }

            //Comprobar si ya existe este archivo
            const alreadyExists = await this._checkIfDocumentExists(chatbotId, 'filename', file.originalname)
            if (alreadyExists) {
                this._deleteTempFile(file)
                return res.status(409).json({ error: `El documento '${file.originalname}' ya está subido en este chatbot.` })
            }

            // Procesar el texto tal cual
            let rawText = ''
            console.log(`Procesando archivo: ${file.originalname}`)

            //caso: pdf
            if (file.mimetype === 'application/pdf') {
                rawText = await this._parsePDF(file.path);
            } else {
                // texto plano txt
                rawText = fs.readFileSync(file.path, 'utf8');
            }

            // limpiar texto, quitar saltos de línea y guiones  de corte
            rawText = rawText.replace(/----------------/g, ' ').replace(/\r\n/g, ' ').trim()
            
            //validar que hay texto suficiente dsps limpieza
            if (!rawText || rawText.length < 50) {
                this._deleteTempFile(file)
                return res.status(400).json({ error: 'El documento parece estar vacío o no se puede leer.' })
            }

            //vectorizar el texto y guardar en la BD
            await this._processAndSave(chatbotId, rawText, { filename: file.originalname, type: 'file' })
            
            this._deleteTempFile(file)
            res.status(201).json({ message: 'Documento procesado y guardado en la BD correctamente' })

        } catch (err) {
            console.error('Error subiendo archivo:', err)
            this._deleteTempFile(file)
            res.status(500).json({ error: 'Error interno: ' + err.message })
        }
    }

    //OPCIÓN B: Subir Web --- FALTA VALIDAR 
    async uploadUrl(req, res) {
        const { chatbotId } = req.params
        const { url } = req.body
        
        if (!url) return res.status(400).json({ error: 'Falta la URL' })

        try {
            const isOwner = await this._checkOwnership(chatbotId, req.user.id)
            if (!isOwner) return res.status(403).json({ error: 'No tienes permiso sobre este chatbot.' })

            const alreadyExists = await this._checkIfDocumentExists(chatbotId, 'source', url)
            if (alreadyExists) {
                return res.status(409).json({ error: `La URL '${url}' ya ha sido procesada anteriormente.` })
            }

            console.log(`Descargando web: ${url}`)

            //descargar la web
            const response = await axios.get(url)
            const $ = cheerio.load(response.data)

            //quitar elementos q no sirve estilos, scripts, nav...
            $('script, style, nav, footer, iframe, header').remove()
            const rawText = $('body').text().replace(/\s+/g, ' ').trim()

            if (rawText.length < 50) return res.status(400).json({ error: 'Web sin contenido útil.' })

            //procesar y guardar en la BD
            await this._processAndSave(chatbotId, rawText, { source: url, type: 'url' })
            res.status(201).json({ message: 'Web procesada y guardada en la BD correctamente' })

        } catch (err) {
            console.error('Error URL:', err.message)
            res.status(500).json({ error: 'No se ha podido leer la web. Verifica la URL.' })
        }
    }

    //Para listar todos los documentos incluidos en un chatbot
    async getDocuments(req, res) {
        const { chatbotId } = req.params
        try {
            const isOwner = await this._checkOwnership(chatbotId, req.user.id)
            if (!isOwner) {
                this._deleteTempFile(file)
                return res.status(403).json({ error: 'No tienes permiso sobre este chatbot.' })
            }

            // agrupamos por nombre para no devolver duplicados
            // obtener el nombre (filename) o la web (source)
            const query = `
                SELECT DISTINCT 
                    COALESCE(metadata->>'filename', metadata->>'source') as nombre,
                    metadata->>'type' as tipo,
                    MIN(created_at) as fecha_subida
                FROM chatbot_documents
                WHERE chatbot_id = $1
                GROUP BY metadata->>'filename', metadata->>'source', metadata->>'type'
            `
            const result = await pool.query(query, [chatbotId])
            res.json(result.rows)
        } catch (err) {
            console.error(err)
            res.status(500).json({ error: 'Error recuperando documentos' })
        }
    }

    // Eliminar documento (todos los fragmentos asociados)
    async deleteDocument(req, res) {
        const { chatbotId } = req.params
        const { documentName } = req.body //puede ser pdf o web

        if (!documentName) return res.status(400).json({ error: 'Falta el nombre del documento a borrar' })

        try {
            const isOwner = await this._checkOwnership(chatbotId, req.user.id)
            if (!isOwner) {
                this._deleteTempFile(file)
                return res.status(403).json({ error: 'No tienes permiso sobre este chatbot.' })
            }

            //eliminar todos los vectores asociados a ese doc o web
            const query = `
                DELETE FROM chatbot_documents 
                WHERE chatbot_id = $1 
                AND (metadata->>'filename' = $2 OR metadata->>'source' = $2)
            `
            const result = await pool.query(query, [chatbotId, documentName])

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Documento no encontrado' })
            }

            console.log(`Eliminado '${documentName}' (${result.rowCount} fragmentos borrados).`)
            res.json({ message: `Documento '${documentName}' eliminado correctamente.` })

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error eliminando documento' })
        }
    }








    //borra archivo temporal por si acaso está en uploads
    _deleteTempFile(file) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path)
    }

    //comprueba si el usuario es responsable del chatbot
    async _checkOwnership(chatbotId, userId) {
        try {
            const chatbots = await this.storage.getChatbots()
            const bot = chatbots.find(b => b.id === chatbotId)
            return bot && bot.owner === userId 
        } catch (err) { return false; }
    }

    //comprueba si el doc ya existe en la BD
    async _checkIfDocumentExists(chatbotId, metadataKey, metadataValue) {
        try {
            const query = `
                SELECT 1 FROM chatbot_documents 
                WHERE chatbot_id = $1 
                AND metadata->>$2 = $3
                LIMIT 1
            `
            const result = await pool.query(query, [chatbotId, metadataKey, metadataValue])
            return result.rows.length > 0 //true si hay duplicado
        } catch (err) {
            console.error("Error comprobando duplicados:", err)
            return false //si hay error, hacemos que no hay duplicado
        }
    }

    //procesa el texto y genera los vectores embedding
    async _processAndSave(chatbotId, text, metadata) {
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
        const outputDocs = await splitter.createDocuments([text])
        const chunks = outputDocs.map(d => d.pageContent)

        console.log(`Generando ${chunks.length} embeddings...`)
        const embeddingsBatch = await client.embeddings.create({ model: 'mistral-embed', inputs: chunks })
        const vectors = embeddingsBatch.data.map(d => d.embedding)

        for (let i = 0; i < chunks.length; i++) {
            const query = `INSERT INTO chatbot_documents (chatbot_id, content, metadata, embedding) VALUES ($1, $2, $3, $4)`
            await pool.query(query, [chatbotId, chunks[i], metadata, JSON.stringify(vectors[i])])
        }
    }
}

module.exports = DocumentController