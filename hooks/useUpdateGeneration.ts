import { useState } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";
import { ArchitectureData } from "@/app/(protected)/generate/utils/types";

interface UpdateGenerationResponse {
  success?: boolean;
  output?: ArchitectureData;
  message?: string;
  error?: string;
}

export function useUpdateGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UpdateGenerationResponse | null>(null);

  const updateGeneration = async (
    generationId: string,
    userInput: string,
  ): Promise<UpdateGenerationResponse | null> => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.put(
        `${DOC_ROUTES.API.GENERATE.ROOT}/${generationId}`,
        { userInput },
      );

      if (response.status >= 200 && response.status < 300) {
        setData(response.data);
        return response.data;
      } else {
        const errorMessage =
          response.data?.message ||
          response.data?.error ||
          "Failed to update generation";
        setError(errorMessage);
        return response.data;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateGeneration,
    isLoading,
    error,
    data,
  };
}
