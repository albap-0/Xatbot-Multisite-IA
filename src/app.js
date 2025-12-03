require("dotenv").config() //carga variables entorno .env
const express = require("express") //crear webserver
const Storage = require("./storage/storage")

require('./config/db') //inicializa conexion base datos

const app = express()
app.use(express.json()) //para poder leer JSON 


//inicializar almacenamiento
const dataFile = process.env.DATA_PATH || 'src/data'
//console.log(`Usando direct datos: ${dataFile}`)
const storage = new Storage(dataFile) //instancia almacenamiento

//importar rutas y las pasamos al storage
const chatbotRoutes = require("./routes/chatbotRoutes")(storage)
const responsibleRoutes = require("./routes/responsibleRoutes")(storage)
const authRoutes = require("./routes/authRoutes")(storage)

//asignamos las rutas al servidor
app.use("/chatbots", chatbotRoutes)
app.use("/responsibles", responsibleRoutes)
app.use("/auth", authRoutes)

//ruta arrel para probar que servidor OKEY
app.get("/", (req, res) => {
  res.send("Servidor OKEY: Xatbot Multisite IA")
});

const PORT = process.env.PORT || 3000

async function startServer() {
  await storage.initialize() 
  //console.log('Almacenamiento OKEY inicializado.')

  //arranca el servidor
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`)
  })
}

startServer()

