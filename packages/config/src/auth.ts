import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@sass-store/database";
import { users, tenants, staff, userRoles } from "@sass-store/database/schema";
import { eq, and, sql } from "@sass-store/database";
import { validateApiKey, validateSimpleApiKey } from "./auth-api";

const RBAC_ROLES = ["Admin", "Gerente", "Personal", "Cliente"] as const;
type RbacRole = (typeof RBAC_ROLES)[number];

const ROLE_FALLBACKS: Record<string, RbacRole> = {
  Administrador: "Admin",
  admin: "Admin",
  gerente: "Gerente",
  manager: "Gerente",
  Personal: "Personal",
  personal: "Personal",
  staff: "Personal",
  Cliente: "Cliente",
  cliente: "Cliente",
  customer: "Cliente",
};

function normalizeRole(role: string | null | undefined): RbacRole {
  if (!role) {
    return "Cliente";
  }

  if (RBAC_ROLES.includes(role as RbacRole)) {
    return role as RbacRole;
  }

  const directFallback = ROLE_FALLBACKS[role];
  if (directFallback) {
    return directFallback;
  }

  const lowerFallback = ROLE_FALLBACKS[role.toLowerCase()];
  if (lowerFallback) {
    return lowerFallback;
  }

  return "Cliente";
}

