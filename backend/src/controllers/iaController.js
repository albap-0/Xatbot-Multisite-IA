const pool = require('../config/db')
const { Mistral } = require('@mistralai/mistralai')

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

class IAController {

    constructor(storage) {
        this.storage = storage //para pillar los configs de los chatbots
    }

    async askChatbot(req, res) {
        //console.time("TotalRespuestaIA") //a ver cuanto tarda respuesta IA
        try {
            const { chatbotId } = req.params
            const { question } = req.body

            if (!question) return res.status(400).json({ error: 'Falta la pregunta' })

            // 1. Limitar, se comprueba web asignada del chatbot
            // para evitar uso de otras webs randoms 
            
            //se busca el chatbot en el json
            const chatbots = await this.storage.getChatbots()
            const botConfig = chatbots.find(b => b.id === chatbotId)

            //caso: no se encuentra ese chatbot
            if (!botConfig) {
                //console.warn(`Chatbot con ID ${chatbotId} no encontrado.`)
                return res.status(404).json({ error: 'Chatbot no encontrado' })
            }

            //mirar desde dnd se quiere usar, en nuestro caso
            // 'origin' suele ser "http://localhost:5173"
            const requestOrigin = req.headers.origin || req.headers.referer 

            //console.log("ID del chatbot:", chatbotId)
            //console.log("Web asignada al chatbot por el responsable:", botConfig.website)
            //console.log("Web que hace la petición:", requestOrigin)

            //caso: el chatbot tiene web asignada
            if (botConfig.website) {
                const normalizedConfigWeb = botConfig.website.replace(/\/$/, "")  //quitar barras finales 
                const normalizedOrigin = requestOrigin ? requestOrigin.replace(/\/$/, "") : ""

                //caso: no coincide la web asignada con la que hace la petición
                if (normalizedOrigin !== normalizedConfigWeb) {
                    console.warn(`Bloqueado intento de uso desde ${normalizedOrigin} al bot de ${normalizedConfigWeb}`)
                    return res.status(403).json({ 
                        answer: " ERROR: Este chatbot no está autorizado para funcionar en esta página web." 
                    })
                }else { //caso: las webs coinciden
                    console.log("OKEY Las webs coinciden.")
                }
            }
            
            //2. búsqueda
            //console.log(`Pregunta recibida: "${question.substring(0, 50)}..."`);
            
            //pedir a mistral el vector embedding de la pregunta
            const embeddingResponse = await client.embeddings.create({
                model: 'mistral-embed',
                inputs: [question],
            })
            
            const questionVector = embeddingResponse.data[0].embedding
            const vectorStr = JSON.stringify(questionVector)

            const matchThreshold = 0.4 //distancia de parecido para comparar vectores. BAJO INVENTA MÁS

            //buscar 3 frag txto parecidos en postgres
            const query = `
                SELECT content 
                FROM chatbot_documents 
                WHERE chatbot_id = $1 
                AND (embedding <=> $2) < $3 
                ORDER BY embedding <=> $2 
                LIMIT 3
            ` //LIMIT X (X más grande => más tarda en buscar y dar respuesta)
            
            const dbResult = await pool.query(query, [chatbotId, vectorStr, matchThreshold])

            //caso: no hay fragmentos parecidos
            if (dbResult.rows.length === 0) {
                //console.log("No se ha encontrado contexto suficiente en la BD.");
                return res.json({ answer: "Lo siento, no tengo información sobre eso en mis documentos." })
            }

            // se juntan los fragmentos con separadores para para q la IA los distinga
            const context = dbResult.rows.map(row => row.content).join("\n---\n")
            
            // console.log(`Contexto encontrado: ${dbResult.rows.length} fragmentos.`)

            //3. generar respuesta
            //con temperature 0.15 no inventa tanto y se centra en el texto
            const chatResponse = await client.chat.complete({
                model: 'mistral-tiny', 
                temperature: 0.15,
                messages: [
                    { 
                        role: 'system', 
                        content: `Eres un asistente técnico, estricto y preciso. 
                        Tu única función es responder a la pregunta del usuario basándote en el contexto 
                        proporcionado. 

                        CONTEXTO RECUPERADO:
                        ${context}
                        
                        Instrucciones para responder obligatorias:
                        1. ANÁLISIS: Usa solo la información del contexto. Si la respuesta no está literal, puedes inferirla lógicamente del texto, pero NO inventes datos externos.
                        2. PRECISIÓN: Responde SOLO a lo que se pregunta. No añadas información adicional "por si acaso" ni resumas otros temas del texto que no vengan al caso.
                        3. TEMAS FUERA DE CONTEXTO: Si la pregunta no tiene relación con el texto (ej: preguntan por series, cocina, o temas no mencionados), di EXACTAMENTE: "Lo siento, no tengo información sobre eso".
                        4. PROHIBIDO: No expliques de qué trata el contexto si no sirve para responder (Ej: NO digas "El texto habla de AWS, no de eso"). Simplemente di la frase del punto 3.
                        5. TONO: Sé profesional y conciso. No empieces pidiendo perdón ("Lo siento, pero la respuesta es..."). Ve al grano.
                        `
                    },
                    { role: 'user', content: question }
                ],
            })

            const finalAnswer = chatResponse.choices[0].message.content
            //console.timeEnd("TotalRespuestaIA"); // tiempo total

            res.json({ answer: finalAnswer })

        } catch (err) {
            //caso: MISTRAL LIMITA PETICIONES POR NO PAGAR (429)
            if (err.statusCode === 429 || (err.body && err.body.includes('capacity exceeded'))) {
                console.warn('Límite de preguntas de Mistral excedido.')
                return res.json({ answer: " El sistema de IA ha llegado a su límite gratuito, espera para volver a preguntar." })
            }

            console.error('Error IA:', err)
            res.status(500).json({ error: 'Error generando respuesta' })
        }
    }

    
    //para que el frontend sepa si mostrar el chat o no 
    async verifyAccess(req, res) {
        try {
            const { chatbotId } = req.params
            const requestOrigin = req.headers.origin || req.headers.referer

            // console.log(`ID: ${chatbotId} | Desde: ${requestOrigin}`)

            const chatbots = await this.storage.getChatbots()
            const botConfig = chatbots.find(b => b.id === chatbotId)
            
            //caso: no se encuentra ese chatbot
            if (!botConfig) return res.json({ allowed: false })

            //caso: NO WEB ASIGNADA. El chatbot se puede usar en todas las webs. ESTÁ OKEY
            if (!botConfig.website || botConfig.website.trim() === "") {
                return res.json({ allowed: true })
            }

            //normalizar strings para comparar fácil
            const safeConfigWeb = botConfig.website.replace(/\/$/, "").toLowerCase().trim()
            const safeOrigin = requestOrigin ? requestOrigin.replace(/\/$/, "").toLowerCase().trim() : ""

            //caso: si las webs coinciden o una incluye a la otra
            if (safeOrigin.includes(safeConfigWeb) || safeConfigWeb.includes(safeOrigin)) {
                return res.json({ allowed: true })
            } else { //caso: no coinciden
                console.log(`Bloqueado. ${safeOrigin} != ${safeConfigWeb}`)
                return res.json({ allowed: false })
            }

        } catch (err) {
            console.error("Error verificando el acceso:", err)
            res.json({ allowed: false })
        }
    }
}

module.exports = IAController