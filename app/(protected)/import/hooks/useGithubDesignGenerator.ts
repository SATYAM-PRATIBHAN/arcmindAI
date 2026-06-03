import { DOC_ROUTES } from "@/lib/routes";
import { RepositoryAnalysis } from "@/types/repository-analysis";
import { useCallback, useState } from "react";

interface UseGithubDesignGeneratorResult {
  generateDesign: (
    owner: string,
    repo: string,
    analysisData: RepositoryAnalysis,
    branch?: string,
  ) => Promise<void>;
  mermaidDiagram: string | null;
  generationId: string | null;
  loading: boolean;
  error: string | null;
}

export function useGithubDesignGenerator(): UseGithubDesignGeneratorResult {
  const [mermaidDiagram, setMermaidDiagram] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDesign = useCallback(
    async (
      owner: string,
      repo: string,
      analysisData: RepositoryAnalysis,
      branch?: string,
    ) => {
      setLoading(true);
      setError(null);
      setMermaidDiagram("");
      setGenerationId(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(DOC_ROUTES.API.GITHUB.GENERATE_DESIGN, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            owner,
            repo,
            analysisData,
            ...(branch ? { branch } : {}),
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.error || `HTTP error! status: ${response.status}`,
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let fullOutput = "";
        let buffer = "";

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
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.chunk) {
                  fullOutput += parsed.chunk;
                  setMermaidDiagram(fullOutput);
                }
                if (parsed.done && parsed.generationId) {
                  setGenerationId(parsed.generationId);
                }
              } catch (e) {
                console.error("Failed to parse SSE chunk:", e, dataStr);
              }
            }
          }
        }

        // Final cleanup of the diagram if needed
        const cleanedDiagram = fullOutput
          .replace(/```mermaid\n?/g, "")
          .replace(/```/g, "")
          .trim();

        setMermaidDiagram(cleanedDiagram);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setError(
            "Request timed out. Please check your connection and try again.",
          );
        } else {
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          setError(errorMessage);
          console.error("Design generation error:", err);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [],
  );

  return {
    generateDesign,
    mermaidDiagram,
    generationId,
    loading,
    error,
  };
}
