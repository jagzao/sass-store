import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";

// Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV === "development", // Only enable in development
  formatError: (error) => {
    // Only log full error details in development
    if (process.env.NODE_ENV === "development") {
      console.error("GraphQL Error:", error);
    } else {
      // In production, log minimal info to avoid leaking sensitive data
      console.error("GraphQL Error:", {
        message: error.message,
        path: error.path,
      });
    }

    // In production, return sanitized error message
    if (process.env.NODE_ENV === "production") {
      return {
        message: "Internal server error",
        extensions: {
          code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
        },
      };
    }

    return error;
  },
});

// Create Next.js handler
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
