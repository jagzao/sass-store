import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

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
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/t/zo-system/login", // Default tenant login
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Allow OAuth sign-ins
      if (account?.provider === "google") {
        return true;
      }
      return false;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
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
export { auth, signIn, signOut, handlers };
