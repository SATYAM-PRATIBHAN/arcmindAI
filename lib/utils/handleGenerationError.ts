"use client";

import { toast } from "sonner";

/**
 * Handles API generation errors and shows appropriate toast notifications
 * @param error - The error object from the API
 * @param openApiKeyDialog - Function to open the API key dialog
 * @returns True if the error was handled, false otherwise
 */
export function handleGenerationError(
  error: unknown,
  openApiKeyDialog: () => void
): boolean {
  // Check if it's a fetch response error
  if (error instanceof Response) {
    if (error.status === 503) {
      // Service unavailable - API keys failed
      toast.error("Having trouble generating your design", {
        description:
          "Our API keys are experiencing issues. Add your personal API keys to continue.",
        action: {
          label: "Add API Keys",
          onClick: openApiKeyDialog,
        },
        duration: 10000, // Show for 10 seconds
      });
      return true;
    }
  }

  // Check if it's an error object with status
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 503
  ) {
    toast.error("Having trouble generating your design", {
      description:
        "Our API keys are experiencing issues. Add your personal API keys to continue.",
      action: {
        label: "Add API Keys",
        onClick: openApiKeyDialog,
      },
      duration: 10000,
    });
    return true;
  }

  // Check error message for API key related issues
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  const isApiKeyError =
    errorMessage.toLowerCase().includes("api key") ||
    errorMessage.toLowerCase().includes("rate limit") ||
    errorMessage.toLowerCase().includes("quota") ||
    errorMessage.toLowerCase().includes("too many requests") ||
    errorMessage.toLowerCase().includes("unauthorized") ||
    errorMessage.toLowerCase().includes("authentication");

  if (isApiKeyError) {
    toast.error("Having trouble generating your design", {
      description:
        "Our API keys are experiencing issues. Add your personal API keys to continue.",
      action: {
        label: "Add API Keys",
        onClick: openApiKeyDialog,
      },
      duration: 10000,
    });
    return true;
  }

  return false;
}

/**
 * Handles fetch errors from API calls
 * @param response - The fetch response
 * @param openApiKeyDialog - Function to open the API key dialog
 */
export async function handleFetchError(
  response: Response,
  openApiKeyDialog: () => void
): Promise<void> {
  if (response.status === 503) {
    toast.error("Having trouble generating your design", {
      description:
        "Our API keys are experiencing issues. Add your personal API keys to continue.",
      action: {
        label: "Add API Keys",
        onClick: openApiKeyDialog,
      },
      duration: 10000,
    });
    return;
  }

  // Try to get error message from response
  try {
    const data = await response.json();
    if (data.error) {
      toast.error(data.error);
    } else {
      toast.error("Failed to generate design");
    }
  } catch {
    toast.error("Failed to generate design");
  }
}
