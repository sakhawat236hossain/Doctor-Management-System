import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: string;
    name: string;
    role: UserRole;
    picture?: string | null;
  }
}
