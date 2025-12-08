import { useState, useCallback } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";
import { RepositoryAnalysis } from "@/types/repository-analysis";

interface UseGithubDesignGeneratorResult {
  generateDesign: (
    owner: string,
    repo: string,
    analysisData: RepositoryAnalysis,
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
    async (owner: string, repo: string, analysisData: RepositoryAnalysis) => {
      setLoading(true);
      setError(null);
      setMermaidDiagram(null);
      setGenerationId(null);

      try {
        const response = await axios.post(
          DOC_ROUTES.API.GITHUB.GENERATE_DESIGN,
          {
            owner,
            repo,
            analysisData,
          },
        );

        if (!response.data.success) {
          throw new Error(response.data.error || "Failed to generate design");
        }

        setMermaidDiagram(response.data.mermaidDiagram);
        setGenerationId(response.data.generationId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        console.error("Design generation error:", err);
      } finally {
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
