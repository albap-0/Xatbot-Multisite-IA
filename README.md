# TFG: BACKEND DEL XATBOT MULTISITE AMB IA

Aquest és el repositori del backend pel projecte. Principalment, està desenvolupat amb Node.js i Express. Actualment, gestiona la creació/eliminació de xatbots, gestiona accessos d'usuaris responsables i sistema de login per responsables i usuaris finals. 


## 1. TECNOLOGIES EMPRADES

* **Node.js:** Entorn d'execució.
* **Express.js:** Gestor del servidor i de les rutes. 
* **JSON (Fitxers):** Es fan servir per emmagatzemar les dades dels xatbots i usuaris(`/src/data/`).
* **dotenv:** Per gestionar les variables d'entorn, principalemnt tokens i claus.
* **uuid:** Per obtenir identificadors únics random per als xatbots i usuaris.
* **jsonwebtoken (JWT):** Per crear i verificar els tokens de sessió dels usuaris responsables i final users.
* **google-auth-library:** Per verificar els id_tokens proporcionats per Google Sign-In.

## 2. ESTRUCTURA DEL PROJECTE

El projecte segueix una estructura que divideix responsabilitats, per incloure bones pràctiques i sigui fàcil d'entendre.

* `src/`
    * `controllers/`: Conté la lògica, implementa què s'ha de fer amb cada petició
        * `chatbotController.js`
        * `responsibleController.js`
        * `authController.js`
    * `routes/`: Defineix els endpoints i indica quina funció del controlar s'ha de cridar.
        * `chatbotRoutes.js`
        * `responsibleRoutes.js`
        * `authRoutes.js`
    * `middleware/`: S'encarrega de protegir i oferir seguretat al disseny.
        * `adminAuth.js` 
        * `responsibleAuth.js`
    * `storage/`: Principalment s'encarrega de gestionar la lectura i escriptura dels fitxers JSON d'emmagatzematge.
    * `data/`: Directori on es troben els fitxers JSON d'emmagatzematge, per xatbots, usuaris responsables i usuaris finals.
* `app.js`: És el fitxer principal del projecte, on s'inicia el servidor.
* `.env`: Fitxer que conté les claus secretes.
* `test-login.html`: Fitxer HTML per fer les proves de login amb Google.

## 3. DEPENDÈNCIES, INSTAL·LACIONS I EXECUCIÓ

