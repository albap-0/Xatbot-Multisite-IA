<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { GoogleLogin } from 'vue3-google-login' 
import { marked } from 'marked' 

const props = defineProps({
  chatbotId: {
    type: String,
    required: true
  }
})

//estados reactivos
//AUTENTICACIÓN
const abierto = ref(false)
const logueado = ref(false) 
const token = ref('')
const currentUser = ref(null)
const errorAuth = ref('')

//CHAT Y MENSAJES
const listaMensajes = ref([])
const textoInput = ref('')
const cargando = ref(false)
const mostrarWidget = ref(false)


//funciones
const toggleChat = () => {
  abierto.value = !abierto.value;
  if (abierto.value) {
    // para bajar el scroll
    setTimeout(() => bajarScroll(), 100)
  }
}

const parsearMD = (txt) => {
  if(!txt) return ''
  try {
    return marked.parse(txt)
  } catch (e) {
    console.error("Fallo marked:", e)
    return txt
  }
}

//login con google
const loginOK = async (response) => {
  errorAuth.value = ''
  
  try {
    const res = await fetch('http://localhost:3000/auth/login-final-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: response.credential })
    })
    
    const data = await res.json()
    //console.log("Login back:", data)

    if (!res.ok) throw new Error(data.error || 'Login fallido')

    token.value = data.token 
    currentUser.value = data.user
    logueado.value = true
    
    //mensaje de bienvenida falso, ya q no lo envía al backend
    listaMensajes.value.push({ 
      id: 0, 
      content: `Hola <b>${data.user.name}</b>! <br>Soy tu asistente virtual. En qué puedo ayudarte?`, 
      isMe: false 
    })
  } catch (err) {
    console.error(err)
    errorAuth.value = 'Error: ' + err.message
  }
};

const loginFail = (err) => {
  errorAuth.value = "No se puede conectar con google."
}

const enviar = async () => {
  const txt = textoInput.value.trim()
  if (!txt) return

  // 1. mostrar el mensaje del usuario
  listaMensajes.value.push({ 
    id: Date.now(), 
    content: parsearMD(txt), 
    isMe: true 
  })
  
  textoInput.value = ''
  cargando.value = true
  await bajarScroll()

  try {
    // 2. llamada al backend para obtener respuesta
    const res = await fetch(`http://localhost:3000/api/chat/${props.chatbotId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({ question: txt })
    })

    const data = await res.json()
    
    // 3. Respuesta del chatbot-IA
    listaMensajes.value.push({
      id: Date.now() + 1,
      content: parsearMD(data.answer || "No te he entendido, perdona."),
      isMe: false
    })

  } catch (error) {
    console.error("Error chat:", error)
    listaMensajes.value.push({ 
      id: Date.now(), 
      content: "<i>Error de conexión...</i>", 
      isMe: false 
    })
  } finally {
    cargando.value = false
    bajarScroll()
  }
}

const bajarScroll = async () => {
  await nextTick();
  const el = document.querySelector('.cuerpo-mensajes') 
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}

onMounted(async () => {
  //console.log("Comprobar widget ID:", props.chatbotId)
  try {
    const res = await fetch(`http://localhost:3000/api/chat/verify/${props.chatbotId}`)
    const data = await res.json()

    if (data.allowed) {
      mostrarWidget.value = true
    } else {
      console.warn("Chatbot no permitido para esta página")
    }
  } catch (e) {
    console.error("Error verificar:", e)
    // mostrarWidget.value = true 
  }
})
</script>











<template>
  <div v-if="mostrarWidget">
    <div class="contenedor-chat">
    
      <button v-if="!abierto" @click="toggleChat" class="btn-abrir">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      <div v-else class="ventana-chat">
      
        <div class="header-top">
          <div class="titulo">Asistente IA</div>
          <button @click="toggleChat" class="btn-cerrar" title="Minimizar">─</button>
        </div>

        <div v-if="!logueado" class="zona-login">
          <h3>¡Bienvenido!</h3>
          <p>Inicia sesión para preguntar</p>
          <div class="box-google">
            <GoogleLogin :callback="loginOK" :error="loginFail" />
          </div>
          <p v-if="errorAuth" class="txt-error">{{ errorAuth }}</p>
        </div>

        <div v-else class="zona-chat">
          <div class="cuerpo-mensajes">
            <div 
              v-for="msg in listaMensajes" 
              :key="msg.id" 
              :class="['fila-msg', msg.isMe ? 'lado-dcha' : 'lado-izq']"
            >
              <div class="globo" v-html="msg.content"></div>
            </div>
          
            <div v-if="cargando" class="fila-msg lado-izq">
              <div class="globo escribiendo"><span>.</span><span>.</span><span>.</span></div>
            </div>
          </div>
        </div>

        <div class="zona-input">
          <input 
            v-model="textoInput" 
            @keyup.enter="enviar" 
            placeholder="Escribe aquí..." 
            :disabled="cargando"
          />
          <button @click="enviar" :disabled="!textoInput.trim()">➤</button>
        </div>
      </div>
    </div>

  </div>
