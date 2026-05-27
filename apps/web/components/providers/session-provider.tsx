"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface AuthSessionProviderProps {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchOnWindowFocus={false}
      // Don't poll the session endpoint — rely on explicit refresh after sign-in/out
      refetchInterval={0}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
