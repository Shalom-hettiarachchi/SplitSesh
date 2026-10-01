"use client";

import { createContext, useContext } from "react";
import type { SessionPayload } from "@/lib/auth";

const SessionContext = createContext<SessionPayload | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionPayload;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionPayload {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
