import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

interface GenerateResponse {
  success: boolean;
  output: string;
}

export function useGenerateSystem(refetchHistory?: () => Promise<any>) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Assumes you've installed axios (`npm install axios`) and imported it at the top of the file:
      // import axios from "axios";
      const response = await axios.post("/api/generate", {
        userInput,
        // @ts-expect-error accessToken is added to session in NextAuth callbacks
        userId: session?.user.id,
      });

      // Axios responses have data directly, and do not use .ok or .json()
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
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
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
  };
}
