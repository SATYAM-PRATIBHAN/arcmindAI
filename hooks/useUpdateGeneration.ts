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
        {
          validateStatus: (status) => status < 500, // Don't throw for 4xx errors, only for 5xx
        },
      );

      if (response.status >= 200 && response.status < 300) {
        setData(response.data);
        return response.data;
      } else {
        const errorMessage =
          response.data?.message ||
          response.data?.error ||
          "Something went wrong";
        setError(errorMessage);
        return response.data;
      }
    } catch (err) {
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data?.message || err.message;
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
    updateGeneration,
    isLoading,
    error,
    data,
  };
}
