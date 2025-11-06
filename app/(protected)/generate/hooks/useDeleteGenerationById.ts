import { DOC_ROUTES } from "@/lib/routes";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { ArchitectureData } from "../utils/types";

interface Generation {
  id: string;
  userInput: string;
  createdAt: Date;
  generatedOutput: ArchitectureData;
}

interface GenerationResponse {
  success: boolean;
  output: Generation;
}

export function useDeleteGenerationById() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteGeneration = async (
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
      const response = await axios.delete(
        `${DOC_ROUTES.API.GENERATE.ROOT}/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

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
    deleteGeneration,
    isLoading,
    error,
  };
}
