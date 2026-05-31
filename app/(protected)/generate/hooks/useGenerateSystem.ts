import { useState } from "react";
import { useSession } from "next-auth/react";
import { DOC_ROUTES } from "@/lib/routes";
import { ArchitectureData } from "../utils/types";

interface GenerateResponse {
  success: boolean;
  output: string;
  parsedData?: ArchitectureData;
  generationId?: string;
  limit?: number;
  remaining?: number;
  reset?: string;
}

export function useGenerateSystem(refetchHistory?: () => Promise<void>) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const generate = async (
    userInput: string,
    onChunk?: (chunk: string) => void,
  ): Promise<GenerateResponse | null> => {
    setIsLoading(true);
    setError(null);
    setRetryAfter(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(DOC_ROUTES.API.GENERATE.ROOT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          userInput,
          // @ts-expect-error id is added to session in NextAuth callbacks
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));

        if (response.status === 429 && errorBody.retryAfter) {
          const secondsLeft = Math.ceil(
            (new Date(errorBody.retryAfter).getTime() - Date.now()) / 1000,
          );
          setRetryAfter(Math.max(secondsLeft, 1));
        }

        throw new Error(
          errorBody.error || `HTTP error! status: ${response.status}`,
        );
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let output = "";
      let buffer = "";
      let parsedData = null;
      let generationId: string | undefined = undefined;
      let limitInfo = {
        limit: undefined,
        remaining: undefined,
        reset: undefined,
      };

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        buffer += chunkText;

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const dataStr = part.slice(6);
            if (!dataStr || dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed && typeof parsed.chunk === "string") {
                output += parsed.chunk;
                // Real-time UI update with streaming chunks
                onChunk?.(parsed.chunk);
              }

              if (parsed.done) {
                if (parsed.parsedData) parsedData = parsed.parsedData;
                if (parsed.generationId) generationId = parsed.generationId;

                limitInfo = {
                  limit: parsed.limit,
                  remaining: parsed.remaining,
                  reset: parsed.reset,
                };
              }
            } catch (e) {
              if (e instanceof Error && e.message === "Streaming failed")
                throw e;
              console.error("Failed to parse SSE chunk:", dataStr);
            }
          }
        }
      }

      reader.releaseLock();

      if (!output?.trim()) {
        throw new Error(
          "Empty AI response. Possible causes: unauthorized request (401), middleware block, or backend failure.",
        );
      }

      const data: GenerateResponse = {
        success: true,
        output,
        parsedData,
        generationId,
        ...limitInfo,
      };

      // Refetch history only for logged-in users after successful generation
      // @ts-expect-error id is added to session in NextAuth callbacks
      if (data.success && refetchHistory && session?.user?.id) {
        await refetchHistory();
      }

      return data;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError(
          "Request timed out. Please check your connection and try again.",
        );
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
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
