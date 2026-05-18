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

  const generate = async (
    userInput: string,
  ): Promise<{ success: boolean; output?: string; error?: string } | null> => {
    // @ts-expect-error accessToken is added to session in NextAuth callbacks
    if (!session?.user?.accessToken) {
      const msg = "No access token available. Please log in.";
      setError(msg);
      return { success: false, error: msg };
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
        errorMessage =
          err.response?.data?.error || err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generate,
    isLoading,
    error,
  };
}
