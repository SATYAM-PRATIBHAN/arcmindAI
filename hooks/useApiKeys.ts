import { APIKeyProvider } from "@/lib/crypto/encryption";
import { DOC_ROUTES } from "@/lib/routes";
import axios from "axios";
import { useState } from "react";

export interface ApiKeyStatus {
  hasGeminiKey: boolean;
  hasOpenAIKey: boolean;
}

type Response = { success: boolean; message?: string };

function parseErrorMessage(err: unknown, defaultMessage: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || defaultMessage;
  }
  return err instanceof Error ? err.message : defaultMessage;
}

export function useApiKeys() {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  // Status loading/refreshing
  const [isLoading, setIsLoading] = useState(false);
  // A save/delete request that mutates the status
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (): Promise<void> => {
    const response = await axios.get(DOC_ROUTES.API.USER_API_KEYS);
    setApiKeyStatus(response?.data as ApiKeyStatus);
  };

  const refreshApiKeyStatus = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchStatus();
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to load API key status"));
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKeys = async (keys: {
    geminiApiKey?: string;
    openaiApiKey?: string;
  }): Promise<Response> => {
    setIsMutating(true);
    setError(null);
    try {
      const response = await axios.post(DOC_ROUTES.API.USER_API_KEYS, keys);
      await fetchStatus();
      return { success: !!response.data?.success };
    } catch (err) {
      const message = parseErrorMessage(err, "Failed to save API keys");
      setError(message);
      return { success: false, message };
    } finally {
      setIsMutating(false);
    }
  };

  const deleteApiKey = async (provider: APIKeyProvider): Promise<Response> => {
    setIsMutating(true);
    setError(null);
    try {
      const response = await axios.delete(DOC_ROUTES.API.USER_API_KEYS, {
        params: { provider },
      });
      await fetchStatus();
      return { success: !!response.data?.success };
    } catch (err) {
      const message = parseErrorMessage(err, "Failed to remove API key");
      setError(message);
      return { success: false, message };
    } finally {
      setIsMutating(false);
    }
  };

  return {
    apiKeyStatus,
    refreshApiKeyStatus,
    saveApiKeys,
    deleteApiKey,
    isLoading,
    isMutating,
    error,
  };
}
