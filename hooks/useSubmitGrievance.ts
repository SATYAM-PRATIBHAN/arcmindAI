import { useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { GrievanceFormData } from "@/lib/validation/grievanceFormSchema";
import { DOC_ROUTES } from "@/lib/routes";

interface SubmitGrievanceResponse {
  success: boolean;
  error?: string;
}

export function useSubmitGrievance() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitGrievance = async (
    data: GrievanceFormData,
  ): Promise<SubmitGrievanceResponse> => {
    // @ts-expect-error id is added to session in NextAuth callbacks
    if (!session?.user?.id) {
      setError("No id available. Please log in.");
      return {
        success: false,
        error: "No id available. Please log in.",
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${DOC_ROUTES.API.GRIEVANCE}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SubmitGrievanceResponse = response.data;
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitGrievance,
    isLoading,
    error,
  };
}
