<script setup>
import { ref, onMounted } from 'vue'
import { GoogleLogin } from 'vue3-google-login'

//estado global
const userToken = ref(localStorage.getItem('respToken') || '')
const vistaActual = ref('login')
const listaChatbots = ref([])
const errorMsg = ref('')

//modales
const modalEdit = ref(false)
const modalDocs = ref(false)
const modalCode = ref(false)
const chatbotSeleccionado = ref(null) 

//formulario para editar
const formName = ref('')
const formWeb = ref('')
const archivoSeleccionado = ref(null)
const subiendo = ref(false)

const documentosChatbot = ref([])

//login
const onGoogleLogin = async (response) => {
  errorMsg.value = ''
  // console.log("respuesta google:", response)
  try {
    const res = await fetch('http://localhost:3000/auth/login-responsible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: response.credential })
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Fallo al entrar')
    
    //guardamos token para no hacer login al recargar pag
    userToken.value = data.token
    localStorage.setItem('respToken', data.token)
    vistaActual.value = 'dashboard'
    
    // console.log("Login OK. Token guardado.")
    cargarChatbots()

  } catch (err) { 
    console.error(err)
    errorMsg.value = "Error de login. Prueba otra vez." 
  }
}

const cerrarSesion = () => {
  userToken.value = '' 
  localStorage.removeItem('respToken') 
  vistaActual.value = 'login' 
  listaChatbots.value = []
  // console.log("Sesión cerrada.")
}

const cargarChatbots = async () => {
  try {
    const res = await fetch('http://localhost:3000/responsibles/my-chatbots', {
      headers: { 'Authorization': `Bearer ${userToken.value}` }
    })
    if (res.ok) {
        listaChatbots.value = await res.json()
        // console.log("Lista de chatbots cargados de:", listaChatbots.value.length)
    } 
    else if (res.status === 401) {
        // console.warn("Token caducado, se cierra sessió")
        cerrarSesion()
    }
  } catch (e) { console.log('Error buscando chatbots', e) }
};

//comprobar al montar si ya hay token (osea usuario hecho login)
onMounted(() => { 
    if (userToken.value) { 
        vistaActual.value = 'dashboard' 
        cargarChatbots() 
    } 
})

//documentos
const abrirGestorDocs = async (chatbot) => {
  // console.log("Abriendo docs para chatbot:", chatbot.id)
  chatbotSeleccionado.value = chatbot
  modalDocs.value = true
  documentosChatbot.value = [] 
  await getDocs(chatbot.id)
}

const getDocs = async (chatbotId) => {
  try {
    const res = await fetch(`http://localhost:3000/documents/${chatbotId}`, {
      headers: { 'Authorization': `Bearer ${userToken.value}` }
    })
    if (res.ok) documentosChatbot.value = await res.json()
  } catch (e) { console.error(e) }
}

const borrarDoc = async (nombreDoc) => {
  if (!confirm(`Eliminar ${nombreDoc}?`)) return
  try {
    const res = await fetch(`http://localhost:3000/documents/${chatbotSeleccionado.value.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken.value}` },
      body: JSON.stringify({ documentName: nombreDoc })
    })
    if (res.ok) await getDocs(chatbotSeleccionado.value.id)
  } catch (e) { alert('Error de conexión') }
}

const onFileSelect = (e) => { archivoSeleccionado.value = e.target.files[0] }

const subirArchivo = async () => {
  if (!archivoSeleccionado.value) return alert('Elige un archivo primero')
  const formData = new FormData()
  formData.append('file', archivoSeleccionado.value)
  subiendo.value = true

  try {
    const res = await fetch(`http://localhost:3000/documents/${chatbotSeleccionado.value.id}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken.value}` },
      body: formData
    })
    if (res.ok) {
      alert('Subido okey');
      archivoSeleccionado.value = null
      await getDocs(chatbotSeleccionado.value.id)
    } else alert('Error subida')
  } catch (e) { console.error(e) }
  finally { subiendo.value = false }
}

//configuración chatbot
const abrirConfig = (chatbot) => { 
  // console.log("Abriendo config para:", chatbot.id)
  chatbotSeleccionado.value = chatbot 
  formName.value = chatbot.name || ''       
  formWeb.value = chatbot.website || '' 
  modalEdit.value = true 
}

