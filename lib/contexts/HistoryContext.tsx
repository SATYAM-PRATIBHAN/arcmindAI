"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

interface Generation {
  id: string;
  userInput: string;
  createdAt: Date;
  systemName: string;
}

interface HistoryContextType {
  history: Generation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [history, setHistory] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    // @ts-expect-error accessToken is added to session in NextAuth callbacks
    if (!session?.user?.accessToken) {
      setError("No access token available. Please log in.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(DOC_ROUTES.API.GENERATE.HISTORY, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = response.data;
      if (data.success) {
        setHistory(data.output);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = fetchHistory;

  useEffect(() => {
    // @ts-expect-error id is added to session in NextAuth callbacks
    const userId = session?.user?.id;
    if (userId) {
      fetchHistory();
    }
  }, [
    // @ts-expect-error id is added to session in NextAuth callbacks
    session?.user?.id,
  ]);

  return (
    <HistoryContext.Provider value={{ history, isLoading, error, refetch }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
