import axios from "axios";
import { useState, useEffect, useCallback } from "react";

interface FrontendStack {
  framework: string;
  language: string;
  styling: string[];
  stateManagement: string;
  formHandling: string;
  dataFetching: string;
  authentication: string;
  uiLibrary: string[];
  testing: string[];
  buildTools: string[];
}

interface FrontendPage {
  path: string;
  name: string;
  description: string;
  components: string[];
  apiIntegrations: string[];
}

interface FrontendComponent {
  name: string;
  type: "layout" | "ui" | "feature" | "form" | "shared";
  description: string;
  props?: Record<string, string>;
}

interface FrontendStructure {
  pages: FrontendPage[];
  components: FrontendComponent[];
  hooks: string[];
  services: string[];
  types: string[];
  utils: string[];
}

export interface FrontendArchitecture {
  stack: FrontendStack;
  structure: FrontendStructure;
  fileTree: string[];
  recommendations: string[];
}

interface UseFrontendStructureReturn {
  generateFrontendStructure: () => Promise<FrontendArchitecture | null>;
  isLoading: boolean;
  error: string | null;
  data: FrontendArchitecture | null;
  reset: () => void;
}

export const useFrontendStructure = (
  generationId?: string,
): UseFrontendStructureReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FrontendArchitecture | null>(null);

  const generateFrontendStructure = useCallback(async () => {
    if (!generationId) {
      setError("Generation ID is required");
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const axiosResponse = await axios.post(
        `/api/generate/${generationId}/frontendStructure`,
      );
      const result = axiosResponse.data;

      if (
        !axiosResponse.status ||
        axiosResponse.status < 200 ||
        axiosResponse.status >= 300 ||
        !result.success
      ) {
        throw new Error(
          result.message || "Failed to generate frontend structure",
        );
      }

      setData(result.data);
      return result.data;
    } catch (err) {
      const errorMessage =
        (err instanceof Error && err.message) ||
        (typeof err === "string" && err) ||
        "Something went wrong";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [generationId]);

  useEffect(() => {
    if (generationId) {
      generateFrontendStructure();
    }
  }, [generationId, generateFrontendStructure]);

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return { generateFrontendStructure, isLoading, error, data, reset };
};
