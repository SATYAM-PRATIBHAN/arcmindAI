import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Generation {
  id: string;
  userInput: string;
  createdAt: Date;
  systemName: string;
}

interface HistoryResponse {
  success: boolean;
  output: Generation[];
}

export function useGetUserHistory() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (): Promise<HistoryResponse | null> => {
    // @ts-expect-error accessToken is added to session in NextAuth callbacks
    if (!session?.user?.accessToken) {
      setError("No access token available. Please log in.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api/generate/history", {
        headers: {
          "Content-Type": "application/json",
          // @ts-expect-error accessToken is added to session in NextAuth callbacks
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: HistoryResponse = response.data;
      if (data.success) {
        setHistory(data.output);
      }
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getHistory = fetchHistory;

  const refetch = fetchHistory;

  useEffect(() => {
    fetchHistory();
  }, [session]);

  return {
    history,
    getHistory,
    refetch,
    isLoading,
    error,
  };
}
