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
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token }) {
      const backendToken = jwt.sign(
        { email: token.email, sub: token.sub },
        process.env.BACKEND_JWT_SECRET!,
        { expiresIn: "1h" },
      );
      token.backendAccessToken = backendToken;
      return token;
    },

    async session({ session, token }) {
      session.backendAccessToken = token.backendAccessToken as string;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
