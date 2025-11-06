"use client";

import { SessionProvider } from "next-auth/react";
import { HistoryProvider } from "./contexts/HistoryContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HistoryProvider>{children}</HistoryProvider>
    </SessionProvider>
  );
}
