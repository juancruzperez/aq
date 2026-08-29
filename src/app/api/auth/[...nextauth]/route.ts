import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "../../../../db";
export const authOptions: NextAuthOptions = {
  // Conectamos NextAuth con Drizzle para guardar los usuarios en Neon
  adapter: DrizzleAdapter(db) as any, 
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Este callback inyecta el ID y el Rol del usuario en la sesión activa
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // El rol viene de nuestra base de datos (por defecto es CLIENT)
        session.user.role = (user as any).role; 
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

// Exportamos los métodos GET y POST requeridos por App Router
export { handler as GET, handler as POST };