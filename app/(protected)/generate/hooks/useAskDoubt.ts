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
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const askDoubt = async (
    generationId: string,
    question: string,
    conversationHistory?: Array<{ question: string; answer: string }>
  ): Promise<DoubtResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${DOC_ROUTES.API.GENERATE.ROOT}/${generationId}/doubt`,
        { question, conversationHistory },
        {
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: (status) => status >= 200 && status < 300, // Only accept 2xx status codes
        }
      );

      const data = response.data;
      if (data.success) {
        return data;
      } else {
        setError(data.message || "An error occurred");
        return null;
      }
    } catch (err) {
      // Check if it's a 503 error (API key issue)
      if (axios.isAxiosError(err) && err.response?.status === 503) {
        setShowApiKeyDialog(true);
      }

      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : err instanceof Error
            ? err.message
            : "An error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const closeApiKeyDialog = () => {
    setShowApiKeyDialog(false);
  };

  return {
    askDoubt,
    isLoading,
    error,
    showApiKeyDialog,
    closeApiKeyDialog,
  };
}
