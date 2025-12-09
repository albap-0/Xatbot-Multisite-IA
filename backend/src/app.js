require("dotenv").config() //carga variables entorno .env
const express = require("express") //crear webserver
const Storage = require("./storage/storage")
const cors = require('cors')

require('./config/db') //inicializa conexion base datos

const app = express()
app.use(express.json()) //para poder leer JSON 
app.use(express.static('.')) //para el html de prueba, etc
app.use(cors()) //para facilitar las rutas


//inicializar almacenamiento
const dataFile = process.env.DATA_PATH || 'src/data'
//console.log(`Usando direct datos: ${dataFile}`)
const storage = new Storage(dataFile) //instancia almacenamiento

//importar rutas y las pasamos al storage
const chatbotRoutes = require("./routes/chatbotRoutes")(storage)
const responsibleRoutes = require("./routes/responsibleRoutes")(storage)
const authRoutes = require("./routes/authRoutes")(storage)
const documentRoutes = require("./routes/documentRoutes")(storage)
const iaRoutes = require("./routes/iaRoutes")(storage)

//asignamos las rutas al servidor
app.use("/chatbots", chatbotRoutes)
app.use("/responsibles", responsibleRoutes)
app.use("/auth", authRoutes)
app.use("/documents", documentRoutes)
app.use("/api/chat", iaRoutes)

//ruta arrel para probar que servidor OKEY
app.get("/", (req, res) => {
  res.send("Servidor OKEY: Xatbot Multisite IA")
})

const PORT = process.env.PORT || 3000

//iniciar servidor
async function startServer() {
  await storage.initialize() 
  //console.log('Almacenamiento OKEY inicializado.')

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`)
  })
}

startServer()

