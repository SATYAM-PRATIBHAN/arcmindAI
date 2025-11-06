import { DOC_ROUTES } from "@/lib/routes";
import { useState } from "react";
import axios from "axios";

interface UpdatePasswordResponse {
  success?: boolean;
  output?: string;
  status?: number;
  message?: string;
}

export function useUpdatePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePassword = async (
    previousPassword: string,
    newPassword: string,
  ): Promise<UpdatePasswordResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(DOC_ROUTES.API.AUTH.UPDATE_PASSWORD, {
        previousPassword,
        newPassword,
      });

      const data: UpdatePasswordResponse = response.data;

      if (response.status >= 200 && response.status < 300) {
        return data;
      } else {
        setError(data.message || "Failed to update password");
        return data;
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
    updatePassword,
    isLoading,
    error,
  };
}
