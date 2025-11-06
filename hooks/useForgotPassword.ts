import { useState } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

interface ForgotPasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forgotPassword = async (
    email: string,
  ): Promise<ForgotPasswordResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(DOC_ROUTES.API.AUTH.FORGOT_PASSWORD, {
        email,
      });

      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        setError(
          response.data?.error ||
            response.data?.message ||
            "Failed to send reset link",
        );
        return response.data;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    forgotPassword,
    isLoading,
    error,
  };
}
