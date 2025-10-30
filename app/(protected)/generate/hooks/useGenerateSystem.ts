import { useState } from "react";
import { useSession } from "next-auth/react";

interface GenerateResponse {
  success: boolean;
  output: string;
}

export function useGenerateSystem() {
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
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // @ts-expect-error accessToken is added to session in NextAuth callbacks
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({ 
          userInput,
          // @ts-expect-error accessToken is added to session in NextAuth callbacks
          userId: session?.user.id,

        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GenerateResponse = await response.json();
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
