"use client";

import { SessionProvider as NextAuthProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthProvider 
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthProvider>
  );
}
