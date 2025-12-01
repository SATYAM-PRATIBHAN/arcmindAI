import { useState } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

interface DoubtResponse {
  success: boolean;
  answer: string;
}

export function useAskDoubt() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askDoubt = async (
    generationId: string,
    question: string,
  ): Promise<DoubtResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${DOC_ROUTES.API.GENERATE.ROOT}/${generationId}/doubt`,
        { question },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = response.data;
      if (data.success) {
        return data;
      } else {
        setError(data.message || "An error occurred");
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    askDoubt,
    isLoading,
    error,
  };
}
