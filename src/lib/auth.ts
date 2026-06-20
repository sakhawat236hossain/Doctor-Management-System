import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { PatientModel } from "@/models/Patient";
import { authConfig } from "@/lib/auth.config";
import type { UserRole } from "@/types";

// Extended user shape for passing role/image through OAuth flow
interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string | null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const user = await UserModel.findOne({
          email: credentials.email as string,
        }).select("+password");

        if (!user || !user.isActive || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.profileImage || null,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials provider — already handled by authorize()
      if (account?.provider === "credentials") {
        return true;
      }

      // OAuth providers (Google / Facebook)
      const email = user.email?.toLowerCase();

      // Facebook might not return an email — block that case
      if (!email) {
        return "/login?error=NoEmail";
      }

      await connectDB();

      // Check if user already exists (from credentials signup or previous OAuth)
      const existingUser = await UserModel.findOne({ email });

      if (existingUser) {
        // Check if account is deactivated
        if (!existingUser.isActive) {
          return "/login?error=AccountDeactivated";
        }

        // Link accounts — use existing user data
        const ext = user as unknown as ExtendedUser;
        ext.id = existingUser._id.toString();
        ext.name = existingUser.name;
        ext.email = existingUser.email;
        ext.role = existingUser.role;
        ext.image = existingUser.profileImage || null;

        // Track this provider in authProviders if not already present
        const provider = account?.provider || "";
        if (provider && !existingUser.authProviders?.includes(provider)) {
          await UserModel.updateOne(
            { _id: existingUser._id },
            { $addToSet: { authProviders: provider } }
          );
        }

        return true;
      }

      // New OAuth user — create as patient
      const newUser = await UserModel.create({
        name: user.name || profile?.name || email.split("@")[0],
        email,
        password: "", // no password for OAuth users
        role: "patient",
        phone: "",
        profileImage: user.image || "",
        isActive: true,
        authProviders: [account?.provider || "google"],
      });

      // Create a skeleton Patient document (user fills details later)
      await PatientModel.create({
        userId: newUser._id,
        dateOfBirth: new Date("2000-01-01"),
        gender: "other",
        bloodGroup: "O+",
        address: "",
        emergencyContact: "",
      });

      const ext = user as unknown as ExtendedUser;
      ext.id = newUser._id.toString();
      ext.name = newUser.name;
      ext.email = newUser.email;
      ext.role = "patient";
      ext.image = newUser.profileImage || null;

      return true;
    },
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
});
