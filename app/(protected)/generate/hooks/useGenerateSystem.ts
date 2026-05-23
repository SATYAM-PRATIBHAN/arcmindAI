import { DOC_ROUTES } from "@/lib/routes";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface GenerateResponse {
  success: boolean;
  output: string;
}

interface GenerateError {
  error: string;
  retryAfter?: string;
}
export function useGenerateSystem(refetchHistory?: () => Promise<void>) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const generate = async (
    userInput: string,
  ): Promise<GenerateResponse | null> => {
    // @ts-expect-error accessToken is added to session in NextAuth callbacks
    if (!session?.user?.accessToken) {
      setError("No access token available. Please log in.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(DOC_ROUTES.API.GENERATE.ROOT, {
        userInput,
        // @ts-expect-error accessToken is added to session in NextAuth callbacks
        userId: session?.user.id,
      });

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
      let errorMessage = "An error occurred";
      if (axios.isAxiosError(err)) {
        const data: GenerateError = err.response?.data || {};
        errorMessage =
          data.error ||
          `HTTP error! status: ${err.response?.status} (${err.code})`;

        if (err.response?.status === 429 && data.retryAfter) {
          const secondsLeft = Math.ceil(
            (new Date(data.retryAfter).getTime() - Date.now()) / 1000,
          );
          setRetryAfter(Math.max(secondsLeft, 1));
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generate,
    isLoading,
    error,
    retryAfter,
  };
}
