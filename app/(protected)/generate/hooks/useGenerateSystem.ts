import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

interface GenerateResponse {
  success: boolean;
  output: string;
}

export function useGenerateSystem(refetchHistory?: () => Promise<void>) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const generate = async (
    userInput: string
  ): Promise<GenerateResponse | null> => {
    // @ts-expect-error accessToken is added to session in NextAuth callbacks
    if (!session?.user?.accessToken) {
      setError("No access token available. Please log in.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        DOC_ROUTES.API.GENERATE.ROOT,
        {
          userInput,
          // @ts-expect-error accessToken is added to session in NextAuth callbacks
          userId: session?.user.id,
        },
        {
          validateStatus: (status) => status >= 200 && status < 300, // Only accept 2xx status codes
        }
      );

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: GenerateResponse = response.data;

      // Refetch history after successful generation
      if (data.success && refetchHistory) {
        await refetchHistory();
      }

      return data;
    } catch (err) {
      // Check if it's a 503 error (API key issue)
      if (axios.isAxiosError(err) && err.response?.status === 503) {
        setShowApiKeyDialog(true);
      }

      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
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
    generate,
    isLoading,
    error,
    showApiKeyDialog,
    closeApiKeyDialog,
  };
}
