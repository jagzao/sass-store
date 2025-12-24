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
      },
      async authorize(credentials) {
        console.log("[NextAuth] Credentials authorize called with:", {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          tenantSlug: credentials?.tenantSlug,
        });

        if (
          !credentials?.email ||
          !credentials?.password ||
          !credentials?.tenantSlug
        ) {
          console.log("[NextAuth] Missing credentials or tenantSlug");
          return null;
        }

        try {
          // Find user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          console.log("[NextAuth] User found:", !!user);

          if (!user || !user.password) {
            console.log("[NextAuth] User not found or no password");
            return null;
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          console.log("[NextAuth] Password match:", passwordMatch);

          if (!passwordMatch) {
            console.log("[NextAuth] Password does not match");
            return null;
          }

          // Determine user role
          let userRole: RbacRole = "Cliente"; // Default role
          const [tenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.slug, credentials.tenantSlug as string))
            .limit(1);

          if (tenant) {
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

            if (roleAssignment) {
              userRole = roleAssignment.role as RbacRole;
            } else {
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
          }

          const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: userRole,
            tenantSlug: credentials.tenantSlug as string,
          };

          console.log(
            "[NextAuth] Authentication successful, returning:",
            userData,
          );

          return userData;
        } catch (error) {
          console.error("[NextAuth] Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days (reduced from 30 for security)
  },
  pages: {
    signIn: "/t/zo-system/login", // Default tenant login
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log("[NextAuth] signIn callback called:", {
        provider: account?.provider,
        userId: user?.id,
        userEmail: user?.email,
      });

      // Allow OAuth sign-ins and credentials
      if (
        account?.provider === "google" ||
        account?.provider === "credentials"
      ) {
        console.log(
          "[NextAuth] SignIn allowed for provider:",
          account?.provider,
        );

        // For Google OAuth, ensure user exists in database with proper role
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
              console.log(
                "[NextAuth] Created new user for Google OAuth:",
                newUser.id,
              );
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

      console.log("[NextAuth] SignIn denied for provider:", account?.provider);
      return false;
    },
    async session({ session, token }: any) {
      console.log("[NextAuth] Session callback called:", {
        hasSession: !!session,
        hasToken: !!token,
        tokenId: token?.id,
        sessionUserId: session?.user?.id,
      });

      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tenantSlug = token.tenantSlug;
        console.log("[NextAuth] Session updated with user data:", {
          id: token.id,
          role: token.role,
          tenantSlug: token.tenantSlug,
        });
      }

      console.log("[NextAuth] Returning session:", {
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userName: session?.user?.name,
        userRole: session?.user?.role,
        userTenantSlug: session?.user?.tenantSlug,
      });

      return session;
    },
    async jwt({ token, user, trigger, session }: any) {
      console.log("[NextAuth] JWT callback called:", {
        trigger,
        hasToken: !!token,
        hasUser: !!user,
        hasSession: !!session,
        tokenId: token?.id,
        userId: user?.id,
      });

      // Initial sign in - set token from user object
      if (user) {
        token.id = user.id;
        token.tenantSlug = user.tenantSlug;
        console.log("[NextAuth] JWT token updated with user data:", {
          id: user.id,
          tenantSlug: user.tenantSlug,
        });
      }

      // Always fetch the latest role from database for both sign-in and session updates
      // This ensures the role is always up-to-date, even after browser restart
      if (token.id && token.tenantSlug) {
        try {
          // Find the tenant ID
          const [tenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.slug, token.tenantSlug))
            .limit(1);

          if (tenant) {
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

            if (roleAssignment) {
              // Use the database value as source of truth
              token.role = roleAssignment.role;
              console.log(
                "[NextAuth] Role fetched from database:",
                roleAssignment.role,
              );
            } else {
              // If no role assignment exists, use default role
              token.role = "Cliente";
              console.warn(
                "[NextAuth] No role assignment found in database, using default: Cliente",
              );
            }
          } else {
            console.error("[NextAuth] Tenant not found:", token.tenantSlug);
            token.role = "Cliente";
          }
        } catch (error) {
          console.error("[NextAuth] Error fetching role from database:", error);
          // Fallback to default role on error
          token.role = "Cliente";
        }
      }

      // Handle session updates (e.g., role change from profile page)
      if (trigger === "update" && session) {
        console.log("[NextAuth] JWT update triggered:", session);

        // For role updates, we've already fetched from database above
        // Update other fields if needed
        if (session.name) token.name = session.name;
      }

      console.log("[NextAuth] Returning JWT token:", {
        id: token?.id,
        role: token?.role,
        tenantSlug: token?.tenantSlug,
      });
      return token;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }: any) {
      console.log("User signed in:", {
        userId: user.id,
        email: user.email,
        isNewUser,
      });
    },
    async signOut({ session, token }: any) {
      // SECURITY: Redacted sensitive log;
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
