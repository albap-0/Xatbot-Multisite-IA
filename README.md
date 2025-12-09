# TFG: SISTEMA DE XATBOTS MULTISITE AMB IA

Benvingut al repositori principal del Treball de Final de Grau. Aquest projecte implementa una plataforma on usuaris responsables poden crear, entrenar i gestionar xatbots intel·ligents per a les seves pàgines web. En canvi, els usuaris finals poden consultar aquests xatbots. Des del backend, l'administrador pot gestionar els accessos als responsables i gestionar la creació/eliminació i assignació de xatbots. 

El sistema integra la IA de Mistral per generar respostes, perquè els xatbots responguin preguntes basant-se només en els documents (PDFs, webs) que puja l'U.Responsable. 

## 1. TECNOLOGIES EMPRADES

**Backend:** Node.js, Express, Multer, LangChain, jsonwebtoken (JWT), Cors, Google Auth.

**Frontend:** Vue.js 3, Vite, Vue3-Google-Login, marked, CSS Scoped.

**Base de Dades:** PostgreSQL amb pgVector, JSON (Fitxers).

**IA:** Mistral AI (mistral-tiny per respostes, mistral-embed per vectors).


##  2. ESTRUCTURA DEL REPOSITORI

El projecte està dividit en dues carpetes principals:

* **`backend/`**: Entorn d'execució.
    * Servidor Node.js amb Express.
    * Es connecta a la BBDD. 
    * Integració amb Mistral AI per generar respostes i embeddings. 
    * Gestió d'usuaris amb JWT i pujada de documents.
    * *Més info al README de dins.*

* **`frontend/`**: La interfície.
    * Fet amb Vue.js 3.
    * Té un panell d'administració d'U.responsable per gestionar els seus xatbots i pujar documents.
    * Té el widget del xat que es pot integrar a qualsevol web.
    * *Més info al README de dins.*

A més, usa una base de dades PostgreSQL amb l'extensió pgvector per guardar els vectors dels documents. 


## 3. REQUISITS PREVIS GLOBALS

Per posar-ho en marxa necessites:

1.  **Node.js** (v22.14.0, però com a mínim tenir v16).
2.  **PostgreSQL** amb l'extensió pgvector instal·lada.
3.  Un compte a **Mistral AI** (per tenir la clau de l'API).
4.  Credencials de **Google Cloud Console** (Client ID) per poder fer login.

## 4. CONFIGURACIÓ DE L'ENTORN

Cal crear un fitxer `.env` tant a `backend/` com a `frontend/` amb les claus que necessita cada part. Mira els READMEs de dins de cada carpeta per saber què has de posar exactament. 

## 5. INSTAL·LACIÓ I EXECUCIÓ

Necessites dues terminals obertes:

**TERMINAL 1 (Backend):**
```bash
cd backend
npm install
# Crea el fitxer .env amb les claus (mira el README del backend)
node src/app.js
```
**TERMINAL 2 (Frontend):**
```bash
cd frontend
npm install
# Crea el fitxer .env amb les claus (mira el README del frontend)
npm run dev
```
Després d'això, obre el navegador a `http://localhost:5173` i assegura't que el backend està escoltant a `http://localhost:3000`. 


## 6. EXEMPLE DE COM PROVAR-HO

1. Entrar com a U.Responsable (login amb Google). 
2. Modificar el nom d'un xatbot i assignar la web on es podrà usar. 
3. Pujar un PDF amb informació pel xatbot. 
4. Canviar a la vista d'U.Final. 
5. Fer login amb Google dins del xat. 
6. Fer alguna pregunta sobre el pdf anteriorment pujat. 
7. El xatbot busca la informació a la base de dades vectorial i amb IA respon. 