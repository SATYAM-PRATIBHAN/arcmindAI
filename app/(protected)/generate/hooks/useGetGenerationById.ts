import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Generation {
  id: string;
  userInput: string;
  createdAt: Date;
  generatedOutput: any;
}

interface GenerationResponse {
  success: boolean;
  output: Generation;
}

export function useGetGenerationById() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getGenerationById = async (
    id: string,
  ): Promise<GenerationResponse | null> => {
    // @ts-expect-error accessToken is added to session in NextAuth callbacks
    if (!session?.user?.accessToken) {
      setError("No access token available. Please log in.");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/generate/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GenerationResponse = response.data;
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
    getGenerationById,
    isLoading,
    error,
  };
}
