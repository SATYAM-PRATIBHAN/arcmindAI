"use client";
import { SessionProvider } from "next-auth/react";
import { HistoryProvider } from "./contexts/HistoryContext";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        disableTransitionOnChange
      >
        <HistoryProvider>{children}</HistoryProvider>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}