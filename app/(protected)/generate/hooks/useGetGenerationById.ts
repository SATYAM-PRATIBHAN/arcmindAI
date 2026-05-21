import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";
import type { ArchitectureData } from "../utils/types";

interface Generation {
  id: string;
  userInput: string;
  createdAt: Date;
  generatedOutput: ArchitectureData;
  githubGeneration?: string | null; // Mermaid diagram for GitHub repos
}

interface GenerationResponse {
  success: boolean;
  output: Generation;
}

export function useGetGenerationById() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = (session?.user as { accessToken?: string })?.accessToken;

  const getGenerationById = useCallback(
    async (id: string): Promise<GenerationResponse | null> => {
      if (!accessToken) {
        setError("No access token available. Please log in.");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
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
    },
    [accessToken],
  );

  return {
    getGenerationById,
    isLoading,
    error,
  };
}
