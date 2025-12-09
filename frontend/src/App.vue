<script setup>
import { ref } from 'vue'
import ChatWidget from './components/ChatWidget.vue'
import RespDashboard from './components/RespDashboard.vue'

//estado para cambiar entre la vista de u.resp y u.final
const currentView = ref('client') 

//ID del bot para la prueba
//mover a vbles de entorno?
const CHATBOT_PRUEBA_ID = "7bfcb249-ffdb-49a0-805f-2f4dba2942ba" 

const switchView = (mode) => {
  console.log("Cambiando vista a:", mode)
  currentView.value = mode
}
</script>









<template>
  <div class="app-main">
    
    <div class="top-bar-debug">
      <span class="label-tfg">Pruebas TFG:</span>
      <div class="btn-group">
        <button 
          @click="switchView('resp')" 
          :class="{ active: currentView === 'resp' }"
        >U.Responsable</button>
        <button 
          @click="switchView('client')" 
          :class="{ active: currentView === 'client' }"
        >U.Final</button>
      </div>
    </div>

    <RespDashboard v-if="currentView === 'resp'" />

    <div v-else class="landing-wrapper">
      <header>
        <div class="brand">SisDis <span class="highlight">ARCH</span></div>
        <nav>
          <a href="#" class="nav-link active">Inicio</a>
          <a href="#" class="nav-link">AWS Cloud</a>
          <a href="#" class="nav-link">Servicios</a>
          <a href="#" class="nav-link">Recursos</a>
        </nav>
      </header>

      <main>
        <div class="hero-section">
          <p class="pre-title">Sistemas Distribuidos & Alta Disponibilidad</p>
          <h1>Escalabilidad sin límites</h1>
          <p class="subtitle">
            Infraestructuras tolerantes a fallos, gestión de VPCs en AWS y caching con Redis.
            Todo lo que tu empresa necesita para no caerse en Black Friday.
          </p>
          
          <div class="hero-actions">
            <button class="btn primary">Ver Arquitectura</button>
            <button class="btn outline">Documentación</button>
          </div>
        </div>
        
        <div class="info-content">
          <h3>Sobre nosotros</h3>
          <p>
            En SisDis dominamos los retos de computación moderna: consistencia de datos, 
            particionamiento (<strong>Sharding</strong>) y algoritmos de consenso como Raft.
            Usa el widget de abajo para preguntar dudas técnicas a nuestra IA.
          </p>

          <div class="contact-grid">
            <div class="card-icon">✉️ Contacto</div>
            <div class="card-icon">💬 WhatsApp</div>
            <div class="card-icon">📞 Llamar</div>
          </div>
        </div>
      </main>

      <ChatWidget :chatbotId="CHATBOT_PRUEBA_ID" />
    </div>

  </div>
</template>










<style>
/* configuración gneral */
body { margin: 0; padding: 0; background: #f3f0ff; font-family: 'Segoe UI', sans-serif; }
</style>

<style scoped>
/* estilos para la barra de arriba del todo */
.top-bar-debug {
  background: #111827; color: #fff; padding: 12px; 
  display: flex; justify-content: center; align-items: center; gap: 20px;
  position: sticky; top: 0; z-index: 99999;
  border-bottom: 2px solid #db2777;
}
.label-tfg { font-weight: bold; color: #f472b6; letter-spacing: 1px;}
.btn-group { display: flex; gap: 10px; }
.top-bar-debug button {
  background: transparent; border: 1px solid #4b5563; color: #d1d5db; 
  padding: 6px 18px; cursor: pointer; border-radius: 6px; transition: all 0.2s;
}
.top-bar-debug button:hover { background: #374151; }
.top-bar-debug button.active {
  background: #db2777; color: white; border-color: #db2777; font-weight: bold;
}

/* Página de llegada falsa */
.landing-wrapper { min-height: 100vh; background-color: #f3f0ff; color: #333; }

header { 
  background: linear-gradient(135deg, #4c1d95, #be185d); 
  color: white; padding: 15px 40px; 
  display: flex; justify-content: space-between; align-items: center; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.brand { font-size: 1.6rem; font-weight: 800; }
.highlight { color: #fbcfe8; } 

.nav-link { 
  color: rgba(255,255,255,0.85); margin-left: 25px; 
  text-decoration: none; font-weight: 500; font-size: 0.95rem;
}
.nav-link:hover, .nav-link.active { color: #fff; text-shadow: 0 0 5px rgba(255,255,255,0.3); }

main { padding: 80px 20px; max-width: 900px; margin: 0 auto; text-align: center;}

.hero-section { margin-bottom: 70px; }
.pre-title { color: #db2777; font-weight: bold; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }

h1 {
  font-size: 3.5rem; margin: 15px 0;
  background: -webkit-linear-gradient(#6d28d9, #db2777);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.subtitle { font-size: 1.2rem; color: #555; margin-bottom: 35px; max-width: 650px; margin-left: auto; margin-right: auto;}

.hero-actions { display: flex; gap: 15px; justify-content: center; }
.btn {
  border: none; padding: 12px 30px; font-size: 1rem; border-radius: 50px; 
  cursor: pointer; font-weight: 600; transition: transform 0.2s;
}
.btn.primary { background: #7c3aed; color: white; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); }
.btn.outline { background: white; color: #7c3aed; border: 2px solid #7c3aed; }
.btn:hover { transform: translateY(-3px); }

.info-content h3 { color: #4c1d95; margin-bottom: 15px; font-size: 1.8rem;}
.info-content p { max-width: 700px; margin: 0 auto 40px auto; line-height: 1.6; color: #4b5563; }

.contact-grid { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;}
.card-icon {
  background: white; padding: 20px 30px; border-radius: 12px; 
  box-shadow: 0 4px 6px rgba(0,0,0,0.04); color: #444; font-weight: 600; cursor: pointer;
  border: 1px solid #fce7f3; transition: all 0.2s;
}
.card-icon:hover { box-shadow: 0 10px 15px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: #f472b6;}
</style>