const guardarCambios = async () => {
  // atención: se puede tener chatbot q no tiene nombre
  
  const payload = { 
    name: formName.value, 
    website: formWeb.value 
  }
  // console.log("Enviando actualización al backend:", payload)

  try {
    const res = await fetch(`http://localhost:3000/chatbots/${chatbotSeleccionado.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken.value}` },
      body: JSON.stringify(payload)
    })

    if (res.ok) { 
      // console.log("Actualización exitosa.")
      modalEdit.value = false 
      cargarChatbots() //actualizar lista de forma visual
    } else {
        const errData = await res.json()
        alert("Error: " + errData.error)
    }
  } catch (e) { 
      console.error("Error de conexión al guardar:", e)
      alert("Error conexión") 
  }
}

const verCodigo = (chatbot) => { 
  chatbotSeleccionado.value = chatbot 
  modalCode.value = true 
}
</script>











<template>
  <div class="contenedor-principal">
    
    <div v-if="vistaActual === 'login'" class="caja-login">
      <h2>🔐 Acceso a Responsables</h2>
      <div class="area-google"><GoogleLogin :callback="onGoogleLogin" /></div>
      <p v-if="errorMsg" class="texto-error">{{ errorMsg }}</p>
    </div>

    <div v-else class="panel-admin">
      <div class="barra-superior">
        <h2>Panel de Control - MyChatbots</h2>
        <button @click="cerrarSesion" class="boton-gris">Cerrar Sesión</button>
      </div>

      <div class="rejilla-bots">
        <div v-for="chatbot in listaChatbots" :key="chatbot.id" class="ficha-bot">
          <div class="encabezado-ficha">
            <h3>{{ chatbot.name || 'Chatbot sin nombre' }}</h3>
            <span class="tag-estado">ACTIVO</span>
          </div>
          <p class="id-texto">ID: {{ chatbot.id }}</p>
          
          <div class="botonera">
            <button @click="abrirConfig(chatbot)" class="boton-opcion morado">⚙️ Configurar datos</button>
            <button @click="abrirGestorDocs(chatbot)" class="boton-opcion rosa">📄 Gestionar Doc</button>
            <button @click="verCodigo(chatbot)" class="boton-opcion negro">🔗 Integración en web</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="modalEdit" class="fondo-oscuro">
      <div class="ventana-popup">
        <h3>Editar Datos Chatbot</h3>
        
        <label class="titulo-input">Nombre</label>
        <input v-model="formName" placeholder="Ej: Asistente Virtual" class="input-grande" />
        
        <label class="titulo-input">Web Asignada</label>
        <input v-model="formWeb" placeholder="https://..." class="input-grande" />
        
        <div class="pie-modal">
           <button @click="modalEdit = false" class="boton-gris">Cancelar</button>
           <button @click="guardarCambios" class="boton-guardar">Guardar</button>
        </div>
      </div>
    </div>

    <div v-if="modalDocs" class="fondo-oscuro">
      <div class="ventana-popup">
        <h3>Conocimiento del Chatbot</h3>
        <div class="caja-lista-docs">
          <ul class="lista-limpia">
             <li v-if="documentosChatbot.length === 0" class="vacio">Chatbot sin contexto.</li>
             <li v-for="doc in documentosChatbot" :key="doc.nombre" class="item-doc">
               <span>{{ doc.nombre }}</span>
               <button @click="borrarDoc(doc.nombre)" class="borrar-x">x</button>
             </li>
          </ul>
        </div>
        <hr class="separador"/>
        <input type="file" @change="onFileSelect" accept=".pdf,.txt" style="margin-bottom:10px; display:block;" />
        <div class="pie-modal">
          <button @click="modalDocs = false" class="boton-gris">Cerrar</button>
          <button @click="subirArchivo" class="boton-guardar" :disabled="subiendo">
            {{ subiendo ? '...' : 'Subir' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="modalCode" class="fondo-oscuro" @click.self="modalCode=false">
        <div class="ventana-popup">
            <h3>Código para integrar en la web asignada</h3>
            <p style="color:#666; font-size:0.9rem;">Pegar esto en el <code>&lt;head&gt;</code>:</p>
            <!--Para q aparezca el chatbot en la web. Habría q poner el enlace real-->
            <div class="caja-codigo">
&lt;script src="https://sisdis-arch.com/widget.js"&gt;&lt;/script&gt;
&lt;script&gt; 
  SisDisARCH.init({ id: "{{ chatbotSeleccionado.id }}" }); 
&lt;/script&gt;
</div>
            <button @click="modalCode=false" class="boton-gris" style="margin-top:10px">Cerrar</button>
        </div>
    </div>

  </div>
</template>









<style scoped>
/* Layout principal */
.contenedor-principal { 
  padding: 40px; 
  font-family: 'Segoe UI', sans-serif; 
  max-width: 1000px; 
  margin: 0 auto; 
}

.caja-login { 
  max-width: 350px; 
  margin: 60px auto; 
  padding: 40px; 
  background: white; 
  border-radius: 16px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
  text-align: center; 
}
.area-google { margin-top: 20px; display: flex; justify-content: center; }
.texto-error { color: #db2777; margin-top: 15px; font-weight: bold;}

/* Dashboard */
.rejilla-bots { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: 20px; 
}

.ficha-bot { 
  background: white; 
  padding: 20px; 
  border-radius: 12px; 
  border: 1px solid #e9d5ff; 
}

.encabezado-ficha { 
  display: flex; 
  justify-content: space-between; 
  font-weight: bold; 
  color: #4c1d95; 
}

.tag-estado { 
  background: #d1fae5; 
  color: #065f46; 
  padding: 2px 8px; 
  border-radius: 10px; 
  font-size: 0.7rem; 
}

.id-texto { 
  font-family: monospace; 
  font-size: 0.8rem; 
  background: #f3f4f6; 
  padding: 5px; 
  margin: 10px 0;
}

.botonera { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  margin-top: 15px; 
}

/* Botones personalizados */
.boton-opcion { 
  border: none; 
  color: white; 
  padding: 10px; 
  border-radius: 6px; 
  cursor: pointer; 
  transition: 0.2s; 
}
.boton-opcion:hover { opacity: 0.9; }

.morado { background: #7c3aed; } 
.rosa { background: #db2777; } 
.negro { background: #1f2937; }

.boton-gris { 
  background: #f3f4f6; 
  border: 1px solid #ddd; 
  padding: 8px 12px; 
  cursor: pointer; 
  border-radius: 4px; 
  color: #333; 
}

.boton-guardar { 
  background: #db2777; 
  color: white; 
  border: none; 
  padding: 8px 15px; 
  border-radius: 4px; 
  cursor: pointer; 
}

.barra-superior {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

/* Modales y Popups */
.fondo-oscuro { 
  position: fixed; top:0; left:0; width:100%; height:100%; 
  background:rgba(0,0,0,0.5); 
  display:flex; justify-content:center; align-items:center; 
  z-index:9999;
}

.ventana-popup { 
  background:white; 
  padding:25px; 
  border-radius:12px; 
  width:450px; 
  max-height: 80vh; 
  overflow-y: auto; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.input-grande { 
  width: 100%; 
  padding: 10px; 
  margin: 5px 0 15px 0; 
  border: 1px solid #ccc; 
  border-radius: 6px; 
  box-sizing: border-box;
}

.titulo-input { 
  font-size: 0.9rem; 
  font-weight: bold; 
  color: #555; 
  display: block; 
  margin-top: 10px; 
}

.pie-modal { 
  display: flex; 
  justify-content: flex-end; 
  gap: 10px; 
  margin-top: 20px; 
}

.caja-codigo { 
  background: #222; 
  color: #eee; 
  padding: 12px; 
  border-radius: 6px; 
  font-family: monospace; 
  overflow-x: auto; 
  font-size: 0.8rem; 
  margin: 10px 0; 
}

/* Listados */
.caja-lista-docs { 
  background: #f9fafb; 
  padding: 10px; 
  border-radius: 8px; 
  border: 1px solid #eee; 
  margin-bottom: 20px;
}

.lista-limpia { 
  list-style: none; 
  padding: 0; 
  margin: 0; 
  max-height: 150px; 
  overflow-y: auto; 
}

.item-doc { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 8px 0; 
  border-bottom: 1px solid #eee; 
  font-size: 0.9rem; 
}

.borrar-x { 
  background: none; 
  border: none; 
  cursor: pointer; 
  font-size: 1.1rem; 
  color: #888;
}
.borrar-x:hover { color: red; transform: scale(1.1); }

.vacio { font-style: italic; color: #999; font-size: 0.85rem; padding: 5px; }
.separador { border: 0; border-top: 1px solid #ddd; margin: 15px 0; }
</style>