</template>















<style scoped>
/* Contenedor principal fixed */
.contenedor-chat {
  position: fixed; bottom: 25px; right: 25px; z-index: 10000;
  font-family: 'Segoe UI', sans-serif;
}

.btn-abrir {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #8b5cf6); 
  color: white; border: none;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s;
}
.btn-abrir:hover { transform: scale(1.05); }

/* Caja principal */
.ventana-chat {
  width: 360px; height: 520px;
  background: #fff; 
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  border: 1px solid #e5e7eb;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-top {
  background: linear-gradient(to right, #ec4899, #8b5cf6);
  color: white; padding: 16px 20px;
  display: flex; justify-content: space-between; align-items: center;
  font-weight: 700; font-size: 1.05rem;
}
.btn-cerrar { 
  background: rgba(255,255,255,0.25); border-radius: 50%;
  width: 26px; height: 26px; border: none; color: white; 
  cursor: pointer; display:flex; align-items:center; justify-content:center;
  padding-bottom: 2px;
}
.btn-cerrar:hover { background: rgba(255,255,255,0.4); }

/* Layout Chat */
.zona-chat { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: #fdf2f8; }
.cuerpo-mensajes {
  flex: 1; padding: 15px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px;
}

/* Mensajes */
.fila-msg { display: flex; width: 100%; }
.lado-dcha { justify-content: flex-end; }
.lado-izq { justify-content: flex-start; }

.globo {
  max-width: 80%; padding: 10px 15px; border-radius: 18px;
  font-size: 0.95rem; line-height: 1.45;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  word-wrap: break-word;
}
.lado-dcha .globo {
  background: #8b5cf6; color: white; border-bottom-right-radius: 4px;
}
.lado-izq .globo {
  background: white; color: #374151;
  border: 1px solid #e5e7eb; border-bottom-left-radius: 4px;
}

/* Markdown fixes */
.lado-izq .globo :deep(strong) { color: #d946ef; font-weight: 700; }
.lado-izq .globo :deep(a) { color: #8b5cf6; text-decoration: underline; }
.lado-izq .globo :deep(p) { margin: 0; }

/* Input abajo */
.zona-input {
  padding: 15px; background: white; border-top: 1px solid #f3f4f6;
  display: flex; gap: 10px;
}
input {
  flex: 1; padding: 10px 15px;
  border: 1px solid #e5e7eb; border-radius: 25px;
  outline: none; font-size: 0.95rem; background: #f9fafb;
}
input:focus { border-color: #d946ef; background: #fff; }

.zona-input button {
  background: #d946ef; color: white; border: none;
  width: 42px; height: 42px; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.zona-input button:disabled { background: #e5e7eb; cursor: default; }
.zona-input button:hover:not(:disabled) { background: #c026d3; }

/* Pantalla Login */
.zona-login { 
  flex: 1; display: flex; flex-direction: column; 
  justify-content: center; align-items: center; 
  text-align: center; padding: 30px; background: #fff;
}
.zona-login h3 { color: #8b5cf6; margin-bottom: 8px; font-size: 1.4rem; }
.txt-error { color: #db2777; font-size: 0.85rem; margin-top: 15px; font-weight: bold; }
.box-google { margin-top: 20px; }

/* Animacion puntos */
.escribiendo span { 
  background-color: #d946ef; display: inline-block;
  width: 5px; height: 5px; border-radius: 50%; margin-right: 4px;
  animation: blink 1.4s infinite both; 
}
.escribiendo span:nth-child(2) { animation-delay: 0.2s; }
.escribiendo span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
</style>