import { useEffect, useState } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

interface ResetPasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export function useResetPassword(token?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const validate = async () => {
      if (!token) {
        if (isMounted) setIsTokenValid(false);
        return;
      }
      setIsValidating(true);
      try {
        const response = await axios.get(
          `${DOC_ROUTES.API.AUTH.RESET_PASSWORD}?token=${encodeURIComponent(token)}`,
        );
        if (isMounted) setIsTokenValid(Boolean(response.data?.valid));
      } catch {
        if (isMounted) setIsTokenValid(false);
      } finally {
        if (isMounted) setIsValidating(false);
      }
    };
    validate();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const resetPassword = async (
    token: string,
    password: string,
  ): Promise<ResetPasswordResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(DOC_ROUTES.API.AUTH.RESET_PASSWORD, {
        token,
        password,
      });

      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        setError(
          response.data?.error ||
            response.data?.message ||
            "Failed to reset password",
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
    resetPassword,
    isLoading,
    error,
    isTokenValid,
    isValidating,
  };
}
