import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)

// Vite expone las variables del .env aquí:
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!clientId) {
  console.error("ERROR: No se ha encontrado VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend")
}

app.use(vue3GoogleLogin, {
  clientId: clientId
})

app.mount('#app')