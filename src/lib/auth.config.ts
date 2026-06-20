import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types";

// Extended user shape (matches auth.ts)
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string | null;
}

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const ext = user as unknown as ExtendedUser;
        token.userId = ext.id;
        token.name = ext.name;
        token.role = ext.role;
        token.picture = ext.image ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
        session.user.image = token.picture ?? null;
      }
      return session;
    },
  },
};