**REQUISITS:** Cal tenir [Node.js](https://nodejs.org/) instal·lat.

1.  Instal·lar les dependències:
    ```bash
    npm install
    ```

2.  Configurar les Variables d'Entorn:
    * Assegurar-se de tenir el fitxer `.env` a la carpeta `backend/`.
    * Ha d'incloure :
    ```env
    PORT=3000
    ADMIN_TOKEN=token_admin
    DATA_PATH=./src/data
    JWT_SECRET=secret_jwt
    GOOGLE_CLIENT_ID=id_client_google.apps.googleusercontent.com
    ```

3.  Executar el servidor:
    ```bash
    node src/app.js
    ```
    Un cop això, el servidor s'executa a `http://localhost:3000`

## 4. MANUAL D'ÚS (API ENDPOINTS)

En aquesta part del document s'explica com fer servir l'API.

### AUTENTICACIÓ

Hi ha 3 rols diferents d'usuari i, per tant, tres nivells d'accés:

1.  **Administrador:** Requereix una capçalera (Header) `x-admin-token` amb el valor d'`token_admin`.
2.  **Usuari Responsable:** Requereix en `Authorization` indicar el valor `Bearer [TOKEN_JWT]`. Aquest token s'obté de `/auth/login-responsible`.
3.  **Usuari Final:** Requereix una capçalera `Authorization` amb el valor `Bearer [TOKEN_JWT]`. Aquest token s'obté de `/auth/login-final-user`.


### ROL: ADMINISTRADOR

S'encarrega de crear, eliminar i gestionar els xatbots: 

1. **`POST /chatbots`** crea un nou xatbot buit, requereix l'autenticació de l'Admin. Si la petició resulta exitosa, el servidor retorna un codi 201 Created amb l'id del nou xatbot. 

2. **`DELETE /chatbots/:id`** elimina un nou xatbot pel seu id, requereix l'autenticació de l'Admin. Si la petició resulta exitosa, el servidor retorna un codi 204 No content. 

Altrament, s'encarrega de crear, eliminar i gestionar accesos a usuaris responsables. 

3. **`POST /responsibles`** crea un accés responsable a un usuari. Afegeix el correu a una llista d'autoritzats i requereix l'autenticació de l'Admin. A la petició, s'ha d'incloure al body (JSON): `{ "email": "usuari@empresa.com" }` i, en cas d'èxit, el servidor 
retorna codi 201 Created amb l'objecte del nou usuari responsable. 

4. **`DELETE /responsibles/:id`** elimina l'accés d'un usuari responsable i el desassigna tots els seus xatbots. Requereix l'autenticació de l'admin i, en cas de petició exitosa, el servidor respon amb un codi 204 No Content. 

5. **`POST /responsibles/:responsibleId/assign-chatbot`** Assigna un xatbot a un usuari responsable. Requereix l'autenticació de l'Admin i la inclusió de l'id del xatbot al body(JSON): `{ "chatbotId": "..." }` i, en cas d'èxit, retorna codi 200 OK amb el xatbot actualitzat. 

6. **`POST /responsibles/unassign-chatbot/:chatbotId`** Desassigna un xatbot de qualsevol responsable. Requereix l'autenticació de l'Admin. Al fer la petició exitosa, el servidor retorna codi 200 OK amb el xatbot actualitzat, és a dir, amb owner:null. 


### ROL: USUARI RESPONSABLE

Fins ara, únicament pot fer login com a responsable i veure el llistat dels seus xatbots. 

1. **`POST /auth/login-responsible`** Inicia sessió un usuari responsable. Rep un id_token de Google, el verifica i comprova que el correu estigui a la llista d'autoritzats, en el cas que ho estigui, retorna un token de sessió (JWT). En el body de la petició s'ha incloure en format JSON: `{ "id_token": "..." }`. La resposta en cas d'èxit és un 200 OK amb `{ "token": "JWT...", "user": {...} }`.

2. **`GET /responsibles/my-chatbots`** S'obté una llista dels xatbots que pertanyen a l'usuari autenticat. Requerix l'autenticació de l'usuari responsable amb el Bearer Token. En cas d'èxit, es rep un codi 200 OK amb un array dels seus xatbots. 


### ROL: USUARI FINAL

Pel moment, l'usuari final només té la capacitat de registrar-se/fer login. 

1. **`POST /auth/login-final-user`** L'usuari final fa login/registre. Rep un id_token de Google i el verifica. Si l'usuari no exiteix, el crea. Retorna també un token de sessió (JWT). No cal autenticació d'altres rols superiors i s'ha d'incloure en el body, en format JSON: `{ "id_token": "..." }`. La resposta en cas d'èxit és un 200 OK amb `{ "token": "JWT...", "user": {...} }`.



## 5. RECURSOS DE PROVA (Postman)

Per facilitar la validació i les proves de l'API, s'ha fet una col·lecció de Postman 
(`TFG.postman_collection.json`) que inclou totes les peticions descrites en aquest manual. 
-  Importar la col·lecció a Postman.
-  S'ha de configurar les variables d'entorn a Postman (`admin-token`, etc.).
-  Per a les peticions protegides de responsable, s'ha d'obtenir primer un token JWT (del endpoint `/auth/login-responsible`) i afegir-lo manualment a la capçalera "Authorization" (Bearer Token).


## 6. NOTA SOBRE EL FITXER `.env`

Aquest lliurament inclou el fitxer `.env` amb les claus necessàries (`GOOGLE_CLIENT_ID`, `ADMIN_TOKEN`, etc.) per poder executar i avaluar el projecte directament.

S'ha pres aquesta decisió per facilitar el procés de correcció. En un entorn real, aquest fitxer no s'inclouria amb les dades reals en un repositori, sinó 
que s'afegiria un fitxer `.env.example` d'exemple, o sigui, una plantilla buida. 
