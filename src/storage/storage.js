const fs = require('fs').promises
const path = require('path')

// clase que gestiona almacenamiento de datos en f.JSON
// es por el momento, para no perder los datos al reiniciar 
// server pq todavía no hay BBDD implementada
class Storage {
    constructor(dataDirectory){
        this.chatbotsFilePath = path.resolve(dataDirectory, 'chatbots.json')
        this.responsiblesFilePath = path.resolve(dataDirectory, 'responsibles.json')
        this.finalUsersFilePath = path.resolve(dataDirectory, 'final_users.json')
    }

    // para asegurarnos de q los ficheros existen
    async _ensureFiles() {
        try {
            await fs.mkdir(path.dirname(this.chatbotsFilePath), { recursive: true })
            
            // se comprueba y se crea el fichero chatbots.json si no existe
            try {
                await fs.access(this.chatbotsFilePath)
            } catch (err) {
                //console.log(`[Storage] Fichero 'chatbots.json' no encontrado. Se crea uno nevo`)
                await fs.writeFile(this.chatbotsFilePath, JSON.stringify([], null, 2)) 
            }

            // se comprueba y se crea el fichero responsibles.json si no existe
            try {
                await fs.access(this.responsiblesFilePath)
            } catch (err) {
                //console.log(`[Storage] Fichero 'responsibles.json' no encontrado. Se crea uno nuevo`)
                await fs.writeFile(this.responsiblesFilePath, JSON.stringify([], null, 2))
            }

            // se comprueba y se crea el fichero final_users.json si no existe
            try { 
                await fs.access(this.finalUsersFilePath) 
            } catch (err) { 
                //console.log(`[Storage] Fichero 'final_users.json' no encontrado. Se crea nuevo`)
                await fs.writeFile(this.finalUsersFilePath, JSON.stringify([], null, 2)) 
            }

        } catch (err) {
            console.error("Error en iniciar el almacenamiento:", err)
        }
    }

    async initialize() {
        await this._ensureFiles()
    }



    //lee los datos de x archivo, si está vacío devuelve []
    async readData(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf-8')
            // console.log(`Leyendo datos de ${filePath}`)
            if (!data.trim()) return []
            const parsed = JSON.parse(data)
            return Array.isArray(parsed) ? parsed : []
        } catch (err) {
            console.error(`Error leyendo datos de ${filePath}:`, err)
            return []
        }
    }
    //escribe los datos en el archivo
    async writeData(filePath, data) {
        // console.log(`Escribiendo datos a ${filePath}`)
        await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    }


    
    //CHATBOTS
    async getChatbots() {
        return await this.readData(this.chatbotsFilePath)
    }
    async saveChatbots(chatbots) {
        await this.writeData(this.chatbotsFilePath, chatbots) //se guarda como array directo
    }


    //USUARIOS RESPONSABLES
    async getResponsibles() {
        return await this.readData(this.responsiblesFilePath)
    }
    async saveResponsibles(responsibles) {
        await this.writeData(this.responsiblesFilePath, responsibles)
    }
    async getResponsibleById(id) {
        const responsibles = await this.getResponsibles()
        return responsibles.find(responsible => responsible.id === id)
    }


    //USUARIOS FINALES
    async getFinalUsers() {
        return await this.readData(this.finalUsersFilePath)
    }
    async saveFinalUsers(users) {
        await this.writeData(this.finalUsersFilePath, users)
    }

}

module.exports = Storage