import axios from "axios";
import { useState, useEffect, useCallback, useRef } from "react";

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
  showApiKeyDialog: boolean;
  closeApiKeyDialog: () => void;
}

export const useFrontendStructure = (
  generationId?: string,
): UseFrontendStructureReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FrontendArchitecture | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // Track if we've already fetched data for this generation to prevent duplicate requests
  const hasFetchedRef = useRef(false);
  const currentGenerationIdRef = useRef<string | undefined>(undefined);

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
        {},
        {
          validateStatus: (status) => status >= 200 && status < 300, // Only accept 2xx status codes
        },
      );
      const result = axiosResponse.data;

      if (!result.success) {
        throw new Error(
          result.message || "Failed to generate frontend structure",
        );
      }

      setData(result.data);
      hasFetchedRef.current = true;
      return result.data;
    } catch (err) {
      // Check if it's a 503 error (API key issue)
      if (axios.isAxiosError(err) && err.response?.status === 503) {
        setShowApiKeyDialog(true);
      }

      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : (err instanceof Error && err.message) ||
            (typeof err === "string" && err) ||
            "Something went wrong";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [generationId]);

  useEffect(() => {
    // Reset fetch tracking when generationId changes
    if (currentGenerationIdRef.current !== generationId) {
      hasFetchedRef.current = false;
      currentGenerationIdRef.current = generationId;
    }

    // Only fetch if we have a generationId and haven't fetched yet
    if (generationId && !hasFetchedRef.current) {
      hasFetchedRef.current = true; // Set immediately to prevent duplicate calls
      generateFrontendStructure();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId]); // Only depend on generationId, not generateFrontendStructure

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
    hasFetchedRef.current = false; // Allow re-fetching after reset
  };

  const closeApiKeyDialog = () => {
    setShowApiKeyDialog(false);
  };

  return {
    generateFrontendStructure,
    isLoading,
    error,
    data,
    reset,
    showApiKeyDialog,
    closeApiKeyDialog,
  };
};
