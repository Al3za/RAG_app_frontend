import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    backendAccessToken?: string;
    // accessToken?: JWT | string | undefined; // definiamo il nostro custom "accessToken" value con il corretto type di jwt di
    // next-auth. Qui attingiamo alla stringa email, name ecc..
    // JWT e' il 'object type', mentre la stringa ci serve per mandarlo al backend e nonricevere l'error
    // durante lo JSON.stringify(token) process
  }
}

// Perché serve questa cosa?

// NextAuth definisce Session così:

// interface Session {
//   user?: {
//     name?: string
//     email?: string
//     image?: string
//   }
//   expires: string
// }

// Quando aggiungi proprietà custom (jwt, accessToken, role, ecc.), devi dirlo a TypeScript cosi'
// come facciamo sopra.
