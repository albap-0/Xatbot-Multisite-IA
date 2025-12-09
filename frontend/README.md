# TFG: FRONTEND DEL XATBOT MULTISITE AMB IA

Aquest és el frontend del projecte. Està fet amb **Vue.js 3** i funciona tant per gestionar els xatbots (si ets usuari responsable) com per utilitzar-los (si ets usuari final).

Per fer les proves més fàcils, s'ha posat tot en una única aplicació: hi ha un panell d'administració de xatbots i una web inventada amb un xatbot integrat.

## 1. TECNOLOGIES EMPRADES

* **Vue.js 3:** El framework que fa funcionar tot (amb `<script setup>`, que és més net).
* **Vite:** Fa que el servidor de desenvolupament vagi molt ràpid.
* **vue3-google-login:** Per poder entrar amb el compte de Google.
* **marked:** Perquè els missatges del xat es vegin bé amb format (negretes, llistes, codi...).
* **CSS Scoped:** Els estils estan dins de cada component, per no fer servir Bootstrap ni altres frameworks externs.

## 2. ESTRUCTURA DEL PROJECTE

L'estructura és senzilla i conté dos components:

* `src/`
    * `components/`:
        * `RespDashboard.vue`: El panell de control on el responsable veu els seus xatbots assignats, on puja PDFs i configura la web assignada al xatbot.
        * `ChatWidget.vue`: La bombolla del xatbot que es comunica amb l'API i mostra els missatges del xatbot.
    * `App.vue`: El component arrel. Conté una barra a l'inici de tot per canviar entre la vista d'**Usuari Responsable** i la vista d'**Usuari Final**.
    * `main.js`: Punt d'entrada on s'inicialitza l'app i el plugin de Google Auth.

## 3. INSTAL·LACIÓ I EXECUCIÓ

**REQUISITS:** Tenir el Backend executant al port 3000.

1.  Instal·lar dependències:
    Dins la carpeta `frontend/`:
    ```bash
    npm install
    ```

2.  Configurar les Variables d'Entorn:
    * Assegurar-se de tenir el fitxer `.env` a la carpeta `backend/`.
    * Ha d'incloure :
    ```env
    GOOGLE_CLIENT_ID=id_client_google.apps.googleusercontent.com  
    ```
    Per assegurar-se que on s'inicialitza Vue (a `main.js`), el `GOOGLE_CLIENT_ID` coincideix amb el del backend. 
    

    *Nota: A `RespDashboard.vue` i `ChatWidget.vue` les crides a l'API apunten a `http://localhost:3000`. Si canvies el port del backend, recorda canviar-lo aquí.*

3.  **Arrencar el servidor de desenvolupament:**
    ```bash
    npm run dev
    ```
    Obre el navegador a `http://localhost:5173`.

## 4. MANUAL D'ÚS (INTERFÍCIE)

L'aplicació té l'opció d'alternar els rols ràpidament a la part superior: 

### VISTA: USUARI RESPONSABLE
1.  Fes login amb Google amb un correu autoritzat.
2.  Veuràs el **Dashboard** amb els teus xatbots assignats.
3.  Pots:
    * **Configurar:** Canviar el nom i la web assignada del xatbot.
    * **Gestionar Doc:** Pujar PDFs/TXTs/URL o eliminar-los.
    * **Integració:** Veure l'script (simulat) per copiar a la web a integrar.

### VISTA: USUARI FINAL
1.  Mostra una web falsa d'una empresa inventada ("SisDis ARCH").
2.  Si la web és l'assignada al xatbot (es comprova primer amb l'endpoint `/verify`), sota a la dreta apareix el **ChatWidget**. Si no es així, el widget no es mostra.
3.  Si l'usuari no està loguejat, demana login amb Google dins del xat per poder parlar.

## 5. NOTA SOBRE EL FITXER `.env`

Aquest lliurament inclou el fitxer `.env` amb la clau necessària (`GOOGLE_CLIENT_ID`) per poder executar i avaluar el projecte directament.

S'ha pres aquesta decisió per facilitar el procés de correcció. En un entorn real, aquest fitxer no s'inclouria amb les dades reals en un repositori, sinó 
que s'afegiria un fitxer `.env.example` d'exemple, o sigui, una plantilla buida. 