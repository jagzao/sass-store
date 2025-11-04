import { DefaultSession } from "next-auth";

// Extend the default session user type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string;
      name?: string;
      image?: string;
      role?: string;        // RBAC role
      tenantSlug?: string;  // Current tenant slug
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    tenantSlug?: string;
  }
}

// Extend the JWT token type
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    tenantSlug?: string;
  }
}