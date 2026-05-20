import { DOC_ROUTES } from "@/lib/routes";
import { RepositoryAnalysis } from "@/types/repository-analysis";
import axios from "axios";
import { useState } from "react";

interface UseRepositoryAnalyzerResult {
  analyze: (owner: string, repo: string, branch?: string) => Promise<void>;
  analysis: RepositoryAnalysis | null;
  loading: boolean;
  error: string | null;
}

export function useRepositoryAnalyzer(): UseRepositoryAnalyzerResult {
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (owner: string, repo: string, branch?: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await axios.post(
        DOC_ROUTES.API.GITHUB.ANALYZE_REPOSITORY,
        {
          owner,
          repo,
          ...(branch ? { branch } : {}),
          // Note: githubToken is no longer sent from frontend
          // It's retrieved server-side for security
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to analyze repository");
      }

      setAnalysis(response.data.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Repository analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    analyze,
    analysis,
    loading,
    error,
  };
}