const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant Slug", type: "text" },
        rememberMe: { label: "Remember Me", type: "boolean" },
      },
      async authorize(credentials) {
        // Simplified logging for performance
        if (
          !credentials?.email ||
          !credentials?.password ||
          !credentials?.tenantSlug
        ) {
          console.log("[NextAuth] Missing credentials");
          return null;
        }

        try {
          // Find user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          if (!passwordMatch) {
            return null;
          }

          // Find tenant - critical for RLS
          const [tenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.slug, credentials.tenantSlug as string))
            .limit(1);

          if (!tenant) {
            console.log("[NextAuth] Tenant not found");
            return null;
          }

          // SET RLS CONTEXT - CRITICAL FOR VIEWING STAFF/ROLES
          try {
            await db.execute(
              sql`SELECT set_tenant_context(${tenant.id}::uuid)`,
            );
          } catch (rlsError) {
            console.error("[NextAuth] Failed to set RLS context:", rlsError);
          }

          // Check for existing role assignment
          const [roleAssignment] = await db
            .select({ role: userRoles.role })
            .from(userRoles)
            .where(
              and(
                eq(userRoles.userId, user.id),
                eq(userRoles.tenantId, tenant.id),
              ),
            )
            .limit(1);

          let userRole: RbacRole = "Cliente"; // Default role

          if (roleAssignment) {
            userRole = roleAssignment.role as RbacRole;
          } else {
            // Check staff table as fallback
            const [staffMember] = await db
              .select({ role: staff.role })
              .from(staff)
              .where(
                and(
                  eq(staff.tenantId, tenant.id),
                  eq(staff.email, user.email!),
                ),
              )
              .limit(1);

            if (staffMember) {
              userRole = normalizeRole(staffMember.role);
            }

            // Create role assignment for future use
            try {
              await db
                .insert(userRoles)
                .values({
                  userId: user.id,
                  tenantId: tenant.id,
                  role: userRole,
                  updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: [userRoles.userId, userRoles.tenantId],
                  set: {
                    role: userRole,
                    updatedAt: new Date(),
                  },
                });
            } catch (error) {
              console.error("[NextAuth] Failed to upsert user role:", error);
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: userRole,
            tenantSlug: credentials.tenantSlug as string,
            rememberMe: credentials.rememberMe === true,
          };
        } catch (error) {
          console.error("[NextAuth] Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // Default max age, will be overridden by rememberMe setting
    maxAge: 24 * 60 * 60, // 1 day (reduced from 14 days for security)
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }: any) {
      // Allow OAuth sign-ins and credentials
      if (
        account?.provider === "google" ||
        account?.provider === "credentials"
      ) {
        // For Google OAuth, ensure user exists in database
        if (account?.provider === "google" && user?.email) {
          try {
            // Find or create user
            let [existingUser] = await db
              .select()
              .from(users)
              .where(eq(users.email, user.email))
              .limit(1);

            if (!existingUser) {
              // Create new user for Google OAuth
              const [newUser] = await db
                .insert(users)
                .values({
                  id: crypto.randomUUID(),
                  email: user.email,
                  name: user.name || user.email?.split("@")[0],
                  image: user.image,
                })
                .returning();

              existingUser = newUser;
            }

            // The role will be set in the JWT callback from database
            return true;
          } catch (error) {
            console.error("[NextAuth] Error in Google OAuth signIn:", error);
            return false;
          }
        }

        return true;
      }

      return false;
    },
    async session({ session, token, request }: any) {
      if (session?.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tenantSlug = token.tenantSlug;

        // Validate tenant context on each session request
        // This ensures that the session is only valid for the intended tenant
        if (request) {
          const url = new URL(request.url);
          const pathname = url.pathname;

          // Extract tenant from URL path (/t/{tenant}/*)
          if (pathname.startsWith("/t/")) {
            const pathSegments = pathname.split("/");
            if (pathSegments.length >= 3) {
              const urlTenantSlug = pathSegments[2];

              // If the URL tenant doesn't match the session tenant, invalidate session
              if (urlTenantSlug !== token.tenantSlug) {
                console.warn(
                  `[NextAuth] Session tenant mismatch: session is for '${token.tenantSlug}' but URL is for '${urlTenantSlug}' - invalidating session`,
                );

                // Clear session data to force re-authentication
                session.user = null;
                session.error = "tenant_mismatch";
                return session;
              }
            }
          }
        }
      }
      return session;
    },
    async jwt({ token, user, trigger, session, request }: any) {
      // Validate tenant context on each JWT request
      if (request && token.tenantSlug) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // Extract tenant from URL path (/t/{tenant}/*)
        if (pathname.startsWith("/t/")) {
          const pathSegments = pathname.split("/");
          if (pathSegments.length >= 3) {
            const urlTenantSlug = pathSegments[2];

            // If the URL tenant doesn't match the token tenant, invalidate token
            if (urlTenantSlug !== token.tenantSlug) {
              console.warn(
                `[NextAuth] JWT tenant mismatch: token is for '${token.tenantSlug}' but URL is for '${urlTenantSlug}' - invalidating token`,
              );

              // Clear token data to force re-authentication
              return {
                ...token,
                id: null,
                tenantSlug: null,
                role: null,
                error: "tenant_mismatch",
              };
            }
          }
        }
      }

      // Initial sign in - set token from user object
      if (user) {
        token.id = user.id;
        token.tenantSlug = user.tenantSlug;
        token.role = user.role; // Role is already set in the authorize function

        // Set session max age based on rememberMe parameter
        token.maxAge = user.rememberMe
          ? 30 * 24 * 60 * 60 // 30 days for "remember me"
          : 24 * 60 * 60; // 1 day for normal sessions
      }

      // Only fetch role from database if it's not already set and not during initial sign in
      // This significantly reduces database queries and improves performance
      if (token.id && token.tenantSlug && !token.role && trigger !== "signIn") {
        try {
          // Find the tenant ID and set RLS context in one operation
          const [tenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.slug, token.tenantSlug))
            .limit(1);

          if (tenant) {
            // SET RLS CONTEXT - CRITICAL FOR VIEWING ROLES
            try {
              await db.execute(
                sql`SELECT set_tenant_context(${tenant.id}::uuid)`,
              );
            } catch (rlsError) {
              console.error("[NextAuth] Failed to set RLS context:", rlsError);
            }

            // Fetch the latest role from database
            const [roleAssignment] = await db
              .select({ role: userRoles.role })
              .from(userRoles)
              .where(
                and(
                  eq(userRoles.userId, token.id),
                  eq(userRoles.tenantId, tenant.id),
                ),
              )
              .limit(1);

            token.role = roleAssignment?.role || "Cliente";
          } else {
            token.role = "Cliente";
          }
        } catch (error) {
          console.error("[NextAuth] Error fetching role:", error);
          token.role = "Cliente"; // Fallback to default role
        }
      }

      // Handle session updates (e.g., role change from profile page)
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }

      return token;
    },
  },
  events: {
    async signIn({ user, isNewUser }: any) {
      console.log("User signed in:", user.id, isNewUser ? "(new user)" : "");
    },
    async signOut() {
      // User signed out
    },
  },
});

export const { GET, POST } = handlers;
export {
  auth,
  signIn,
  signOut,
  handlers,
  validateApiKey,
  validateSimpleApiKey,
};
