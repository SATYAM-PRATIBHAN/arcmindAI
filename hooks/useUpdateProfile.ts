import { useState } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

export function useUpdateProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (formData: {
    username: string;
    avatar: File | null;
  }): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    if (formData.username) formDataToSend.append("username", formData.username);
    if (formData.avatar) formDataToSend.append("avatar", formData.avatar);

    try {
      const response = await axios.put(DOC_ROUTES.API.USER, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data;

      if (result.success) {
        return result;
      } else {
        setError(result.message || "Failed to update profile");
        return {
          success: false,
          message: result.message || "Failed to update profile",
        };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while updating the profile";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProfile, isLoading, error };
}
