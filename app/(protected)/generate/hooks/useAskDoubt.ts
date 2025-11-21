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

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DoubtResponse = response.data;
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

  return {
    askDoubt,
    isLoading,
    error,
  };
}
