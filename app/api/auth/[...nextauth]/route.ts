// 4️⃣ Configurazione NextAuth.

// api/auth/[...nextauth]/route.ts è un custom endpoint server apposito di NextAuth

//1) app/api/... → crea API route lato server. Non è frontend, È codice che gira solo sul server (quindi e' sicuro creare jwt token qui)

// 🔹 2️⃣ Cos’è [...nextauth] ?

// Questa è una catch-all route di Next.js.

// In Next.js:

// [id] → parametro dinamico

// [...slug] → prende QUALSIASI sottopercorso

// Quindi, nel api path "/api/auth/":

// /api/auth/signin
// /api/auth/signout
// /api/auth/callback/google
// /api/auth/session

// tutti vengono gestiti da:
// [...nextauth], cosi NextAuth intercetta automaticamente questi path senza definirli manualmente

// 🧠 Flusso OAuth con NextAuth

// L’utente clicca “Sign in with Google” nella tua Next.js app (frontend).

// NextAuth apre Google OAuth → l’utente login → autorizza.

// Google richiama l’endpoint della tua Next.js app:
// http://localhost:3000/api/auth/callback/google (che definiamo quando creiamo OAuth in GCP)
// (quando fai l'host su render devi andare su gcp e dare questo url: (render frontend app url)/api/auth/callback/google)
// e anche Authorized JavaScript origins:http://localhost:3000 e lo url render frontend app
// Queste e' stato gia' fatto, e funziona in locale e su render

// ⚠️ api/auth/callback/google è un endpoint di default Next.js, NON FastAPI.
// NextAuth gestisce tutto internamente: riceve il callback, scambia il code per token, genera JWT lato frontend.

// Dopo il callback, NextAuth salva la session(auth/session) nel browser (cookie o JWT).

// Quando chiami il tuo backend FastAPI (/upload_pdf, /chat), invii il token JWT di NextAuth (dal cookie o header Authorization in questo caso).

import NextAuth from "next-auth"; //lato server (non nel browser!),
// import { encode } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    // potrai vedere il token in DevTools → Application → Storage → Cookies → localhost (next-auth.session-token = Jwt token value here )
    strategy: "jwt", // NextAuth crea un JWT (name, email, sub...) firmato con NEXTAUTH_SECRET sotto
    maxAge: 7 * 24 * 60 * 60, // 1 settimana di durata token, dopodiche redirect to login.
    // Se l’utente è attivo, NextAuth può comunque “refresharlo”
  }, // questa e' il jwt creato da nextauth che serve a validare la sessione dello user, in modo che questo
  // possa visitare le pagine entro le diverse pagine di questa next.js app

  // qui creiamo il jwt personalizzato compatibile con il verify 'jose' del nostro backend FastAPI.
  // Perche quando comunichiamo con un backen, dobbiamo mandare comunque il toke, per garanzia che
  // siamo autrnticati e possiamo comunicare in sicurezza con esso.
  // Dobbiamo creare il manualmente perche quello creato da next auth e' gia' 'cifrato', e quindi non
  // puo' essere letto e' validato da 'jose' nel backend perche nel backend ci aspettiamo un jwt token
  // puro (algorithms=["HS256"]), mentre quello validato da nextAuth e' gia cifrato ,
  // quindi illegibile per 'jose'. Quindi in breve qui generiamo un JWT standard HS256 per il backend
  callbacks: {
    async jwt({ token }) {
      // console.log("frontend env.key = ", process.env.BACKEND_JWT_SECRET!);
      // jwt e' il key di jwt defined in strategy sopra che contiene le info sullo user(il token)
      // ora lo trasformiamo in formato in alg: ["HS256"] compatibile col backend
      const backendToken = jwt.sign(
        // questo e jsonwebtoken, non piu' jwt di nextauth. Quindi il token del backend e' diverso di
        // quello del frontend creato da nextAuth
        { email: token.email, sub: token.sub },
        process.env.BACKEND_JWT_SECRET!,
        { expiresIn: "1h" },
      );
      token.backendAccessToken = backendToken;
      return token;
    },

    async session({ session, token }) {
      // 🔥 QUI rendiamo il JWT disponibile nel frontend per poterlo mandare al backend con  "Authorization: `Bearer ${token}`""
      // il token deve essere una stringa (encode) per poter essere verificato nel backend
      session.backendAccessToken = token.backendAccessToken as string;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET, // dopo l'handshake con google, NextAuth crea in automatico il proprio JWT token
  // che viene salvato in un cookie HTTP-only. HTTP-only significa che JavaScript nel browser NON può leggerlo
  // e che viene inviato automaticamente al server ad ogni richiesta. I dati nel token sono: name, email, picture...
  // Durata di Default di NextAuth: 30 giorni. Il token viene automaticamente rinnovato se l’utente è attivo
  // possiamo cambiarlo ad 1 settimana volendo
  // Questo jwt verra quindi  passato ad ogni request dello user
  // al backend, dove la' verra estratto, verificato, ed usato in questo caso per fare multitenant_rag(i namespaces su pinecone)
});

export { handler as GET, handler as POST };

// 🔹 In produzione (Render + Next.js)

// Frontend deployato su https://rag-frontend.onrender.com

// OAuth redirect URI da Google sarà:

// https://rag-frontend.onrender.com/api/auth/callback/google

// 🧠 Cosa significa “scambia il code per token”?

// Quando l’utente clicca Sign in with Google, succede questo:

// 🔹 1️⃣ Redirect a Google

// NextAuth manda l’utente a Google con:

// client_id

// redirect_uri

// scope

// response_type=code

// 🔹 2️⃣ Google autentica l’utente

// Google controlla:

// ✔ Email e password corrette

// ✔ L’utente è nella lista Test Users (se l’app è in Testing mode)

// ✔ Il redirect URI è valido

// Se tutto è OK → Google non manda ancora i token.

// Google rimanda il browser qui:

// http://localhost:3000/api/auth/callback/google?code=XYZ123

// ⚠️ Quello code=XYZ123 è una authorization code temporanea.

// 🔹 3️⃣ “Scambiare il code per token”

// Ora entra in gioco NextAuth.

// Il tuo endpoint:

// /api/auth/callback/google

// Riceve il code.

// NextAuth, lato server (non nel browser!), fa una richiesta POST a Google tipo:

// POST https://oauth2.googleapis.com/token

// con:

// client_id

// client_secret

// code

// redirect_uri

// grant_type=authorization_code

// 👉 Questo è lo “scambio”.

// Google risponde con:

// access_token

// id_token

// refresh_token (a volte)

// 🔹 4️⃣ NextAuth genera il SUO JWT

// Ora succede la parte importante.

// NextAuth:

// Decodifica l’id_token di Google

// Ottiene dati utente (email, nome, picture)

// Crea un suo JWT interno

// Lo salva nel browser (cookie)

// ⚠️ Questo JWT NON è quello di Google
// È un JWT firmato con:

// secret: process.env.NEXTAUTH_SECRET
